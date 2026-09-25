import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
export { RestaurantOrdersPage } from './RestaurantOrdersPage';
export { RestaurantMenuPage } from './RestaurantMenuPage';
export { RestaurantProfilePage } from './RestaurantProfilePage';

export { RestaurantVerificationPage } from './RestaurantVerificationPage';
import {
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { restaurantAPI, authAPI, orderAPI } from '../../services/api';
import { PanelLoading } from '../../components/common/PanelLoading';

import totalOrdersIcon from '../../assets/stats/total_orders.png';
import totalRevenueIcon from '../../assets/stats/total_revenue.png';
import pendingOrdersIcon from '../../assets/stats/pending_orders.png';
import averageRatingIcon from '../../assets/stats/average_rating.png';

const allRestaurantLinks = [
  { name: 'Dashboard', path: '/restaurant-panel', icon: LayoutDashboard },
  { name: 'Verification', path: '/restaurant-panel/verification', icon: ShieldCheck },
  { name: 'Orders', path: '/restaurant-panel/orders', icon: ClipboardList },
  { name: 'Menu', path: '/restaurant-panel/menu', icon: UtensilsCrossed },
  { name: 'Profile', path: '/restaurant-panel/profile', icon: Settings },
];

export const RestaurantApp = () => {
  const { getCurrentUserRestaurant, user, login, token, updateUser } = useAuth();
  const location = useLocation();
  const currentRestaurant = getCurrentUserRestaurant();

  const [realTimeStatus, setRealTimeStatus] = useState(() => {
    return (currentRestaurant?.status || user?.status || 'PENDING').toUpperCase();
  });

  const [isApplicationSubmitted, setIsApplicationSubmitted] = useState(() => {
    if ((currentRestaurant?.status || user?.status || '').toUpperCase() === 'REJECTED') return true;
    return Boolean(currentRestaurant?.fssaiDocUrl || user?.fssaiDocUrl);
  });

  useEffect(() => {
    const syncStatus = async () => {
      try {
        const res = await restaurantAPI.getVerification().catch(() => null);
        const meRes = await authAPI.getMe().catch(() => null);

        const fetchedStatus = (
          res?.status ||
          meRes?.status ||
          user?.status ||
          ''
        ).toUpperCase();

        const resData = res?.data || res || {};
        const submitted = Boolean(resData.fssaiDocUrl);

        if (isApplicationSubmitted !== submitted) {
            setIsApplicationSubmitted(submitted);
        }

        if (fetchedStatus) {
          if (realTimeStatus !== fetchedStatus) {
              setRealTimeStatus(fetchedStatus);
          }

          if (user && user.verificationStatus !== fetchedStatus) {
            const updatedUser = {
              ...user,
              verificationStatus: fetchedStatus,
              status: fetchedStatus === 'APPROVED' ? 'Active' : fetchedStatus,
              fssaiDocUrl: resData.fssaiDocUrl
            };
            if (typeof updateUser === 'function') {
              updateUser(updatedUser);
            } else if (typeof login === 'function') {
              login(updatedUser, user.role || 'RESTAURANT', token);
            }
          }
        }
      } catch (err) {
        console.error('Failed to sync verification status:', err);
      }
    };

    syncStatus();
  }, [location.pathname]);

  const rawStatus = realTimeStatus || 'PENDING';
  const isApproved = rawStatus === 'APPROVED' || rawStatus === 'ACTIVE';

  return <DashboardLayout title="Restaurant Manager" sidebarLinks={allRestaurantLinks} showPendingBanner={!isApproved} verificationStatus={rawStatus} isApplicationSubmitted={isApplicationSubmitted} />;
};

export const RestaurantDashboard = () => {
  const navigate = useNavigate();
  const { getCurrentUserRestaurant } = useAuth();
  const currentRestaurant = getCurrentUserRestaurant();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await orderAPI.getMyRestaurantOrders();
        const orderData = Array.isArray(res) ? res : res.data || [];
        const sortedOrders = orderData.sort((a, b) => new Date(b.orderedAt || b.createdAt || 0) - new Date(a.orderedAt || a.createdAt || 0));
        setOrders(sortedOrders);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, ord) => sum + (ord.totalAmount || 0), 0);
  const pendingOrders = orders.filter(o => o.status?.toLowerCase() === 'pending').length;
  const averageRating = currentRestaurant?.rating || '0';

  const stats = [
    {
      title: 'Total Orders',
      value: totalOrders.toString(),
      imageIcon: totalOrdersIcon,
    },
    {
      title: 'Total Revenue',
      value: `₹${totalRevenue.toFixed(2)}`,
      imageIcon: totalRevenueIcon,
    },
    {
      title: 'Pending Orders',
      value: pendingOrders.toString(),
      imageIcon: pendingOrdersIcon,
    },
    {
      title: 'Average Rating',
      value: averageRating.toString(),
      imageIcon: averageRatingIcon,
    },
  ];

  const getBadgeStyle = (status) => {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'PENDING': return 'bg-amber-100/80 text-amber-800 border-amber-200/60';
      case 'PREPARING': return 'bg-blue-100/80 text-blue-800 border-blue-200/60';
      case 'OUT_FOR_DELIVERY': return 'bg-rose-100/80 text-rose-800 border-rose-200/60';
      case 'DELIVERED': return 'bg-emerald-100/80 text-emerald-800 border-emerald-200/60';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const recentOrders = orders.slice(0, 5).map(ord => {
    const dateObj = new Date(ord.orderDate || ord.createdAt || new Date());
    const formattedDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    return {
      id: ord._id || ord.id,
      customer: ord.user?.name || ord.customer?.name || ord.customerName || 'Guest',
      items: (ord.orderItems || ord.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0),
      amount: `₹${ord.totalAmount || 0}`,
      status: ord.orderStatus || ord.status || 'Pending',
      badgeStyle: getBadgeStyle(ord.orderStatus || ord.status),
      date: formattedDate,
    };
  });

  if (isLoading) {
    return <PanelLoading message="Loading dashboard..." />;
  }

  return (
    <div className="space-y-6 font-poppins text-[#111827]">

      <h2 className="text-[28px] font-[700] text-[#111827] tracking-tight">
        Dashboard
      </h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-[#FFFFFF] p-4 sm:p-6 rounded-[14px] border border-[#F1F1F1] shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:space-x-5 transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] cursor-pointer group"
          >
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-[#FF4B2B] flex items-center justify-center shrink-0">
              <img
                src={stat.imageIcon}
                alt={stat.title}
                className="w-5 h-5 sm:w-8 sm:h-8 object-contain brightness-0 invert"
              />
            </div>
            <div>
              <p className="text-[11px] sm:text-[13px] font-[500] text-[#6B7280]">{stat.title}</p>
              <p className="text-[20px] sm:text-[28px] font-[700] text-[#111827] mt-0.5 sm:mt-1 tracking-tight truncate max-w-[120px] sm:max-w-[150px]">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#FFFFFF] rounded-[14px] border border-[#F1F1F1] shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-6 space-y-5">

        <div className="flex items-center justify-between">
          <h3 className="text-[20px] font-[600] text-[#111827] tracking-tight">
            Recent Orders
          </h3>
          <button
            type="button"
            onClick={() => navigate('/restaurant-panel/orders')}
            className="text-[14px] font-[500] text-[#FF4B2B] hover:underline cursor-pointer"
          >
            View All
          </button>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[650px]">
            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-[#FAFAFA] rounded-[10px] text-[12px] font-[500] text-[#6B7280] uppercase tracking-wider mb-2">
              <span className="col-span-2">Order ID</span>
              <span className="col-span-2">Date</span>
              <span className="col-span-2">Customer</span>
              <span className="col-span-1 text-center">Items</span>
              <span className="col-span-1">Amount</span>
              <span className="col-span-2 text-center">Status</span>
              <span className="col-span-2 text-center">Action</span>
            </div>

            {recentOrders.length === 0 ? (
              <div className="py-8 text-center text-[#6B7280] text-[14px]">No recent orders found.</div>
            ) : (
              <div className="divide-y divide-[#F1F1F1]">
                {recentOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="grid grid-cols-12 gap-4 px-4 py-4 items-center text-[14px] hover:bg-[#FAFAFA] transition-colors"
                  >
                    <span className="col-span-2 font-[500] text-[#111827] truncate">
                      {ord.id.substring(0, 8)}...
                    </span>

                    <span className="col-span-2 font-[400] text-[#6B7280] truncate">
                      {ord.date}
                    </span>

                    <span className="col-span-2 font-[400] text-[#111827] truncate">
                      {ord.customer}
                    </span>

                    <span className="col-span-1 text-center font-[400] text-[#6B7280]">
                      {ord.items}
                    </span>

                    <span className="col-span-1 font-[500] text-[#111827]">
                      {ord.amount}
                    </span>

                    <div className="col-span-2 flex justify-center">
                      <span className={`px-3 py-1 rounded-[4px] text-[12px] font-[500] border ${ord.badgeStyle}`}>
                        {ord.status}
                      </span>
                    </div>

                    <div className="col-span-2 flex justify-center">
                      <button
                        type="button"
                        onClick={() => navigate('/restaurant-panel/orders')}
                        className="px-4 py-1.5 border border-[#FF4B2B] text-[#FF4B2B] hover:bg-[#FFF1ED] font-[500] text-[12px] rounded-[10px] transition-colors cursor-pointer"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
