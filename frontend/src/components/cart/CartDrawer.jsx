import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Minus, Plus, Trash2, ArrowRight, ShoppingCart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { getFoodItemFallbackImage } from '../../constants/imageConstants';

export const CartDrawer = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    cartItems,
    totalCartCount,
    subtotal,
    deliveryFee,
    totalAmount,
    updateQuantity,
    removeFromCart,
    loading
  } = useCart();
  const { isAuthenticated, isTokenValid } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  const estimatedTaxes = Math.max(0, totalAmount - subtotal - deliveryFee);

  return (
    <div className="font-poppins">
      <div 
        className="fixed inset-0 bg-black/60 z-[60] animate-in fade-in duration-200 cursor-pointer"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-white shadow-2xl z-[60] flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">

        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 shrink-0 bg-white">
          <h2 className="text-[18px] sm:text-[20px] font-[600] text-[#111827] tracking-tight">Your Cart ({totalCartCount})</h2>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-white">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-[#FFF1ED] rounded-full flex items-center justify-center text-[#FF4B2B]">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <p className="text-[#6B7280] font-[400]">Your cart is empty.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {cartItems.map((item) => (
                <div key={item.id} className="p-5 sm:p-6 border-b border-gray-100 flex gap-4">
                  <img 
                    src={item.image || getFoodItemFallbackImage(item.name, item.category)} 
                    alt={item.name}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = getFoodItemFallbackImage(item.name, item.category);
                    }}
                    className="w-20 h-20 rounded-[10px] object-cover border border-gray-100 shrink-0 shadow-sm"
                  />

                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="mb-auto">
                      <h3 className="font-[600] text-[#111827] text-[15px] leading-tight truncate mb-0.5">{item.name}</h3>
                      <p className="text-[#6B7280] text-[12px] font-[400] truncate">{item.restaurantName || 'Restaurant'}</p>

                      <div className="mt-1">
                        <span className="font-[600] text-[#FF4B2B] text-[15px]">₹{item.price}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center bg-[#FFF1ED] rounded-lg border border-[#FFF1ED]">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          disabled={loading}
                          className="w-8 h-8 flex items-center justify-center text-[#FF4B2B] hover:bg-[#FF4B2B] hover:text-white rounded-l-lg transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Minus className="w-4 h-4" strokeWidth={2.5} />
                        </button>
                        <span className="w-7 text-center font-[600] text-[#111827] text-[13px]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          disabled={loading}
                          className="w-8 h-8 flex items-center justify-center text-[#FF4B2B] hover:bg-[#FF4B2B] hover:text-white rounded-r-lg transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4" strokeWidth={2.5} />
                        </button>
                      </div>

                      <button 
                        onClick={() => removeFromCart(item.id)}
                        disabled={loading}
                        className="flex items-center gap-1 text-[#6B7280] hover:text-[#FF4B2B] text-[12px] font-[500] transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="border-t border-gray-100 p-4 sm:p-6 bg-white shrink-0">
            <div className="space-y-3 mb-6 text-[14px] font-[400] text-[#6B7280]">
              <div className="flex justify-between items-center">
                <span>Item Total ({totalCartCount} items)</span>
                <span className="text-[#111827] font-[600]">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              {estimatedTaxes > 0 && (
                <div className="flex justify-between items-center">
                  <span>Restaurant Charges & Taxes</span>
                  <span className="text-[#111827] font-[600]">₹{estimatedTaxes.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span>Delivery Fee</span>
                <span className="text-[#111827] font-[600]">{deliveryFee > 0 ? `₹${deliveryFee.toLocaleString('en-IN')}` : 'Free'}</span>
              </div>

              <div className="pt-4 mt-2 border-t border-gray-100 flex justify-between items-center">
                <span className="font-[600] text-[#111827] text-[17px]">Total Amount</span>
                <span className="font-[700] text-[#FF4B2B] text-[24px] tracking-tight">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsCartOpen(false);
                if (isAuthenticated && isTokenValid()) {
                  navigate('/checkout');
                } else {
                  navigate('/login', { state: { from: '/checkout' } });
                }
              }}
              className="w-full bg-[#FF4B2B] hover:bg-[#e03a00] text-white py-[14px] rounded-[10px] font-[600] text-[15px] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#FF4B2B]/20"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
