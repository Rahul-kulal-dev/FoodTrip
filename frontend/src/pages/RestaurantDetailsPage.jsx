import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star,
  Clock,
  Share2,
  Check,
  Search,
  Minus,
  Plus,
  UtensilsCrossed,
  Soup,
  CookingPot,
  Utensils,
  LayoutGrid,
  Cake,
  CupSoda,
  MapPin,
  AlertCircle,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { MENU_CATEGORIES, REVIEWS as defaultReviews } from '../data/mockData';
import { restaurantAPI } from '../services/api';
import { DEFAULT_IMAGES } from '../constants/imageConstants';

export const RestaurantDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const targetId = id || '1';

  const {
    cartItems,
    addToCart,
    updateQuantity,
    conflictData,
    resolveConflict,
  } = useCart();

  const handleAddToCart = async (dish, dishId) => {
    try {
      await addToCart({
        ...dish,
        id: dishId,
        foodItemId: dishId,
        restaurantId: restaurant?.id || restaurant?._id || targetId,
        restaurant: restaurant
      });
    } catch (err) {
      console.warn('Add to cart caught error:', err.message);
    }
  };

  const [activeTab, setActiveTab] = useState('menu');
  const [selectedCategory, setSelectedCategory] = useState('popular');
  const [dishSearch, setDishSearch] = useState('');
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(window.location.href);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = window.location.href;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const [restaurant, setRestaurant] = useState(null);
  const [dishesList, setDishesList] = useState([]);
  const [reviewsList] = useState(defaultReviews);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logoError, setLogoError] = useState(false);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      window.scrollTo(0, 0);
      const timer = setTimeout(() => {
        window.scrollTo(0, 0);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [targetId]);

  useEffect(() => {
    if (!loading && typeof window !== 'undefined' && window.innerWidth < 768) {
      window.scrollTo(0, 0);
    }
  }, [loading]);

  useEffect(() => {
    let isMounted = true;
    setLogoError(false);

    const fetchRestaurantDetailsAndMenu = async () => {
      setLoading(true);
      setError(null);
      setMenuLoading(true);
      setMenuError(null);

      try {
        const resData = await restaurantAPI.getById(targetId);
        if (isMounted) {
          if (resData && (resData.id || resData.restaurantId || resData.name)) {
            setRestaurant(resData);
          } else {
            setError('Restaurant details not found or inactive');
          }
        }
      } catch (err) {
        console.error('Fetch restaurant details error:', err);
        if (isMounted) {
          setError(err.message || 'Restaurant not found or inactive');
        }
      } finally {
        if (isMounted) setLoading(false);
      }

      try {
        const menuData = await restaurantAPI.getMenu(targetId);
        if (isMounted) {
          if (Array.isArray(menuData)) {
            setDishesList(menuData);
          } else if (menuData && Array.isArray(menuData.data)) {
            setDishesList(menuData.data);
          } else {
            setDishesList([]);
          }
        }
      } catch (err) {
        console.warn('Fetch restaurant menu error:', err);
        if (isMounted) {
          setDishesList([]);
          setMenuError(err.message || 'No available menu items found');
        }
      } finally {
        if (isMounted) setMenuLoading(false);
      }

    };

    fetchRestaurantDetailsAndMenu();

    return () => {
      isMounted = false;
    };
  }, [targetId]);

  const getCategoryIcon = (iconName, isActive) => {
    const props = {
      className: `w-4 h-4 ${isActive ? 'text-[#FF5200]' : 'text-gray-500'}`,
      strokeWidth: 2,
    };
    switch (iconName) {
      case 'UtensilsCrossed':
        return <UtensilsCrossed {...props} />;
      case 'Soup':
        return <Soup {...props} />;
      case 'CookingPot':
        return <CookingPot {...props} />;
      case 'Utensils':
        return <Utensils {...props} />;
      case 'LayoutGrid':
        return <LayoutGrid {...props} />;
      case 'Cake':
        return <Cake {...props} />;
      case 'CupSoda':
        return <CupSoda {...props} />;
      default:
        return <UtensilsCrossed {...props} />;
    }
  };

  const filteredDishes = dishesList.filter((dish) => {
    const isItemAvailable = dish.isAvailable !== false && (dish.availability ? dish.availability.isAvailable !== false : true);
    if (!isItemAvailable) return false;

    const normalizeCat = (c) => (c || '').toLowerCase().replace(/[\s_-]+/g, '');
    const dishCatNorm = normalizeCat(dish.category);
    const hasPopularDishes = dishesList.some((d) => normalizeCat(d.category) === 'popular');

    const matchesCategory =
      selectedCategory === 'popular'
        ? (dishCatNorm === 'popular' || dish.isPopular || !hasPopularDishes)
        : dishCatNorm === normalizeCat(selectedCategory);

    const matchesSearch =
      (dish.name || '').toLowerCase().includes((dishSearch || '').toLowerCase()) ||
      (dish.description || '').toLowerCase().includes((dishSearch || '').toLowerCase());

    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center space-y-4 py-16 font-poppins">
        <Loader2 className="w-10 h-10 text-[#FF4B2B] animate-spin" />

      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="w-full py-12 flex justify-center px-4 font-poppins">
        <div className="bg-[#FFFFFF] rounded-[14px] p-8 border border-[#F1F1F1] shadow-[0_4px_16px_rgba(0,0,0,0.06)] text-center max-w-md w-full my-6">
          <div className="w-16 h-16 rounded-[14px] bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-[20px] font-[700] text-[#111827] mb-2">Restaurant Unavailable</h2>
          <p className="text-[14px] text-[#6B7280] mb-6 leading-relaxed font-[400]">
            {error || 'The restaurant you are looking for does not exist or has been deactivated by Admin.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/restaurants-list')}
            className="inline-flex items-center space-x-2 bg-[#FF4B2B] hover:bg-[#e03a00] text-white font-[600] px-6 py-[12px] rounded-[10px] text-[14px] transition-all shadow-md shadow-[#FF4B2B]/20 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Restaurants</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full font-poppins pb-20">
      <div className="bg-[#FFFFFF] rounded-[14px] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-[#F1F1F1] mb-6 mt-6 max-w-[1240px] mx-auto">
        <div className="relative h-[220px] sm:h-[260px] md:h-[290px] w-full overflow-hidden bg-[#111827]">
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 bg-white/90 backdrop-blur-sm p-2.5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:bg-white hover:scale-105 transition-all flex items-center justify-center text-[#111827] group"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <img
            src={restaurant.coverImage || restaurant.bannerImage || restaurant.image || DEFAULT_IMAGES.RESTAURANT_BANNER}
            alt={restaurant.name}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = DEFAULT_IMAGES.RESTAURANT_BANNER;
            }}
            className="w-full h-full object-cover object-center"
          />
        </div>

        <div className="relative px-6 sm:px-8 pb-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 -mt-14 sm:-mt-16 mb-4 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
              <div className={`relative z-20 w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center text-center shrink-0 overflow-hidden border-4 border-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] ${!(restaurant.logoImage || restaurant.logo || restaurant.logoUrl) || logoError ? 'bg-[#FFF1ED]' : 'bg-white'}`}>
                {(restaurant.logoImage || restaurant.logo || restaurant.logoUrl) && !logoError ? (
                  <img
                    src={restaurant.logoImage || restaurant.logo || restaurant.logoUrl}
                    alt={restaurant.name}
                    onError={() => setLogoError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-extrabold text-[40px] sm:text-[48px] text-[#FF4B2B] uppercase select-none">
                    {restaurant.name ? restaurant.name.substring(0, 2) : 'RS'}
                  </span>
                )}
              </div>

              <div className="mb-1 sm:pt-[72px]">
                <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                  <h1 className="text-[24px] sm:text-[32px] font-[700] text-[#111827] tracking-tight">
                    {restaurant.name}
                  </h1>

                  {restaurant.isOpenNow !== undefined && (
                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-[800] uppercase tracking-wider shadow-sm transition-all whitespace-nowrap shrink-0 select-none ${restaurant.isOpenNow
                        ? 'bg-[#16A34A]/10 text-[#16A34A]'
                        : 'bg-[#DC2626]/10 text-[#DC2626]'
                        }`}
                    >
                      <span className={`w-2 h-2 rounded-full mr-2 shrink-0 ${restaurant.isOpenNow ? 'bg-[#16A34A] shadow-[0_0_8px_rgba(22,163,74,0.6)] animate-pulse' : 'bg-[#DC2626]'}`} />
                      <span className="whitespace-nowrap">{restaurant.isOpenNow ? 'Open Now' : 'Closed'}</span>
                    </span>
                  )}
                </div>

                <p className="text-[13px] sm:text-[14px] text-[#6B7280] font-[500] mt-1">
                  {restaurant.cuisine} • {restaurant.address || restaurant.location}
                </p>

                <div className="flex flex-wrap items-center gap-y-2 text-[13px] sm:text-[14px] text-[#111827] font-[600] mt-2.5">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-4 h-4 rounded-full bg-[#FF4B2B] text-white flex items-center justify-center shrink-0">
                      <Star className="w-2.5 h-2.5 fill-current" />
                    </div>
                    <span className="font-[700] text-[#111827]">{restaurant.rating || 4.5}</span>
                    <span className="text-[#6B7280] font-[400]">({restaurant.ratingCount || '100+'})</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative flex items-center self-end sm:self-center mb-1">
              {copied && (
                <div className="absolute -top-7.5 left-1/2 -translate-x-1/2 bg-[#F9FAFB] border border-gray-200 text-[#6B7280] text-[10px] font-medium px-2 py-0.5 rounded-[6px] shadow-sm whitespace-nowrap pointer-events-none z-30 flex items-center gap-1 animate-in fade-in zoom-in-95 duration-150">
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span>Copied!</span>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-[4px] border-transparent border-t-gray-200" />
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[2px] border-[3px] border-transparent border-t-[#F9FAFB]" />
                </div>
              )}

              <button
                type="button"
                onClick={handleShare}
                className="w-9 h-9 rounded-[10px] bg-[#F9FAFB] hover:bg-[#F1F1F1] text-[#6B7280] hover:text-[#111827] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Share"
                title="Share restaurant"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="border-t border-[#F1F1F1] pt-2.5 mt-4 flex items-center space-x-10">
            <button
              type="button"
              onClick={() => setActiveTab('menu')}
              className={`relative pb-2 text-[14px] font-[600] transition-colors cursor-pointer ${activeTab === 'menu' ? 'text-[#FF4B2B]' : 'text-[#6B7280] hover:text-[#111827]'
                }`}
            >
              Menu
              {activeTab === 'menu' && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#FF4B2B] rounded-t-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`relative pb-2 text-[14px] font-[600] transition-colors cursor-pointer ${activeTab === 'reviews' ? 'text-[#FF4B2B]' : 'text-[#6B7280] hover:text-[#111827]'
                }`}
            >
              Reviews
              {activeTab === 'reviews' && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#FF4B2B] rounded-t-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('about')}
              className={`relative pb-2 text-[14px] font-[600] transition-colors cursor-pointer ${activeTab === 'about' ? 'text-[#FF4B2B]' : 'text-[#6B7280] hover:text-[#111827]'
                }`}
            >
              About
              {activeTab === 'about' && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#FF4B2B] rounded-t-full" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        {activeTab === 'menu' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-3 xl:col-span-2">
              <div className="hidden lg:flex flex-col space-y-1 bg-[#FFFFFF] rounded-[14px] p-2 border border-[#F1F1F1] shadow-[0_4px_16px_rgba(0,0,0,0.06)] sticky top-24">
                {MENU_CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-[10px] text-[14px] font-[600] transition-all cursor-pointer w-full text-left ${isActive
                        ? 'bg-[#FFF1ED] text-[#FF4B2B]'
                        : 'text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827]'
                        }`}
                    >
                      {getCategoryIcon(cat.iconName, isActive)}
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex lg:hidden overflow-x-auto no-scrollbar space-x-2 pb-2 mb-4">
                {MENU_CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-[10px] text-[13px] font-[600] shrink-0 transition-colors cursor-pointer ${isActive
                        ? 'bg-[#FF4B2B] text-white'
                        : 'bg-[#FFFFFF] text-[#6B7280] border border-[#F1F1F1]'
                        }`}
                    >
                      {getCategoryIcon(cat.iconName, isActive)}
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-9 xl:col-span-10">
              <div className="relative mb-5">
                <Search className="w-4 h-4 text-[#6B7280] absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={dishSearch}
                  onChange={(e) => setDishSearch(e.target.value)}
                  placeholder="Search for dishes..."
                  className="w-full bg-[#FFFFFF] border border-[#F1F1F1] rounded-[10px] py-3 pl-11 pr-4 text-[14px] text-[#111827] placeholder-[#6B7280] focus:outline-none focus:border-[#FF4B2B] transition-colors shadow-sm"
                />
              </div>

              <h2 className="text-[20px] font-[700] text-[#111827] mb-4 capitalize">
                {MENU_CATEGORIES.find((c) => c.id === selectedCategory)?.name || 'Dishes'}
              </h2>

              {conflictData && (
                <div className="mb-5 p-4 bg-[#FFF1ED] border border-orange-200 rounded-[14px] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <span className="text-red-500 font-bold text-sm">!</span>
                    </div>
                    <div>
                      <h3 className="text-[#111827] text-[15px] font-[600]">Change Restaurant?</h3>
                      <p className="text-[#6B7280] text-[13px] font-[500] leading-snug">
                        Your cart contains items from another restaurant. Clear the cart and add this item?
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0 w-full md:w-auto mt-2 md:mt-0">
                    <button
                      type="button"
                      onClick={() => resolveConflict(false)}
                      className="flex-1 md:flex-none px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[13px] font-[600] rounded-[10px] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => resolveConflict(true)}
                      className="flex-1 md:flex-none px-4 py-2 bg-[#FF4B2B] hover:bg-[#e03a00] text-white text-[13px] font-[600] rounded-[10px] transition-colors cursor-pointer shadow-sm shadow-[#FF4B2B]/20"
                    >
                      Clear Cart & Add
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3.5">
                {menuLoading ? (
                  <div className="bg-[#FFFFFF] rounded-[14px] p-12 text-center border border-[#F1F1F1] space-y-3">
                    <Loader2 className="w-8 h-8 text-[#FF4B2B] animate-spin mx-auto" />
                    <p className="text-[12px] font-[600] text-[#6B7280]">Loading menu items...</p>
                  </div>
                ) : filteredDishes.length > 0 ? (
                  filteredDishes.map((dish) => {
                    const dishId = dish.id || dish.foodItemId || dish._id;
                    const isItemAvailable = dish.isAvailable !== false && (dish.availability ? dish.availability.isAvailable !== false : true);
                    const cartItem = cartItems.find((item) => String(item.id) === String(dishId) || String(item.foodItemId) === String(dishId) || String(item.itemId) === String(dishId) || String(item.foodItem?.id) === String(dishId));

                    return (
                      <div
                        key={dishId}
                        className={`bg-[#FFFFFF] rounded-[14px] p-4 border border-[#F1F1F1] shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-md transition-shadow flex items-center justify-between gap-4 ${!isItemAvailable ? 'opacity-70 bg-[#F9FAFB]' : ''
                          }`}
                      >
                        <div className="relative shrink-0">
                          <img
                            src={dish.image || DEFAULT_IMAGES.FOOD_ITEM}
                            alt={dish.name}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = DEFAULT_IMAGES.FOOD_ITEM;
                            }}
                            className="w-24 h-24 sm:w-28 sm:h-28 rounded-[14px] object-cover bg-[#F9FAFB]"
                          />
                          {!isItemAvailable && (
                            <div className="absolute inset-0 bg-black/40 rounded-[14px] flex items-center justify-center">
                              <span className="text-[10px] font-[700] text-white bg-[#DC2626] px-2 py-0.5 rounded-md uppercase tracking-wider">
                                Sold Out
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            {dish.isVeg ? (
                              <div className="w-4 h-4 border border-emerald-600 rounded-sm flex items-center justify-center p-0.5" title="Pure Veg">
                                <div className="w-2 h-2 rounded-full bg-emerald-600" />
                              </div>
                            ) : (
                              <div className="w-4 h-4 border border-red-600 rounded-sm flex items-center justify-center p-0.5" title="Non-Veg">
                                <div className="w-2 h-2 rounded-full bg-red-600" />
                              </div>
                            )}
                            {!isItemAvailable && (
                              <span className="text-[10px] font-[600] text-[#DC2626] bg-[#FEE2E2] px-1.5 py-0.5 rounded-[4px]">
                                Unavailable
                              </span>
                            )}
                          </div>

                          <h3 className="text-[17px] font-[600] text-[#111827] truncate">
                            {dish.name}
                          </h3>

                          <p className="text-[17px] font-[600] text-[#FF4B2B] mt-1">
                            ₹{dish.price}
                          </p>

                          {dish.description && (
                            <p className="text-[11px] font-[400] text-[#6B7280] mt-1 line-clamp-2">
                              {dish.description}
                            </p>
                          )}
                        </div>

                        <div className="shrink-0">
                          {!restaurant?.isOpenNow && restaurant?.isOpenNow !== undefined ? (
                            <button
                              type="button"
                              disabled
                              title="Restaurant is currently closed."
                              className="bg-[#F1F1F1] text-[#6B7280] font-[600] px-4 py-2 rounded-[10px] text-[13px] cursor-not-allowed border border-[#E5E7EB]"
                            >
                              Closed
                            </button>
                          ) : !isItemAvailable ? (
                            <button
                              type="button"
                              disabled
                              className="bg-[#F1F1F1] text-[#6B7280] font-[600] px-4 py-2 rounded-[10px] text-[13px] cursor-not-allowed border border-[#E5E7EB]"
                            >
                              Unavailable
                            </button>
                          ) : cartItem ? (
                            <div className="flex items-center space-x-3 bg-[#FFF1ED] text-[#FF4B2B] border border-orange-100 rounded-[10px] px-3.5 py-1.5 shadow-sm font-[600] text-[14px]">
                              <button
                                type="button"
                                onClick={() => updateQuantity(dishId, -1)}
                                className="hover:opacity-75 cursor-pointer p-0.5"
                              >
                                <Minus className="w-3.5 h-3.5 stroke-[3]" />
                              </button>
                              <span className="min-w-[16px] text-center">{cartItem.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(dishId, 1)}
                                className="hover:opacity-75 cursor-pointer p-0.5"
                              >
                                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddToCart(dish, dishId)}
                              className="bg-[#FFF1ED] text-[#FF4B2B] hover:bg-[#FFE6D9] border border-[#FF4B2B]/20 font-[600] px-6 py-2 rounded-[10px] text-[14px] transition-colors cursor-pointer"
                            >
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-[#FFFFFF] rounded-[14px] p-12 text-center border border-[#F1F1F1] text-[#6B7280]">
                    <UtensilsCrossed className="w-10 h-10 text-[#D1D5DB] mx-auto mb-3" />
                    <p className="font-[600] text-[#111827]">No dishes found</p>
                    <p className="text-[12px] text-[#6B7280] mt-1 font-[400]">
                      {menuError || 'There are no available menu items matching your search for this restaurant.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="bg-[#FFFFFF] rounded-[14px] p-8 border border-[#F1F1F1] shadow-[0_4px_16px_rgba(0,0,0,0.06)] w-full">
            <h2 className="text-[20px] font-[700] text-[#111827] mb-6">Customer Ratings & Reviews</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 pb-8 border-b border-[#F1F1F1]">
              <div className="flex flex-col items-center justify-center p-6 bg-[#FFF1ED] rounded-[14px] text-center">
                <span className="text-[36px] font-[700] text-[#111827]">{restaurant.rating || 4.5}</span>
                <div className="flex items-center space-x-1 my-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-[#FF4B2B] fill-current" />
                  ))}
                </div>
                <span className="text-[12px] text-[#6B7280] font-[500]">Based on {restaurant.ratingCount || '100+'} ratings</span>
              </div>

              <div className="sm:col-span-2 flex flex-col justify-center space-y-2 text-[14px] text-[#6B7280]">
                <div className="flex items-center space-x-3">
                  <span className="w-12 text-[12px]">5 Star</span>
                  <div className="flex-1 h-2 bg-[#F1F1F1] rounded-full overflow-hidden">
                    <div className="h-full bg-[#FF4B2B] w-[78%]" />
                  </div>
                  <span className="text-[12px] w-8">78%</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-12 text-[12px]">4 Star</span>
                  <div className="flex-1 h-2 bg-[#F1F1F1] rounded-full overflow-hidden">
                    <div className="h-full bg-[#FF4B2B] w-[15%]" />
                  </div>
                  <span className="text-[12px] w-8">15%</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="w-12 text-[12px]">3 Star</span>
                  <div className="flex-1 h-2 bg-[#F1F1F1] rounded-full overflow-hidden">
                    <div className="h-full bg-[#FF4B2B] w-[4%]" />
                  </div>
                  <span className="text-[12px] w-8">4%</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {reviewsList.map((rev) => (
                <div key={rev.id || rev._id} className="border-b border-[#F1F1F1] pb-6 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <img src={rev.avatar || DEFAULT_IMAGES.USER_AVATAR} alt={rev.user} className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <h4 className="text-[14px] font-[600] text-[#111827]">{rev.user}</h4>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < Math.floor(rev.rating || 5) ? 'text-[#FF4B2B] fill-current' : 'text-[#D1D5DB]'
                                }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-[12px] text-[#6B7280]">{rev.date}</span>
                  </div>
                  <p className="text-[14px] text-[#6B7280] mt-2 font-[400]">{rev.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="bg-[#FFFFFF] rounded-[14px] p-8 border border-[#F1F1F1] shadow-[0_4px_16px_rgba(0,0,0,0.06)] w-full space-y-6">
            <div>
              <h2 className="text-[20px] font-[700] text-[#111827] mb-3">About {restaurant.name}</h2>
              <p className="text-[14px] text-[#6B7280] leading-relaxed font-[400]">
                {restaurant.description || `${restaurant.name} serves delicious ${restaurant.cuisine || 'food'} prepared with traditional spices and fresh ingredients.`}
              </p>
            </div>

            <div className="border-t border-[#F1F1F1] pt-6">
              <h3 className="text-[16px] font-[700] text-[#111827] mb-3">Address & Location</h3>
              <div className="flex items-start space-x-3 text-[14px] text-[#6B7280] font-[400]">
                <MapPin className="w-5 h-5 text-[#FF4B2B] shrink-0 mt-0.5" />
                <span>
                  {[
                    restaurant.address || restaurant.location,
                    restaurant.city,
                    restaurant.state,
                    restaurant.pincode
                  ]
                    .filter(Boolean)
                    .join(', ') || 'Address not provided'}
                </span>
              </div>
            </div>

            <div className="border-t border-[#F1F1F1] pt-6">
              <h3 className="text-[16px] font-[700] text-[#111827] mb-3">Operating Hours</h3>
              <div className="flex flex-col space-y-2 text-[14px] text-[#6B7280] font-[400]">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-[#FF4B2B] shrink-0" />
                  <span>
                    {(() => {
                      const formatTime = (timeStr) => {
                        if (!timeStr) return '';
                        if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
                        const [h, m] = timeStr.split(':');
                        if (!h || !m) return timeStr;
                        const hours = parseInt(h, 10);
                        const ampm = hours >= 12 ? 'PM' : 'AM';
                        const formattedHours = hours % 12 || 12;
                        return `${formattedHours.toString().padStart(2, '0')}:${m} ${ampm}`;
                      };
                      const open = formatTime(restaurant.openingTime);
                      const close = formatTime(restaurant.closingTime);
                      if (!open && !close) return 'Hours not specified';
                      return `${open || 'Unknown'} – ${close || 'Unknown'}`;
                    })()}
                  </span>
                </div>
                <div className="flex items-start space-x-3 mt-2 pl-[32px]">
                  <span className="font-[600] text-[#111827]">Days:</span>
                  <span>
                    {(() => {
                      const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                      const days = Array.isArray(restaurant.workingDays) && restaurant.workingDays.length > 0
                        ? [...restaurant.workingDays].sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b))
                        : dayOrder;
                      return days.join(', ');
                    })()}
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default RestaurantDetailsPage;
