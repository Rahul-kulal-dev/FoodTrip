import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { getFoodItemFallbackImage } from '../constants/imageConstants';

const CartContext = createContext();

const DEBOUNCE_DELAY_MS = 300;

const toId = (val) => (val !== undefined && val !== null ? String(val) : '');

export const CartProvider = ({ children }) => {
  const { isAuthenticated, user, role } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [subtotal, setSubtotal] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [conflictData, setConflictData] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [selectedLocation, setSelectedLocation] = useState('Bangalore, Karnataka');
  const [searchQuery, setSearchQuery] = useState('');

  const syncMapRef = useRef(new Map());

  const cartItemsRef = useRef(cartItems);
  cartItemsRef.current = cartItems;
  const restaurantRef = useRef(restaurant);
  restaurantRef.current = restaurant;

  const [addresses, setAddresses] = useState(() => {
    try {
      const saved = localStorage.getItem('savedAddresses');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  useEffect(() => {
    localStorage.setItem('savedAddresses', JSON.stringify(addresses));
  }, [addresses]);

  useEffect(() => {
    if (!user) {
      setAddresses([]);
      setSelectedAddressId(null);
      return;
    }

    if (user.addresses && user.addresses.length > 0) {
      setAddresses(user.addresses);
      setSelectedAddressId(user.addresses[0].id || user.addresses[0]._id);
    } else {
      setAddresses([]);
      setSelectedAddressId(null);
    }
  }, [user]);

  const addAddress = (newAddr) => {
    const id = newAddr.id || `addr-${Date.now()}`;
    const addressType = (newAddr.addressType || 'HOME').toUpperCase();
    const formatted = { ...newAddr, id, addressType };
    setAddresses((prev) => {
      const exists = prev.some((a) => (a.id || a._id) === id);
      return exists ? prev.map((a) => ((a.id || a._id) === id ? { ...a, ...formatted } : a)) : [...prev, formatted];
    });
    setSelectedAddressId(id);
  };

  const updateAddress = (id, updatedFields) => {
    setAddresses((prev) =>
      prev.map((addr) => (addr.id === id ? { ...addr, ...updatedFields } : addr))
    );
  };

  const saveCartToStorage = useCallback((items, restObj) => {
    const calcSubtotal = items.reduce((acc, item) => acc + ((item.price || 0) * (item.quantity || 1)), 0);
    const calcDelivery = items.length > 0 ? 40 : 0;
    const calcTotal = calcSubtotal + calcDelivery;

    setSubtotal(calcSubtotal);
    setDeliveryFee(calcDelivery);
    setTotalAmount(calcTotal);
    setRestaurant(restObj);

    try {
      localStorage.setItem('localCart', JSON.stringify({
        items,
        restaurant: restObj,
        subtotal: calcSubtotal,
        deliveryFee: calcDelivery,
        totalAmount: calcTotal,
      }));
    } catch (e) {
      console.warn('Failed to cache cart to localStorage:', e);
    }
  }, []);

  const getLocalCart = useCallback(() => {
    try {
      const stored = localStorage.getItem('localCart');
      if (stored) return JSON.parse(stored);
    } catch {}
    return { items: [], restaurant: null, subtotal: 0, deliveryFee: 0, totalAmount: 0 };
  }, []);

  const applyCartData = useCallback((data) => {
    if (!data) return;
    const rawItems = data.items || data.foodItems || [];

    let restObj = data.restaurant || null;
    const normalizedItems = rawItems.map((item) => {
      const food = item.foodItem || {};
      const rawFoodId = food.id || item.foodItemId || item.itemId || item._id || item.id;
      const foodId = toId(rawFoodId);

      const syncEntry = syncMapRef.current.get(foodId);
      const isPending = syncEntry && (
        syncEntry.timer !== null ||
        syncEntry.inFlight ||
        syncEntry.desiredQuantity !== syncEntry.lastSyncedQuantity
      );
      const effectiveQuantity = isPending ? syncEntry.desiredQuantity : (item.quantity !== undefined ? item.quantity : 1);

      if (!restObj && (item.restaurant || food.restaurant)) {
        restObj = item.restaurant || food.restaurant;
      }

      const existingItem = (cartItemsRef.current || []).find((i) => toId(i.id) === foodId || toId(i.foodItemId) === foodId);
      const itemName = item.name || food.name || existingItem?.name || '';
      const itemCategory = item.category || food.category || existingItem?.category || '';
      const resolvedImage = item.image 
        || food.image 
        || food.imageUrl 
        || food.image_url 
        || item.imageUrl 
        || existingItem?.image 
        || existingItem?.imageUrl 
        || getFoodItemFallbackImage(itemName, itemCategory);

      return {
        ...item,
        name: itemName,
        category: itemCategory,
        price: item.price !== undefined ? item.price : (food.price || 0),
        image: resolvedImage,
        isVeg: item.isVeg !== undefined ? item.isVeg : (food.isVeg !== undefined ? food.isVeg : true),
        restaurantName: item.restaurantName || food.restaurantName || food.restaurant?.name,
        restaurantId: item.restaurantId || food.restaurantId || food.restaurant?.id,
        restaurant: item.restaurant || food.restaurant,
        id: foodId,
        foodItemId: foodId,
        quantity: effectiveQuantity,
      };
    }).filter(i => (i.quantity > 0));

    setCartItems((prevItems) => {
      if (!prevItems || prevItems.length === 0) {
        saveCartToStorage(normalizedItems, restObj);
        return normalizedItems;
      }

      const incomingMap = new Map();
      normalizedItems.forEach((item) => {
        const key = toId(item.id || item.foodItemId);
        incomingMap.set(key, item);
      });

      const result = [];
      prevItems.forEach((existing) => {
        const key = toId(existing.id || existing.foodItemId);
        if (incomingMap.has(key)) {
          const incoming = incomingMap.get(key);
          result.push({
            ...existing,
            ...incoming,
            image: incoming.image || existing.image || getFoodItemFallbackImage(incoming.name, incoming.category),
          });
          incomingMap.delete(key);
        } else {
          const syncEntry = syncMapRef.current.get(key);
          const hasPendingSync = syncEntry && (
            syncEntry.timer !== null ||
            syncEntry.inFlight ||
            (syncEntry.desiredQuantity > 0 && syncEntry.desiredQuantity !== syncEntry.lastSyncedQuantity)
          );
          const userWantsItem = syncEntry ? syncEntry.desiredQuantity > 0 : (existing.quantity > 0);

          if (hasPendingSync || userWantsItem) {
            result.push(existing);
          }
        }
      });

      incomingMap.forEach((newItem) => {
        result.push(newItem);
      });

      saveCartToStorage(result, restObj);
      return result;
    });
  }, [saveCartToStorage]);

  const isCustomer = useCallback(() => {
    const userRole = (role || user?.role || '').toUpperCase();
    return Boolean(
      isAuthenticated &&
      (userRole === 'CUSTOMER' || userRole === 'ROLE_CUSTOMER' || userRole === 'ROLE_USER')
    );
  }, [isAuthenticated, role, user]);

  const processSync = useCallback(async (foodItemIdParam) => {
    if (!isCustomer()) return;

    const foodItemId = toId(foodItemIdParam);
    const entry = syncMapRef.current.get(foodItemId);
    if (!entry) return;

    if (entry.inFlight) {
      return;
    }

    if (entry.lastSyncedQuantity !== null && entry.desiredQuantity === entry.lastSyncedQuantity) {
      return;
    }

    entry.inFlight = true;
    const targetQuantity = entry.desiredQuantity;
    const targetVersion = entry.version;

    let hasError = false;
    let isFatalAuthError = false;

    try {
      let res;
      if (targetQuantity <= 0) {
        res = await cartAPI.removeItem(foodItemId);
      } else {
        res = await cartAPI.updateQuantity(foodItemId, { quantity: targetQuantity });
      }

      entry.lastSyncedQuantity = targetQuantity;

      if (entry.version === targetVersion && entry.desiredQuantity === targetQuantity) {
        if (res) {
          applyCartData(res);
        }
      }
    } catch (err) {
      hasError = true;
      console.error(`Error synchronizing cart item ${foodItemId}:`, err);
      setError(err.message || 'Failed to update item quantity');

      if (
        err.status === 401 ||
        err.status === 403 ||
        err.message?.toLowerCase().includes('forbidden') ||
        err.message?.toLowerCase().includes('unauthorized')
      ) {
        isFatalAuthError = true;
      }

      if (entry.timer) {
        clearTimeout(entry.timer);
        entry.timer = null;
      }
    } finally {
      entry.inFlight = false;

      if (isFatalAuthError) {
        return;
      }

      if (!hasError && entry.desiredQuantity !== entry.lastSyncedQuantity) {
        if (entry.timer) {
          clearTimeout(entry.timer);
          entry.timer = null;
        }
        processSync(foodItemId);
      }
    }
  }, [isCustomer, applyCartData]);

  const fetchCart = useCallback(async () => {
    const local = getLocalCart();
    applyCartData(local);

    if (!isCustomer()) return;

    try {
      setLoading(true);
      const backendCart = await cartAPI.getCart();
      if (backendCart) {
        applyCartData(backendCart);
      }
    } catch (e) {
      console.warn('Failed to fetch authoritative cart from backend:', e?.message || e);
    } finally {
      setLoading(false);
    }
  }, [isCustomer, getLocalCart, applyCartData]);

  useEffect(() => {
    let isCurrent = true;
    const initCart = async () => {
      const local = getLocalCart();
      applyCartData(local);

      if (!isCustomer()) return;

      try {
        if (local.items && local.items.length > 0) {
          const syncItems = local.items.map((i) => ({
            foodItemId: i.id || i.foodItemId || i._id,
            quantity: i.quantity || 1,
          }));
          await cartAPI.syncCart(syncItems);
        }
        const freshCart = await cartAPI.getCart();
        if (freshCart && isCurrent) {
          applyCartData(freshCart);
        }
      } catch (e) {
        console.warn('Cart reconciliation skipped or failed:', e?.message || e);
      }
    };

    initCart();
    return () => {
      isCurrent = false;
    };
  }, [isCustomer, getLocalCart, applyCartData]);

  const addToCart = async (dish, quantity = 1) => {
    setError(null);
    const local = getLocalCart();
    const incomingRestId = toId(dish.restaurantId || dish.restaurant?.id || dish.restaurant?._id);

    const activeItems = cartItemsRef.current.length > 0 ? cartItemsRef.current : (local.items || []);
    const currentRest = restaurantRef.current || local.restaurant;
    let currentRestId = toId(currentRest?.id || currentRest?._id);
    if (!currentRestId && activeItems.length > 0) {
      currentRestId = toId(activeItems[0].restaurantId || activeItems[0].restaurant?.id || activeItems[0].restaurant?._id);
    }

    if (activeItems.length > 0 && currentRestId && incomingRestId && incomingRestId !== currentRestId) {
      setConflictData({ dish, quantity, incomingRestId });
      return;
    }

    const foodItemId = toId(dish.id || dish._id || dish.foodItemId);

    let restObj = dish.restaurant || currentRest || local.restaurant;
    if (typeof restObj === 'string' || !restObj?.id) {
      restObj = {
        id: incomingRestId,
        name: typeof dish.restaurant === 'string' ? dish.restaurant : (currentRest?.name || local.restaurant?.name || '')
      };
    }

    const dishImage = dish.image || dish.imageUrl || getFoodItemFallbackImage(dish.name, dish.category);

    setCartItems((prevItems) => {
      const existing = prevItems.find((i) => toId(i.id) === foodItemId || toId(i.foodItemId) === foodItemId);
      let updated;
      if (existing) {
        updated = prevItems.map((i) => (toId(i.id) === foodItemId || toId(i.foodItemId) === foodItemId)
          ? { ...i, quantity: (i.quantity || 0) + quantity, image: i.image || dishImage }
          : i
        );
      } else {
        updated = [...prevItems, { ...dish, image: dishImage, id: foodItemId, foodItemId, quantity }];
      }
      saveCartToStorage(updated, restObj);
      return updated;
    });

    const existingInCart = cartItemsRef.current.find(
      (i) => toId(i.id) === foodItemId || toId(i.foodItemId) === foodItemId || toId(i._id) === foodItemId
    );
    const baseQuantity = existingInCart ? (existingInCart.quantity || 0) : 0;

    let entry = syncMapRef.current.get(foodItemId);
    if (!entry) {
      entry = {
        desiredQuantity: baseQuantity,
        inFlight: false,
        lastSyncedQuantity: existingInCart ? existingInCart.quantity : null,
        timer: null,
        version: 0,
      };
      syncMapRef.current.set(foodItemId, entry);
    }
    entry.desiredQuantity += quantity;
    entry.version += 1;

    if (isCustomer()) {
      if (entry.timer) clearTimeout(entry.timer);
      entry.timer = setTimeout(() => {
        entry.timer = null;
        processSync(foodItemId);
      }, DEBOUNCE_DELAY_MS);
    }
  };

  const setCartItemQuantity = (id, absoluteQuantity) => {
    setError(null);
    const targetQty = Math.max(0, Number(absoluteQuantity) || 0);

    const normId = toId(id);
    const existing = cartItemsRef.current.find(
      (i) => toId(i.id) === normId || toId(i.foodItemId) === normId || toId(i._id) === normId
    );
    const targetFoodItemId = toId(existing ? (existing.foodItemId || existing.id) : normId);

    setCartItems((prevItems) => {
      const itemExists = prevItems.find(
        (i) => toId(i.id) === targetFoodItemId || toId(i.foodItemId) === targetFoodItemId || toId(i._id) === targetFoodItemId
      );
      if (!itemExists) return prevItems;

      let updatedList;
      if (targetQty > 0) {
        updatedList = prevItems.map((i) =>
          (toId(i.id) === targetFoodItemId || toId(i.foodItemId) === targetFoodItemId || toId(i._id) === targetFoodItemId)
            ? { ...i, quantity: targetQty }
            : i
        );
      } else {
        updatedList = prevItems.filter((i) =>
          !(toId(i.id) === targetFoodItemId || toId(i.foodItemId) === targetFoodItemId || toId(i._id) === targetFoodItemId)
        );
      }

      saveCartToStorage(updatedList, restaurantRef.current);
      return updatedList;
    });

    let entry = syncMapRef.current.get(targetFoodItemId);
    if (!entry) {
      entry = {
        desiredQuantity: targetQty,
        inFlight: false,
        lastSyncedQuantity: existing ? existing.quantity : null,
        timer: null,
        version: 1,
      };
      syncMapRef.current.set(targetFoodItemId, entry);
    } else {
      entry.desiredQuantity = targetQty;
      entry.version += 1;
    }

    if (!isCustomer()) return;

    if (entry.timer) {
      clearTimeout(entry.timer);
    }

    entry.timer = setTimeout(() => {
      entry.timer = null;
      processSync(targetFoodItemId);
    }, DEBOUNCE_DELAY_MS);
  };

  const updateQuantity = (id, amount = 1) => {
    const normId = toId(id);
    const existing = cartItemsRef.current.find(
      (i) => toId(i.id) === normId || toId(i.foodItemId) === normId || toId(i._id) === normId
    );
    const targetFoodItemId = toId(existing ? (existing.foodItemId || existing.id) : normId);

    const entry = syncMapRef.current.get(targetFoodItemId);
    const currentQty = entry ? entry.desiredQuantity : (existing ? existing.quantity : 1);
    const newQty = Math.max(0, currentQty + amount);

    setCartItemQuantity(targetFoodItemId, newQty);
  };

  const removeFromCart = async (id) => {
    setError(null);

    const normId = toId(id);
    const existing = cartItemsRef.current.find(
      (i) => toId(i.id) === normId || toId(i.foodItemId) === normId || toId(i._id) === normId
    );
    const targetFoodItemId = toId(existing ? (existing.foodItemId || existing.id) : normId);

    setCartItems((prevItems) => {
      const updatedList = prevItems.filter(
        (i) => !(toId(i.id) === targetFoodItemId || toId(i.foodItemId) === targetFoodItemId || toId(i._id) === targetFoodItemId)
      );
      saveCartToStorage(updatedList, restaurantRef.current);
      return updatedList;
    });

    let entry = syncMapRef.current.get(targetFoodItemId);
    if (entry) {
      if (entry.timer) clearTimeout(entry.timer);
      entry.timer = null;
      entry.desiredQuantity = 0;
      entry.version += 1;
    } else {
      entry = {
        desiredQuantity: 0,
        inFlight: false,
        lastSyncedQuantity: null,
        timer: null,
        version: 1,
      };
      syncMapRef.current.set(targetFoodItemId, entry);
    }

    if (isCustomer()) {
      processSync(targetFoodItemId);
    }
  };

  const clearCart = async () => {
    setError(null);
    syncMapRef.current.forEach((val) => {
      if (val.timer) clearTimeout(val.timer);
    });
    syncMapRef.current.clear();

    setCartItems([]);
    setRestaurant(null);
    setSubtotal(0);
    setDeliveryFee(0);
    setTotalAmount(0);

    try {
      localStorage.removeItem('localCart');
    } catch {}

    if (isCustomer()) {
      try {
        await cartAPI.clearCart();
      } catch (err) {
        console.error('Failed to clear backend cart:', err);
      }
    }
  };

  const syncLocalCartToBackend = async () => {
    if (!isCustomer()) return;
    const local = getLocalCart();
    if (local.items && local.items.length > 0) {
      const syncItems = local.items.map((i) => ({
        foodItemId: i.id || i.foodItemId || i._id,
        quantity: i.quantity || 1,
      }));
      await cartAPI.syncCart(syncItems);
    }
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + (item.quantity || 0), 0);
  const taxesAndCharges = 0;

  const resolveConflict = async (clearAndAdd = false) => {
    if (clearAndAdd && conflictData) {
      const { dish, quantity, incomingRestId } = conflictData;
      const foodItemId = dish.id || dish._id || dish.foodItemId;
      const newItems = [{ ...dish, id: foodItemId, foodItemId, quantity }];

      let restObj = dish.restaurant;
      if (typeof restObj === 'string' || !restObj?.id) {
        restObj = { id: incomingRestId, name: typeof dish.restaurant === 'string' ? dish.restaurant : '' };
      }

      saveCartToStorage(newItems, restObj);
      setCartItems(newItems);

      if (isCustomer()) {
        try {
          await cartAPI.clearCart();
          const updated = await cartAPI.addItem(foodItemId, quantity);
          if (updated) applyCartData(updated);
        } catch (e) {
          console.error('Failed to switch restaurant cart on backend:', e);
        }
      }
    }
    setConflictData(null);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        restaurant,
        totalCartCount,
        subtotal,
        deliveryFee,
        taxesAndCharges,
        totalAmount,
        loading,
        error,
        setError,
        fetchCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        selectedLocation,
        setSelectedLocation,
        searchQuery,
        setSearchQuery,
        addresses,
        selectedAddressId,
        setSelectedAddressId,
        addAddress,
        updateAddress,
        syncLocalCartToBackend,
        conflictData,
        resolveConflict,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
