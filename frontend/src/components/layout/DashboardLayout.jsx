import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, ChevronDown, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const DashboardLayout = ({ title, sidebarLinks, brandIcon, userName, userInitial, showPendingBanner, status, verificationStatus, isApplicationSubmitted }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const effectiveStatus = (status || verificationStatus || '').toUpperCase();

  return (
    <div className="h-[100dvh] overflow-hidden bg-gray-50 flex font-sans text-gray-900">

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-[280px] bg-white border-r border-[#F1F1F1]
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        <div className="h-[74px] flex items-center px-7 border-b border-[#F1F1F1]">
          <Link to="/" className="flex items-center space-x-3">
            {brandIcon ? (
              <div className="flex items-center justify-center shrink-0">
                {brandIcon}
              </div>
            ) : (
              <img src="/FoodTrip.png" alt="FoodTrip Logo" className="w-10 h-10 object-contain shrink-0" />
            )}
            <div>
              <span className="font-[800] text-[20px] text-[#111827] tracking-tight leading-none">
                Food<span className="text-[#FF4B2B]">Trip.</span>
              </span>
              <span className="text-[12px] font-[600] text-[#6B7280] block mt-1">
                {title || 'Admin Panel'}
              </span>
            </div>
          </Link>
          <button className="ml-auto lg:hidden text-slate-400 hover:text-slate-600" onClick={toggleSidebar}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isRootPanel = link.path === '/restaurant-panel' || link.path === '/admin';
            const isActive = isRootPanel
              ? location.pathname === link.path
              : location.pathname === link.path || location.pathname.startsWith(link.path + '/');
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`
                  flex items-center space-x-3.5 px-4 py-3 rounded-[12px] transition-all font-[500] text-[15px]
                  ${isActive 
                    ? 'bg-[#FF4B2B] text-white shadow-md shadow-[#FF4B2B]/20 font-[600]' 
                    : 'text-[#6B7280] hover:bg-[#FAFAFA] hover:text-[#111827]'
                  }
                `}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={isActive ? 2.3 : 2} />
                <span className="flex-1">{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#F1F1F1]">
          <button 
            onClick={logout}
            className="flex items-center space-x-3.5 w-full px-4 py-3 text-[#DC2626] hover:bg-[#FEE2E2] rounded-[12px] transition-colors font-[600] text-[15px] cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] relative">

        <div className="sticky top-0 z-30 bg-white shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <header className="h-[62px] sm:h-[74px] bg-white border-b border-[#F1F1F1] flex items-center px-4 md:px-8">
            <button 
              className="lg:hidden p-2 mr-3 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
              onClick={toggleSidebar}
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="ml-auto flex items-center space-x-4">
              <div className="flex items-center space-x-2 border-l border-slate-100 pl-4 cursor-pointer group">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-[#FF5424] font-bold text-xs flex items-center justify-center border border-orange-200 overflow-hidden">
                  {user?.profilePhoto ? (
                    <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <>{userInitial || user?.name?.[0] || 'A'}</>
                  )}
                </div>
                <span className="text-sm font-semibold text-slate-800 group-hover:text-[#FF5424] transition-colors">
                  {userName || user?.name || 'Admin'}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </header>

          {showPendingBanner && (
            <div className={`border-b px-3 sm:px-4 md:px-8 py-1.5 sm:py-2 md:py-3 flex items-center justify-between ${effectiveStatus === 'REJECTED' ? 'bg-[#FEE2E2] border-[#FCA5A5]' : isApplicationSubmitted ? 'bg-[#EBF5FF] border-[#B8DAFF]' : 'bg-[#FFF4E5] border-[#FFD599]'}`}>
              <div className={`flex items-center space-x-1.5 sm:space-x-2 min-w-0 ${effectiveStatus === 'REJECTED' ? 'text-[#991B1B]' : isApplicationSubmitted ? 'text-[#004085]' : 'text-[#995500]'}`}>
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 shrink-0" />
                <span className="text-[11px] sm:text-[13px] md:text-[14px] leading-tight md:leading-normal font-[500] truncate sm:whitespace-normal">
                  {effectiveStatus === 'REJECTED'
                    ? 'Verification Rejected – Please review the admin feedback and resubmit.'
                    : isApplicationSubmitted 
                      ? 'Verification Pending – Your application is under review by the admin.'
                      : 'Your restaurant verification is pending. Please complete your verification to go live.'}
                </span>
              </div>
              {(!isApplicationSubmitted || effectiveStatus === 'REJECTED') && (
                <Link to="/restaurant-panel/verification" className="text-[#FF4B2B] text-[11px] sm:text-[13px] md:text-[14px] font-[600] hover:underline whitespace-nowrap ml-2 sm:ml-4 shrink-0">
                  {effectiveStatus === 'REJECTED' ? 'Resubmit Now' : 'Complete Now'}
                </Link>
              )}
            </div>
          )}
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-12 md:pb-6">
          <Outlet />
        </main>
      </div>

    </div>
  );
};
