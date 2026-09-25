import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  Settings
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { adminAPI } from '../../services/api';

import totalRestaurantsIcon from '../../assets/admin_stats/total_restaurants.png';
import totalFoodItemsIcon from '../../assets/admin_stats/total_food_items.png';
import totalOrdersIcon from '../../assets/admin_stats/total_orders.png';
import totalUsersIcon from '../../assets/admin_stats/total_users.png';

const adminLinks = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Restaurant Verification', path: '/admin/pending-verification', icon: ShieldCheck },
  { name: 'Manage Users', path: '/admin/users', icon: Users },
  { name: 'Profile', path: '/admin/profile', icon: Settings },
];

export const AdminApp = () => {
  return <DashboardLayout title="Admin Portal" sidebarLinks={adminLinks} />;
};

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalRestaurants: 0,
    totalFoodItems: 0,
    totalOrders: 0,
    totalUsers: 0,
  });
  const [recentRestaurants, setRecentRestaurants] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const liveStats = await adminAPI.getStats();
        if (liveStats && typeof liveStats.totalRestaurants === 'number') {
          setStats(liveStats);
        }

        const restRes = await adminAPI.getRestaurants().catch(() => ({ data: [] }));

        const restList = Array.isArray(restRes) ? restRes : (restRes.data || []);
        const formattedRests = restList.sort((a, b) => new Date(b.createdDate || b.createdAt || 0) - new Date(a.createdDate || a.createdAt || 0)).slice(0, 5).map(r => {
          let statusBg = 'bg-gray-100 text-gray-700';
          const s = String(r.status || '').toLowerCase();
          if (s === 'active' || s === 'approved') statusBg = 'bg-emerald-100 text-emerald-700';
          else if (s === 'pending') statusBg = 'bg-amber-100 text-amber-700';
          else if (s === 'inactive' || s === 'rejected') statusBg = 'bg-rose-100 text-rose-700';

          return {
            id: `#${String(r.id || r._id || '').slice(-6).toUpperCase()}`,
            name: r.restaurantName || r.name || 'Unknown',
            cuisine: Array.isArray(r.cuisines) ? r.cuisines.join(', ') : (r.cuisine || 'N/A'),
            status: r.status || 'Pending',
            statusBg
          };
        });
        setRecentRestaurants(formattedRests);

      } catch (err) {
        console.warn('Admin dashboard fetch error:', err);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6 font-poppins text-[#111827]">
      <div>
        <h1 className="text-[24px] md:text-[28px] font-[700] text-[#111827] tracking-tight">
          Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-[#FFFFFF] p-4 sm:p-6 rounded-[14px] border border-[#F1F1F1] shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:space-x-5 transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] cursor-pointer group">
          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-[#FF4B2B] flex items-center justify-center shrink-0">
            <img src={totalRestaurantsIcon} alt="Total Restaurants" className="w-5 h-5 sm:w-8 sm:h-8 object-contain brightness-0 invert" />
          </div>
          <div>
            <p className="text-[11px] sm:text-[13px] font-[500] text-[#6B7280]">Total Restaurants</p>
            <p className="text-[20px] sm:text-[28px] font-[700] text-[#111827] mt-0.5 sm:mt-1 tracking-tight">{stats.totalRestaurants}</p>
          </div>
        </div>

        <div className="bg-[#FFFFFF] p-4 sm:p-6 rounded-[14px] border border-[#F1F1F1] shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:space-x-5 transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] cursor-pointer group">
          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-[#FF4B2B] flex items-center justify-center shrink-0">
            <img src={totalFoodItemsIcon} alt="Total Food Items" className="w-5 h-5 sm:w-8 sm:h-8 object-contain brightness-0 invert" />
          </div>
          <div>
            <p className="text-[11px] sm:text-[13px] font-[500] text-[#6B7280]">Total Food Items</p>
            <p className="text-[20px] sm:text-[28px] font-[700] text-[#111827] mt-0.5 sm:mt-1 tracking-tight">{stats.totalFoodItems}</p>
          </div>
        </div>

        <div className="bg-[#FFFFFF] p-4 sm:p-6 rounded-[14px] border border-[#F1F1F1] shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:space-x-5 transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] cursor-pointer group">
          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-[#FF4B2B] flex items-center justify-center shrink-0">
            <img src={totalOrdersIcon} alt="Total Orders" className="w-5 h-5 sm:w-8 sm:h-8 object-contain brightness-0 invert" />
          </div>
          <div>
            <p className="text-[11px] sm:text-[13px] font-[500] text-[#6B7280]">Total Orders</p>
            <p className="text-[20px] sm:text-[28px] font-[700] text-[#111827] mt-0.5 sm:mt-1 tracking-tight">{stats.totalOrders}</p>
          </div>
        </div>

        <div className="bg-[#FFFFFF] p-4 sm:p-6 rounded-[14px] border border-[#F1F1F1] shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:space-x-5 transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] cursor-pointer group">
          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-[#FF4B2B] flex items-center justify-center shrink-0">
            <img src={totalUsersIcon} alt="Total Users" className="w-5 h-5 sm:w-8 sm:h-8 object-contain brightness-0 invert" />
          </div>
          <div>
            <p className="text-[11px] sm:text-[13px] font-[500] text-[#6B7280]">Total Users</p>
            <p className="text-[20px] sm:text-[28px] font-[700] text-[#111827] mt-0.5 sm:mt-1 tracking-tight">{stats.totalUsers}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 pt-2">

        <div className="bg-[#FFFFFF] p-6 rounded-[14px] border border-[#F1F1F1] shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[18px] md:text-[20px] font-[600] text-[#111827]">Recent Restaurants</h2>
            <button type="button" className="text-[14px] font-[500] text-[#FF4B2B] hover:underline cursor-pointer">
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px] whitespace-nowrap">
              <thead>
                <tr className="border-b border-[#F1F1F1] text-[12px] font-[500] text-[#6B7280]">
                  <th className="pb-3 pr-2 font-[500]">#</th>
                  <th className="pb-3 px-2 font-[500]">Name</th>
                  <th className="pb-3 px-2 font-[500]">Cuisine</th>
                  <th className="pb-3 px-2 font-[500]">Status</th>
                  <th className="pb-3 pl-2 text-right font-[500]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F1F1] text-[14px] text-[#111827]">
                {recentRestaurants.map((rest, i) => (
                  <tr key={rest.id || i} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="py-3.5 pr-2 font-[500]">{rest.id}</td>
                    <td className="py-3.5 px-2 font-[500]">{rest.name}</td>
                    <td className="py-3.5 px-2 text-[#6B7280]">{rest.cuisine}</td>
                    <td className="py-3.5 px-2">
                      <span className={`inline-block px-2.5 py-1 rounded-[4px] text-[12px] font-[600] uppercase ${rest.statusBg}`}>
                        {rest.status}
                      </span>
                    </td>
                    <td className="py-3.5 pl-2 text-right">
                      <button
                        type="button"
                        className="px-3 py-1.5 border border-[#F1F1F1] text-[#111827] hover:bg-[#FAFAFA] shadow-[0_4px_16px_rgba(0,0,0,0.06)] font-[500] rounded-[8px] text-[12px] transition-colors cursor-pointer"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
