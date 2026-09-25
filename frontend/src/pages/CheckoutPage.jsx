import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home as HomeIcon,
  Building2,
  MapPin,
  Pencil,
  Plus,
  Banknote,
  CheckCircle2,
  ShoppingBag,
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { checkoutAPI, orderAPI, authAPI } from '../services/api';
import { getFoodItemFallbackImage } from '../constants/imageConstants';

export const CheckoutPage = () => {
  const {
    cartItems,
    subtotal: contextSubtotal,
    deliveryFee: contextDeliveryFee,
    totalAmount: contextTotal,
    clearCart,
    addresses: contextAddresses,
    addAddress,
    updateAddress,
  } = useCart();

  const navigate = useNavigate();

  const { user, updateUser } = useAuth();
  const [checkoutData, setCheckoutData] = useState(null);
  const [isLoadingCheckout, setIsLoadingCheckout] = useState(true);
  const [checkoutError, setCheckoutError] = useState(null);

  const [addresses, setAddresses] = useState(user?.addresses || contextAddresses || []);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  const validAddresses = useMemo(() => {
    return (addresses || []).filter(
      (a) => a && (a.houseFlat?.trim() || a.streetArea?.trim())
    );
  }, [addresses]);

  useEffect(() => {
    if (validAddresses.length > 0) {
      setSelectedAddressId((prev) => {
        if (prev && validAddresses.some((v) => (v.id || v._id) === prev)) {
          return prev;
        }
        return validAddresses[0].id || validAddresses[0]._id;
      });
    } else {
      setSelectedAddressId(null);
    }
  }, [validAddresses]);

  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressFormError, setAddressFormError] = useState(null);

  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    houseFlat: '',
    streetArea: '',
    city: '',
    state: '',
    pincode: '',
    addressType: 'HOME',
  });

  const [newAddressForm, setNewAddressForm] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    houseFlat: '',
    streetArea: '',
    city: '',
    state: '',
    pincode: '',
    addressType: 'HOME',
  });

  const [paymentMethod, setPaymentMethod] = useState('COD');

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState('');

  const loadCheckout = async () => {
    setIsLoadingCheckout(true);
    setCheckoutError(null);
    try {
      const data = await checkoutAPI.getCheckout();
      setCheckoutData(data);
      if (data.addresses && data.addresses.length > 0) {
        setAddresses(data.addresses);
        setSelectedAddressId((prev) => prev || data.addresses[0].id || data.addresses[0]._id);
      }
    } catch (err) {
      console.error('Failed to load checkout details:', err.message);
      if (!err.message || !err.message.includes('Cart is empty')) {
        setCheckoutError(err.message || 'Failed to load checkout details from backend');
      }
    } finally {
      setIsLoadingCheckout(false);
    }
  };

  useEffect(() => {
    loadCheckout();

    authAPI.getMe()
      .then((freshUser) => {
        if (freshUser) {
          if (freshUser.addresses && freshUser.addresses.length > 0) {
            const valid = freshUser.addresses.filter(
              (a) => a && (a.houseFlat?.trim() || a.streetArea?.trim())
            );
            setAddresses(valid);
            if (valid.length > 0) {
              setSelectedAddressId((prev) => (prev && valid.some(v => (v.id || v._id) === prev) ? prev : (valid[0].id || valid[0]._id)));
            }
          }
          if (updateUser) {
            updateUser(freshUser);
          }
        }
      })
      .catch((err) => console.warn('Could not fetch fresh user addresses:', err));
  }, []);

  useEffect(() => {
    if (user?.addresses && user.addresses.length > 0) {
      const valid = user.addresses.filter(
        (a) => a && (a.houseFlat?.trim() || a.streetArea?.trim())
      );
      setAddresses(valid);
      if (valid.length > 0) {
        setSelectedAddressId((prev) => (prev && valid.some(v => (v.id || v._id) === prev) ? prev : (valid[0].id || valid[0]._id)));
      }
    }
  }, [user]);

  useEffect(() => {
    if (isOrderPlaced) {
      const timer = setTimeout(() => {
        navigate('/orders');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOrderPlaced, navigate]);

  const handleSaveInitialAddress = async (e) => {
    if (e) e.preventDefault();
    if (!formData.houseFlat || !formData.streetArea || !formData.city || !formData.pincode) {
      setAddressFormError('Please fill out all required address fields.');
      return;
    }

    setAddressFormError(null);
    setIsSavingAddress(true);

    const constructedData = {
      fullName: (formData.fullName || user?.name || '').trim(),
      phone: (formData.phone || user?.phone || '').trim(),
      houseFlat: formData.houseFlat.trim(),
      streetArea: formData.streetArea.trim(),
      city: formData.city.trim(),
      state: formData.state ? formData.state.trim() : '',
      pincode: formData.pincode.trim(),
      addressType: (formData.addressType || 'HOME').toUpperCase(),
    };

    try {
      const res = await authAPI.updateProfile({ addresses: [constructedData] });
      const updatedList = res?.addresses || res?.user?.addresses || [];
      const valid = updatedList.filter(
        (a) => a && (a.houseFlat?.trim() || a.streetArea?.trim())
      );
      if (valid.length > 0) {
        setAddresses(valid);
        const newest = valid[valid.length - 1];
        setSelectedAddressId(newest.id || newest._id);
      }
      if (updateUser && res) {
        updateUser(res.user || res);
      }
      if (addAddress) {
        addAddress(newest || constructedData);
      }
    } catch (err) {
      console.error('Failed to save address to backend profile:', err);
      setAddressFormError('Failed to save address. Please try again.');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleOpenEditAddress = (addr) => {
    const addrId = addr.id || addr._id;
    setEditingAddressId(addrId);
    setSelectedAddressId(addrId);
    setIsAddingNewAddress(true);
    setAddressFormError(null);
    setNewAddressForm({
      fullName: addr.fullName || user?.name || '',
      phone: addr.phone || user?.phone || '',
      houseFlat: addr.houseFlat || '',
      streetArea: addr.streetArea || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      addressType: (addr.addressType || 'HOME').toUpperCase(),
    });
  };

  const handleCancelAddressForm = () => {
    setIsAddingNewAddress(false);
    setEditingAddressId(null);
    setAddressFormError(null);
  };

  const handleSaveNewAddress = async (e) => {
    if (e) e.preventDefault();
    if (!newAddressForm.houseFlat || !newAddressForm.streetArea || !newAddressForm.city || !newAddressForm.pincode) {
      setAddressFormError('Please fill out all required address fields.');
      return;
    }

    setAddressFormError(null);
    setIsSavingAddress(true);

    const constructedData = {
      fullName: (newAddressForm.fullName || user?.name || '').trim(),
      phone: (newAddressForm.phone || user?.phone || '').trim(),
      houseFlat: newAddressForm.houseFlat.trim(),
      streetArea: newAddressForm.streetArea.trim(),
      city: newAddressForm.city.trim(),
      state: newAddressForm.state ? newAddressForm.state.trim() : '',
      pincode: newAddressForm.pincode.trim(),
      addressType: (newAddressForm.addressType || 'HOME').toUpperCase(),
    };

    try {
      let addressesForBackend;
      if (editingAddressId) {
        const targetId = !editingAddressId.toString().startsWith('addr-') ? editingAddressId : undefined;
        addressesForBackend = (validAddresses || []).map((a) => {
          const actualId = a.id || a._id;
          if (actualId === editingAddressId) {
            return {
              ...constructedData,
              id: targetId,
            };
          }
          return {
            id: actualId && !actualId.toString().startsWith('addr-') ? actualId : undefined,
            fullName: a.fullName,
            phone: a.phone,
            houseFlat: a.houseFlat,
            streetArea: a.streetArea,
            city: a.city,
            state: a.state,
            pincode: a.pincode,
            addressType: (a.addressType || 'HOME').toUpperCase(),
          };
        });
      } else {
        const existingClean = (validAddresses || []).map((a) => {
          const actualId = a.id || a._id;
          return {
            id: actualId && !actualId.toString().startsWith('addr-') ? actualId : undefined,
            fullName: a.fullName,
            phone: a.phone,
            houseFlat: a.houseFlat,
            streetArea: a.streetArea,
            city: a.city,
            state: a.state,
            pincode: a.pincode,
            addressType: (a.addressType || 'HOME').toUpperCase(),
          };
        });
        addressesForBackend = [...existingClean, constructedData];
      }

      const res = await authAPI.updateProfile({ addresses: addressesForBackend });

      const updatedList = res?.addresses || res?.user?.addresses || [];
      const valid = updatedList.filter(
        (a) => a && (a.houseFlat?.trim() || a.streetArea?.trim())
      );
      if (valid.length > 0) {
        setAddresses(valid);
        if (editingAddressId) {
          const matched = valid.find((v) => (v.id || v._id) === editingAddressId);
          setSelectedAddressId(matched ? (matched.id || matched._id) : (valid[0].id || valid[0]._id));
        } else {
          const newest = valid[valid.length - 1];
          setSelectedAddressId(newest.id || newest._id);
        }
      }

      if (updateUser && res) {
        updateUser(res.user || res);
      }
      if (editingAddressId) {
        if (updateAddress) {
          updateAddress(editingAddressId, constructedData);
        }
      } else {
        if (addAddress) {
          const newest = valid && valid.length > 0 ? valid[valid.length - 1] : null;
          addAddress(newest || constructedData);
        }
      }

      setIsAddingNewAddress(false);
      setEditingAddressId(null);
    } catch (err) {
      console.error('Failed to save address to backend profile:', err);
      setAddressFormError('Failed to save address. Please try again.');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    setOrderError(null);

    const selectedAddr = validAddresses.find((a) => (a.id || a._id) === selectedAddressId);
    if (!selectedAddr) {
      setOrderError('Please select or save a delivery address before placing your order.');
      return;
    }

    if (!paymentMethod) {
      setOrderError('Please select a payment method.');
      return;
    }

    const deliveryAddressStr = [
      selectedAddr.houseFlat,
      selectedAddr.streetArea,
      selectedAddr.city,
      selectedAddr.state,
      selectedAddr.pincode,
    ].filter(Boolean).join(', ');
    const addressIdToSubmit = selectedAddr.id || selectedAddr._id;

    setIsPlacingOrder(true);
    try {
      const idempotencyKey = `idempotency-${Date.now()}`;
      const response = await orderAPI.create({
        deliveryAddress: deliveryAddressStr,
        addressId: addressIdToSubmit && !addressIdToSubmit.toString().startsWith('addr-') ? addressIdToSubmit : undefined,
        paymentMethod: paymentMethod.toUpperCase(),
        idempotencyKey,
      });

      const orderId = response.orderNumber || response.id || response.orderId || response._id;
      setPlacedOrderId(orderId);
      setIsOrderPlaced(true);
      if (clearCart) clearCart();
    } catch (err) {
      console.error('Failed to create order:', err.message);
      setOrderError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };
  const checkoutItems = checkoutData?.items || cartItems || [];
  const displaySubtotal = checkoutData?.subtotal !== undefined ? checkoutData.subtotal : contextSubtotal;
  const displayDeliveryFee = checkoutData?.deliveryFee !== undefined ? checkoutData.deliveryFee : contextDeliveryFee;
  const displayTotal = checkoutData?.totalAmount !== undefined ? checkoutData.totalAmount : contextTotal;

  const inputClass = `w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-[8px] sm:rounded-[10px] border text-[13px] sm:text-[14px] font-[500] transition-colors bg-white border-gray-200 text-gray-900 focus:outline-none focus:border-[#FF4B2B] focus:ring-1 focus:ring-[#FF4B2B]`;

  const isAddressReady = validAddresses.length > 0 && !!selectedAddressId;

  const isReadyToOrder = isAddressReady && !!paymentMethod;

  return (
    <div className="w-full min-h-screen bg-[#F9FAFB] pb-12 sm:pb-20 pt-4 sm:pt-6 font-poppins">
      <div className="max-w-[1240px] mx-auto px-3 sm:px-6 lg:px-8">

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6 sm:mb-8">
          <div>
            <h1 className="text-[22px] sm:text-[30px] md:text-[36px] font-[700] text-[#111827] tracking-tight">
              Checkout
            </h1>
            <p className="text-[12px] sm:text-[14px] text-[#6B7280] mt-0.5 sm:mt-1 font-[400]">
              Complete your order and track delivery in real-time
            </p>
          </div>
        </div>

        {checkoutError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-4 text-red-800 text-[14px] font-[500]">
            <div className="flex items-center space-x-2 min-w-0">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span className="truncate">{checkoutError}</span>
            </div>
            <button type="button" onClick={loadCheckout} className="text-[12px] font-[600] text-red-700 hover:text-red-900 underline shrink-0 cursor-pointer">
              Retry
            </button>
          </div>
        )}

        {orderError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-4 text-red-800 text-[14px] font-[500]">
            <div className="flex items-center space-x-2 min-w-0">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span className="truncate">{orderError}</span>
            </div>
            <button type="button" onClick={() => setOrderError(null)} className="text-[12px] font-[600] text-red-500 hover:text-red-700 cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {isLoadingCheckout ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-10 h-10 text-[#FF4B2B] animate-spin" />
            <p className="text-[#6B7280] font-[600] text-[16px]">Loading checkout details...</p>
          </div>
        ) : checkoutItems.length === 0 && !isOrderPlaced ? (
          <div className="bg-[#FFFFFF] rounded-[14px] p-12 text-center border border-[#F1F1F1] shadow-[0_4px_16px_rgba(0,0,0,0.06)] max-w-xl mx-auto my-8 space-y-6">
            <div className="w-20 h-20 bg-[#FFF1ED] rounded-full flex items-center justify-center mx-auto text-[#FF4B2B]">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-[24px] font-[700] text-[#111827]">Your cart is empty</h2>
              <p className="text-[14px] text-[#6B7280] font-[400]">Please add items to your cart before proceeding to checkout.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/restaurants-list')}
              className="inline-flex items-center space-x-2 bg-[#FF4B2B] hover:bg-[#e03a00] text-white px-6 py-[14px] rounded-[10px] font-[600] transition-all cursor-pointer shadow-md shadow-[#FF4B2B]/20"
            >
              <span>Browse Restaurants</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">

            <div className="order-1 lg:order-none lg:col-span-7 xl:col-span-8 w-full space-y-5 sm:space-y-6">

              <div className="bg-[#FFFFFF] rounded-[14px] sm:rounded-[16px] p-4 sm:p-6 md:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-[#F1F1F1]">
                <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
                  <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#FF4B2B] text-white font-[700] text-[12px] sm:text-[14px] flex items-center justify-center shadow-sm shrink-0">
                    1
                  </span>
                  <h2 className="text-[17px] sm:text-[22px] md:text-[24px] font-[700] text-[#111827] tracking-tight">
                    Delivery Address
                  </h2>
                </div>

                {validAddresses.length === 0 ? (
                  <div className="mt-4 sm:mt-6 animate-in fade-in duration-300">
                    <form onSubmit={handleSaveInitialAddress} className="space-y-3 sm:space-y-4">
                      {addressFormError && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-[8px]">
                          {addressFormError}
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="block text-[12px] sm:text-[13px] font-[600] text-[#111827] mb-1">Full Name</label>
                          <input
                            type="text"
                            required
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            className={inputClass}
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <label className="block text-[12px] sm:text-[13px] font-[600] text-[#111827] mb-1">Phone Number</label>
                          <input
                            type="tel"
                            required
                            maxLength="10"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })}
                            className={inputClass}
                            placeholder="9876543210"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[12px] sm:text-[13px] font-[600] text-[#111827] mb-1">House/Flat No.</label>
                        <input
                          type="text"
                          required
                          value={formData.houseFlat}
                          onChange={(e) => setFormData({ ...formData, houseFlat: e.target.value })}
                          className={inputClass}
                          placeholder="e.g. Flat 101, A Block"
                        />
                      </div>

                      <div>
                        <label className="block text-[12px] sm:text-[13px] font-[600] text-[#111827] mb-1">Street/Area</label>
                        <input
                          type="text"
                          required
                          value={formData.streetArea}
                          onChange={(e) => setFormData({ ...formData, streetArea: e.target.value })}
                          className={inputClass}
                          placeholder="e.g. 4th Cross, Koramangala"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        <div>
                          <label className="block text-[12px] sm:text-[13px] font-[600] text-[#111827] mb-1">City</label>
                          <input
                            type="text"
                            required
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className={inputClass}
                            placeholder="e.g. Bangalore"
                          />
                        </div>
                        <div>
                          <label className="block text-[12px] sm:text-[13px] font-[600] text-[#111827] mb-1">State</label>
                          <input
                            type="text"
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            className={inputClass}
                            placeholder="e.g. Karnataka"
                          />
                        </div>
                        <div>
                          <label className="block text-[12px] sm:text-[13px] font-[600] text-[#111827] mb-1">Pincode</label>
                          <input
                            type="text"
                            required
                            maxLength="6"
                            value={formData.pincode}
                            onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/[^0-9]/g, '') })}
                            className={inputClass}
                            placeholder="e.g. 560034"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[12px] sm:text-[13px] font-[600] text-[#111827] mb-1.5">Address Type</label>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          {[
                            { id: 'HOME', label: 'Home', icon: HomeIcon },
                            { id: 'OFFICE', label: 'Office', icon: Building2 },
                            { id: 'OTHER', label: 'Other', icon: MapPin },
                          ].map((type) => {
                            const isSelected = (formData.addressType || 'HOME') === type.id;
                            const Icon = type.icon;
                            return (
                              <button
                                key={type.id}
                                type="button"
                                onClick={() => setFormData({ ...formData, addressType: type.id })}
                                className={`flex items-center space-x-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-[8px] sm:rounded-[10px] border text-[12px] sm:text-[13px] font-[600] transition-all cursor-pointer ${isSelected
                                    ? 'border-[#FF4B2B] bg-[#FFF1ED] text-[#FF4B2B] shadow-xs'
                                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                  }`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                <span>{type.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex justify-end pt-3">
                        <button
                          type="submit"
                          disabled={isSavingAddress}
                          className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-2 rounded-[8px] sm:rounded-[10px] bg-[#FF4B2B] hover:bg-[#e03a00] text-white font-[600] text-[13px] sm:text-[14px] transition-all shadow-md shadow-[#FF4B2B]/20 cursor-pointer disabled:opacity-50"
                        >
                          {isSavingAddress ? 'Saving...' : 'Save Address'}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="space-y-3">
                      {validAddresses.map((addr) => {
                        const addrId = addr.id || addr._id;
                        const isSelected = selectedAddressId === addrId;
                        const typeUpper = (addr.addressType || 'HOME').toUpperCase();
                        const TypeIcon = typeUpper === 'OFFICE' ? Building2 : typeUpper === 'OTHER' ? MapPin : HomeIcon;
                        return (
                          <div
                            key={addrId}
                            onClick={() => setSelectedAddressId(addrId)}
                            className={`p-3.5 sm:p-4 rounded-[12px] border transition-all cursor-pointer flex items-start space-x-3 sm:space-x-3.5 ${isSelected
                              ? 'border-[#FF4B2B] border-2 bg-[#FFF1ED]/30 shadow-xs'
                              : 'border-[#F1F1F1] hover:border-[#D1D5DB] bg-white'
                              }`}
                          >
                            <input
                              type="radio"
                              name="checkoutSelectedAddress"
                              value={addrId}
                              checked={isSelected}
                              onChange={() => setSelectedAddressId(addrId)}
                              className="sr-only"
                            />
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${isSelected ? 'border-[#FF4B2B]' : 'border-[#D1D5DB]'
                                }`}
                            >
                              {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#FF4B2B]" />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                <span className="font-[600] text-[#111827] text-[13px] sm:text-[15px]">
                                  {addr.fullName || user?.name || 'Saved Address'}
                                </span>
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-[6px] text-[10px] sm:text-[11px] font-[600] tracking-wide bg-[#FFF1ED] text-[#FF4B2B] border border-[#FF4B2B]/20">
                                  <TypeIcon className="w-3 h-3" />
                                  <span>{typeUpper}</span>
                                </span>
                                {addrId && (
                                  <span className="hidden sm:inline-flex text-[11px] font-[500] text-[#6B7280] bg-[#F3F4F6] px-2 py-0.5 rounded-md font-mono">
                                    ID: {addrId}
                                  </span>
                                )}
                                {(addr.phone || user?.phone) && (
                                  <span className="text-[12px] sm:text-[13px] text-[#6B7280] font-[500]">
                                    • {addr.phone || user?.phone}
                                  </span>
                                )}
                              </div>
                              <p className="text-[12px] sm:text-[14px] text-[#4B5563] mt-1 leading-relaxed">
                                {[addr.houseFlat, addr.streetArea].filter(Boolean).join(', ')}
                              </p>
                              <p className="text-[11px] sm:text-[13px] text-[#6B7280] mt-0.5 font-[400]">
                                {[addr.city, addr.state].filter(Boolean).join(', ')}{addr.pincode ? ` - ${addr.pincode}` : ''}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditAddress(addr);
                              }}
                              className="shrink-0 p-1 sm:px-2.5 sm:py-1 rounded-[6px] text-[#6B7280] hover:text-[#FF4B2B] hover:bg-[#FFF1ED] text-[12px] font-[600] inline-flex items-center space-x-1 transition-colors cursor-pointer"
                              title="Edit Address"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {!isAddingNewAddress ? (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingNewAddress(true);
                            setEditingAddressId(null);
                            setAddressFormError(null);
                            setNewAddressForm({
                              fullName: user?.name || '',
                              phone: user?.phone || '',
                              houseFlat: '',
                              streetArea: '',
                              city: '',
                              state: '',
                              pincode: '',
                              addressType: 'HOME',
                            });
                          }}
                          className="inline-flex items-center space-x-1.5 text-[#FF4B2B] hover:text-[#e03a00] font-[600] text-[13px] sm:text-[14px] py-2 px-3 rounded-[8px] hover:bg-[#FFF1ED] transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add New Address</span>
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4 pt-4 border-t border-[#F1F1F1] animate-in fade-in duration-300">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-[15px] font-[600] text-[#111827]">
                            {editingAddressId ? 'Edit Address' : 'Add New Address'}
                          </h3>
                          <button
                            type="button"
                            onClick={handleCancelAddressForm}
                            className="text-[12px] font-[500] text-[#6B7280] hover:text-[#111827] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>

                        <form onSubmit={handleSaveNewAddress} className="space-y-3 sm:space-y-4">
                          {addressFormError && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-[8px]">
                              {addressFormError}
                            </div>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                              <label className="block text-[12px] sm:text-[13px] font-[600] text-[#111827] mb-1">Full Name</label>
                              <input
                                type="text"
                                required
                                value={newAddressForm.fullName}
                                onChange={(e) => setNewAddressForm({ ...newAddressForm, fullName: e.target.value })}
                                className={inputClass}
                                placeholder="John Doe"
                              />
                            </div>
                            <div>
                              <label className="block text-[12px] sm:text-[13px] font-[600] text-[#111827] mb-1">Phone Number</label>
                              <input
                                type="tel"
                                required
                                maxLength="10"
                                value={newAddressForm.phone}
                                onChange={(e) => setNewAddressForm({ ...newAddressForm, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })}
                                className={inputClass}
                                placeholder="9876543210"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[12px] sm:text-[13px] font-[600] text-[#111827] mb-1">House/Flat No.</label>
                            <input
                              type="text"
                              required
                              value={newAddressForm.houseFlat}
                              onChange={(e) => setNewAddressForm({ ...newAddressForm, houseFlat: e.target.value })}
                              className={inputClass}
                              placeholder="e.g. Flat 101, A Block"
                            />
                          </div>

                          <div>
                            <label className="block text-[12px] sm:text-[13px] font-[600] text-[#111827] mb-1">Street/Area</label>
                            <input
                              type="text"
                              required
                              value={newAddressForm.streetArea}
                              onChange={(e) => setNewAddressForm({ ...newAddressForm, streetArea: e.target.value })}
                              className={inputClass}
                              placeholder="e.g. 4th Cross, Koramangala"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                            <div>
                              <label className="block text-[12px] sm:text-[13px] font-[600] text-[#111827] mb-1">City</label>
                              <input
                                type="text"
                                required
                                value={newAddressForm.city}
                                onChange={(e) => setNewAddressForm({ ...newAddressForm, city: e.target.value })}
                                className={inputClass}
                                placeholder="e.g. Bangalore"
                              />
                            </div>
                            <div>
                              <label className="block text-[12px] sm:text-[13px] font-[600] text-[#111827] mb-1">State</label>
                              <input
                                type="text"
                                value={newAddressForm.state}
                                onChange={(e) => setNewAddressForm({ ...newAddressForm, state: e.target.value })}
                                className={inputClass}
                                placeholder="e.g. Karnataka"
                              />
                            </div>
                            <div>
                              <label className="block text-[12px] sm:text-[13px] font-[600] text-[#111827] mb-1">Pincode</label>
                              <input
                                type="text"
                                required
                                maxLength="6"
                                value={newAddressForm.pincode}
                                onChange={(e) => setNewAddressForm({ ...newAddressForm, pincode: e.target.value.replace(/[^0-9]/g, '') })}
                                className={inputClass}
                                placeholder="e.g. 560034"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[12px] sm:text-[13px] font-[600] text-[#111827] mb-1.5">Address Type</label>
                            <div className="flex items-center space-x-2 sm:space-x-3">
                              {[
                                { id: 'HOME', label: 'Home', icon: HomeIcon },
                                { id: 'OFFICE', label: 'Office', icon: Building2 },
                                { id: 'OTHER', label: 'Other', icon: MapPin },
                              ].map((type) => {
                                const isSelected = (newAddressForm.addressType || 'HOME') === type.id;
                                const Icon = type.icon;
                                return (
                                  <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => setNewAddressForm({ ...newAddressForm, addressType: type.id })}
                                    className={`flex items-center space-x-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-[8px] sm:rounded-[10px] border text-[12px] sm:text-[13px] font-[600] transition-all cursor-pointer ${isSelected
                                        ? 'border-[#FF4B2B] bg-[#FFF1ED] text-[#FF4B2B] shadow-xs'
                                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                      }`}
                                  >
                                    <Icon className="w-3.5 h-3.5" />
                                    <span>{type.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex justify-end space-x-3 pt-2">
                            <button
                              type="button"
                              onClick={handleCancelAddressForm}
                              className="px-4 py-2 rounded-[8px] sm:rounded-[10px] border border-gray-200 text-gray-700 font-[600] text-[13px] sm:text-[14px] hover:bg-gray-50 transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isSavingAddress}
                              className="px-5 py-2 rounded-[8px] sm:rounded-[10px] bg-[#FF4B2B] hover:bg-[#e03a00] text-white font-[600] text-[13px] sm:text-[14px] transition-all shadow-md shadow-[#FF4B2B]/20 cursor-pointer disabled:opacity-50"
                            >
                              {isSavingAddress ? 'Saving...' : (editingAddressId ? 'Save Changes' : 'Save Address')}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className={`bg-[#FFFFFF] rounded-[14px] sm:rounded-[16px] p-4 sm:p-6 md:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-[#F1F1F1] transition-opacity duration-300 ${!isAddressReady ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
                  <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#FF4B2B] text-white font-[700] text-[12px] sm:text-[14px] flex items-center justify-center shadow-sm shrink-0">
                    2
                  </span>
                  <h2 className="text-[17px] sm:text-[22px] md:text-[24px] font-[700] text-[#111827] tracking-tight">
                    Payment Method
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div
                    onClick={() => setPaymentMethod('COD')}
                    className={`p-3.5 sm:p-4 rounded-[12px] border transition-all cursor-pointer flex items-center space-x-3 border-[#FF4B2B] border-2 shadow-sm bg-[#FFFBF8]`}
                  >
                    <div className="w-5 h-5 rounded-full border-2 border-[#FF4B2B] flex items-center justify-center shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#FF4B2B]" />
                    </div>
                    <div className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 bg-[#FFF1ED]">
                      <Banknote className="w-4 h-4 text-[#FF4B2B]" />
                    </div>
                    <div>
                      <span className="font-[600] text-[#111827] text-[13px] sm:text-[14px] block">
                        Cash on Delivery
                      </span>
                      <span className="text-[11px] text-[#6B7280]">
                        Pay when your food arrives
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-2 lg:order-none lg:col-span-5 xl:col-span-4 w-full space-y-6 lg:sticky lg:top-24">

              <div className="bg-[#FFFFFF] rounded-[14px] sm:rounded-[16px] shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-[#F1F1F1] p-4 sm:p-6 md:p-8">

                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className="text-[17px] sm:text-[20px] font-[700] text-[#111827] tracking-tight">Order Summary</h2>
                  <span className="bg-[#F1F1F1] text-[#6B7280] px-2.5 py-1 rounded-full text-[11px] sm:text-[12px] font-[600] tracking-wide">
                    {checkoutItems.length} items
                  </span>
                </div>

                <div className="divide-y divide-[#F1F1F1] mb-5 sm:mb-6 max-h-[300px] overflow-y-auto pr-1">
                  {checkoutItems.map((item) => (
                    <div key={item.id || item.itemId || item.foodItemId} className="py-3 sm:py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-3 sm:gap-4">
                      <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                        <img
                          src={item.image || getFoodItemFallbackImage(item.name, item.category)}
                          alt={item.name}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = getFoodItemFallbackImage(item.name, item.category);
                          }}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-[10px] object-cover shrink-0 bg-[#F9FAFB] border border-[#F1F1F1]"
                        />
                        <div className="min-w-0 space-y-0.5 sm:space-y-1">
                          <div className="flex items-center space-x-1.5 sm:space-x-2">
                            {item.isVeg !== undefined && (
                              item.isVeg ? (
                                <div className="w-3.5 h-3.5 border border-emerald-600 rounded-sm flex items-center justify-center p-0.5 shrink-0" title="Pure Veg">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                </div>
                              ) : (
                                <div className="w-3.5 h-3.5 border border-red-600 rounded-sm flex items-center justify-center p-0.5 shrink-0" title="Non-Veg">
                                  <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                                </div>
                              )
                            )}
                            <h4 className="font-[600] text-[#111827] text-[13px] sm:text-[14px] truncate">
                              {item.name}
                            </h4>
                          </div>
                          <p className="text-[11px] sm:text-[12px] text-[#6B7280] font-[500]">
                            {item.quantity} × ₹{item.price}
                          </p>
                        </div>
                      </div>

                      <span className="font-[600] text-[#FF4B2B] text-[14px] sm:text-[15px] shrink-0">
                        ₹{item.price * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 sm:space-y-4 text-[13px] sm:text-[14px] text-[#6B7280] font-[400] mb-5 sm:mb-6">
                  <div className="flex justify-between items-center">
                    <span>Item Total</span>
                    <span className="text-[#111827] font-[600]">
                      ₹{displaySubtotal.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Delivery Fee</span>
                    {displayDeliveryFee === 0 ? (
                      <div className="flex items-center space-x-1.5 sm:space-x-2">
                        <span className="line-through text-[#D1D5DB] text-[12px] sm:text-[13px]">₹40</span>
                        <span className="bg-[#DCFCE7] text-[#16A34A] px-2 py-0.5 rounded-[6px] text-[10px] font-[700] tracking-wider">
                          FREE
                        </span>
                      </div>
                    ) : (
                      <span className="text-[#111827] font-[600]">₹{displayDeliveryFee}</span>
                    )}
                  </div>
                </div>

                <div className="bg-[#FFF1ED] rounded-[12px] p-4 sm:p-5 flex justify-between items-center">
                  <span className="text-[15px] sm:text-[16px] font-[600] text-[#111827]">Total Amount</span>
                  <span className="text-[22px] sm:text-[28px] font-[700] text-[#FF4B2B] tracking-tight">
                    ₹{displayTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

            </div>

            <div className="order-3 lg:order-none lg:col-span-7 xl:col-span-8 w-full mt-2 lg:mt-0 space-y-4">
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder || checkoutItems.length === 0 || !isReadyToOrder || !paymentMethod}
                className="w-full py-[14px] sm:py-[16px] bg-[#FF4B2B] hover:bg-[#e03a00] text-white font-[700] text-[15px] sm:text-[16px] rounded-[10px] flex items-center justify-center space-x-2 shadow-md shadow-[#FF4B2B]/20 cursor-pointer active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {isPlacingOrder ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Placing Order...</span>
                  </>
                ) : (
                  <>
                    <span>Place Order</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>

          </div>
        )}
      </div>

      {isOrderPlaced && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-[16px] max-w-md w-full p-5 sm:p-8 text-center space-y-5 sm:space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#FFF1ED] text-[#FF4B2B] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <h2 className="text-[20px] sm:text-[24px] font-[700] text-[#111827] tracking-tight">
                Order Placed Successfully!
              </h2>
              <p className="text-[12px] sm:text-[13px] text-[#6B7280] font-[500]">
                Order ID: <span className="font-[700] text-[#111827]">{placedOrderId}</span>
              </p>
              <p className="text-[13px] sm:text-[14px] text-[#6B7280] font-[400] pt-1">
                Your food is being prepared and will be delivered to your selected address in 30-40 mins.
              </p>
              <p className="text-[10px] font-[700] text-[#6B7280] uppercase tracking-widest pt-1">
                Redirecting to Orders...
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/orders')}
                className="py-[11px] sm:py-[12px] px-4 bg-[#F1F1F1] hover:bg-[#E5E7EB] text-[#111827] font-[600] text-[13px] sm:text-[14px] rounded-[10px] transition-all cursor-pointer"
              >
                View Orders
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="py-[11px] sm:py-[12px] px-4 bg-[#FF4B2B] hover:bg-[#e03a00] text-white font-[600] text-[13px] sm:text-[14px] rounded-[10px] transition-all shadow-md shadow-[#FF4B2B]/20 cursor-pointer"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
