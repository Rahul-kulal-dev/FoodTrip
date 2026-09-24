import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  ChevronDown,
  LogOut,
  User,
  ClipboardList
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const FoodTripLogoIcon = () => (
  <img src="/FoodTrip.png" alt="FoodTrip Logo" className="w-9 h-9 md:w-12 md:h-12 object-contain" />
);

export const Navbar = () => {
  const { totalCartCount, setIsCartOpen } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name) => {
    if (!name) return 'RK';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-[1600px] mx-auto w-full px-3 sm:px-6 lg:px-8 h-[64px] md:h-[72px] flex items-center justify-between gap-2 md:gap-6">

        <div className="flex items-center shrink-0">
          <Link to="/" className="flex items-center space-x-1.5 md:space-x-2.5 cursor-pointer">
            <FoodTripLogoIcon />
            <span className="text-[22px] md:text-[32px] font-[800] tracking-tight text-[#111827]">
              Food<span className="text-[#FF4B2B]">Trip.</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-3 md:space-x-5 shrink-0">

          <div className="flex items-center space-x-1 sm:space-x-3">
            <button
              type="button"
              onClick={() => navigate('/restaurants-list')}
              className="hidden md:flex w-8 h-8 md:w-9 md:h-9 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-full items-center justify-center transition-colors cursor-pointer"
              aria-label="Search"
            >
              <Search className="w-[22px] h-[22px] md:w-5 md:h-5" strokeWidth={2} />
            </button>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className={`relative w-8 h-8 md:w-9 md:h-9 hover:text-[#FF5200] hover:bg-gray-50 rounded-full flex items-center justify-center transition-colors cursor-pointer text-gray-700`}
              aria-label="Cart"
            >
              <ShoppingCart className="w-[22px] h-[22px] md:w-5 md:h-5" strokeWidth={2} />
              {totalCartCount > 0 && (
                <span className="absolute top-0 right-0 w-[16px] h-[16px] md:w-[18px] md:h-[18px] rounded-full bg-[#FF5200] text-white text-[10px] md:text-[11px] font-extrabold flex items-center justify-center shadow-xs">
                  {totalCartCount}
                </span>
              )}
            </button>

            {isAuthenticated && user ? (
              <div className="relative pl-1" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-1.5 cursor-pointer focus:outline-none"
                  aria-label="User profile menu"
                >
                  <div className="w-9 h-9 rounded-full bg-[#FF5200]/10 text-[#FF5200] font-bold text-xs flex items-center justify-center border border-[#FF5200]/20 shadow-xs">
                    {getInitials(user.name)}
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-1">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-bold text-gray-900 truncate">{user.name || 'User'}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 bg-orange-50 text-[#FF5200] rounded-full">
                        {user.role || 'Customer'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        navigate('/profile');
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center space-x-2 font-semibold transition-colors cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Profile</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        navigate('/orders');
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center space-x-2 font-semibold transition-colors cursor-pointer"
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      <span>Orders</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center space-x-2 font-semibold transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="ml-1 px-4 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold text-[#FF5200] border border-[#FF5200] hover:bg-[#FF5200] hover:text-white rounded-xl transition-all duration-200 cursor-pointer"
              >
                Login
              </button>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};

