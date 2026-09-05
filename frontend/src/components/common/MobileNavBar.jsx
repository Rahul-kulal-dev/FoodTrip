import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Receipt, User } from 'lucide-react';

export const MobileNavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Search', path: '/restaurants-list', icon: Search },
    { name: 'Orders', path: '/orders', icon: Receipt },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 px-2 pt-2 pb-4 z-50 shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between max-w-[500px] mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));

          const Icon = item.icon;

          return (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center w-[20%] cursor-pointer focus:outline-none"
            >
              <div className={`mb-1 transition-colors ${isActive ? 'text-[#FF5200]' : 'text-gray-400'}`}>
                <Icon className={`w-[22px] h-[22px] ${isActive ? 'fill-current' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-[600] transition-colors ${isActive ? 'text-[#FF5200]' : 'text-gray-500'}`}>
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
