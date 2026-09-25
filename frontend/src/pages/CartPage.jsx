import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getFoodItemFallbackImage } from '../constants/imageConstants';

export const CartPage = () => {
  const {
    cartItems,
    totalCartCount,
    subtotal,
    deliveryFee,
    taxesAndCharges,
    totalAmount,
    loading,
    error,
    setError,
    fetchCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();
  const { isAuthenticated, isTokenValid } = useAuth();

  const navigate = useNavigate();

  return (
    <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-6 font-poppins">

      <h1 className="text-[28px] sm:text-[36px] font-[700] text-[#111827] mb-4 sm:mb-8 tracking-tight">
        Cart
      </h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-4 text-red-800 text-[14px] font-[500]">
          <div className="flex items-center space-x-2 min-w-0">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span className="truncate">{error}</span>
          </div>
          <div className="flex items-center space-x-3 shrink-0">
            <button
              type="button"
              onClick={fetchCart}
              className="text-[12px] font-[600] text-red-700 hover:text-red-900 underline cursor-pointer"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => setError && setError(null)}
              className="text-[12px] font-[600] text-red-500 hover:text-red-700 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {loading && cartItems.length === 0 ? (
        <div className="bg-[#FFFFFF] rounded-[14px] p-16 text-center border border-[#F1F1F1] shadow-[0_4px_16px_rgba(0,0,0,0.06)] max-w-xl mx-auto my-8 space-y-4">
          <Loader2 className="w-10 h-10 text-[#FF4B2B] animate-spin mx-auto" />
          <p className="text-[#6B7280] font-[600] text-[16px]">Loading your cart...</p>
        </div>
      ) : cartItems.length === 0 ? (
        <div className="bg-[#FFFFFF] rounded-[14px] p-12 text-center border border-[#F1F1F1] shadow-[0_4px_16px_rgba(0,0,0,0.06)] max-w-xl mx-auto my-8 space-y-6">
          <div className="w-20 h-20 bg-[#FFF1ED] rounded-full flex items-center justify-center mx-auto text-[#FF4B2B]">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-[24px] font-[700] text-[#111827]">Your cart is empty</h2>
            <p className="text-[14px] text-[#6B7280] font-[400] max-w-md mx-auto">
              Looks like you haven't added any items to your cart yet. Explore top dishes & restaurants near you!
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/restaurants-list')}
            className="inline-flex items-center space-x-2 bg-[#FF4B2B] hover:bg-[#e03a00] text-white px-6 py-[14px] rounded-[10px] font-[600] transition-all shadow-md shadow-[#FF4B2B]/20 cursor-pointer"
          >
            <span>Explore Restaurants</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          <div className="lg:col-span-8 bg-[#FFFFFF] rounded-[14px] border border-[#F1F1F1] shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-6 sm:p-8 space-y-6">

            <div className="hidden sm:flex items-center justify-between border-b border-[#F1F1F1] pb-4">
              <span className="text-[14px] font-[600] text-[#111827]">
                {cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'} in Cart
              </span>
              <button
                type="button"
                onClick={clearCart}
                disabled={loading}
                className="inline-flex items-center space-x-1.5 text-[14px] font-[600] text-[#FF4B2B] hover:text-[#e03a00] transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear Cart</span>
              </button>
            </div>

            <div className="divide-y divide-[#F1F1F1]">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="py-3 sm:py-5 first:pt-0 last:pb-0 flex flex-wrap sm:flex-nowrap items-center justify-between gap-y-2.5 gap-x-3 sm:gap-6"
                >
                  <div className="flex items-center space-x-3 sm:space-x-6 min-w-0 w-full sm:w-auto flex-1">
                    <img
                      src={item.image || getFoodItemFallbackImage(item.name, item.category)}
                      alt={item.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getFoodItemFallbackImage(item.name, item.category);
                      }}
                      className="w-14 h-14 sm:w-20 sm:h-20 rounded-[10px] object-cover shrink-0 border border-gray-100 shadow-sm"
                    />
                    <div className="min-w-0 space-y-0.5">
                      <h3 className="font-[600] text-[#111827] text-[16px] sm:text-[17px] truncate leading-snug">
                        {item.name}
                      </h3>
                      <p className="text-[#FF4B2B] font-[600] text-[16px] sm:text-[17px] leading-snug">
                        ₹{item.price}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-[11px] sm:text-[12px] text-[#6B7280] font-[500] leading-none mt-0.5">
                          Subtotal: ₹{item.price * item.quantity}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end w-full sm:w-auto space-x-6 sm:space-x-8 shrink-0">
                    <div className="flex items-center bg-[#FFF1ED] rounded-[8px] p-0.5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        disabled={loading}
                        className="w-8 h-8 flex items-center justify-center text-[#FF4B2B] hover:bg-[#FF4B2B] hover:text-white rounded-[6px] transition-colors cursor-pointer font-[600] text-[15px] disabled:opacity-50"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-4 h-4" strokeWidth={2.5} />
                      </button>

                      <span className="w-9 text-center font-[600] text-[#111827] text-[15px]">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        disabled={loading}
                        className="w-8 h-8 flex items-center justify-center text-[#FF4B2B] hover:bg-[#FF4B2B] hover:text-white rounded-[6px] transition-colors cursor-pointer font-[600] text-[15px] disabled:opacity-50"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-4 h-4" strokeWidth={2.5} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      disabled={loading}
                      className="text-[#6B7280] hover:text-[#FF4B2B] transition-colors p-1.5 cursor-pointer disabled:opacity-50"
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 className="w-[18px] h-[18px]" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden sm:block border-t border-[#F1F1F1] pt-6">
              <button
                type="button"
                onClick={() => navigate('/restaurants-list')}
                className="inline-flex items-center space-x-2 text-[14px] font-[600] text-[#111827] hover:text-[#FF4B2B] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Continue Ordering</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-4 bg-[#FFFFFF] rounded-[14px] border border-[#F1F1F1] shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-6 space-y-6 sticky top-24">

            <h2 className="hidden sm:block text-[20px] font-[700] text-[#111827] tracking-tight">
              Order Summary
            </h2>

            <div className="space-y-3.5 text-[14px] text-[#6B7280] font-[400]">
              <div className="flex justify-between items-center">
                <span>Item Total ({totalCartCount} items)</span>
                <span className="text-[#111827] font-[600] text-[15px]">
                  ₹{subtotal.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span>Delivery Fee</span>
                <span className="text-[#111827] font-[600] text-[15px]">
                  {deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}
                </span>
              </div>

              {taxesAndCharges > 0 && (
                <div className="flex justify-between items-center">
                  <span>Taxes & Charges</span>
                  <span className="text-[#111827] font-[600] text-[15px]">
                    ₹{taxesAndCharges}
                  </span>
                </div>
              )}
            </div>

            <div className="border-t border-[#F1F1F1] pt-4">
              <div className="flex justify-between items-baseline mb-6">
                <span className="text-[16px] font-[600] text-[#111827]">Total Amount</span>
                <span className="text-[28px] font-[700] text-[#FF4B2B] tracking-tight">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (isAuthenticated && isTokenValid()) {
                    navigate('/checkout');
                  } else {
                    navigate('/login', { state: { from: '/checkout' } });
                  }
                }}
                disabled={loading || cartItems.length === 0}
                className="w-full py-[14px] bg-[#FF4B2B] hover:bg-[#e03a00] text-white font-[600] text-[15px] rounded-[10px] transition-all shadow-md shadow-[#FF4B2B]/25 flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};
