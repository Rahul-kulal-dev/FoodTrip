import React, { useState, useEffect } from 'react';
import {
  MapPin,
  CheckCircle2,
  X,
  ShoppingBag,
  Clock,
  Truck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { orderAPI } from '../services/api';
import { TrackOrderModal } from '../components/orders/TrackOrderModal';
import { Lottie } from 'lottie-react';
import successAnimation from '../assets/success-checkmark.json';

const formatStatusForUI = (status) => {
  const s = (status || '').toUpperCase();
  if (s === 'PENDING') return 'Pending';
  if (s === 'PREPARING') return 'Preparing';
  if (s === 'OUT_FOR_DELIVERY') return 'On the Way';
  if (s === 'DELIVERED') return 'Delivered';
  return s;
};

export const OrdersPage = () => {
  const [activeTab, setActiveTab] = useState('All Orders');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(7);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 7,
    total: 0,
    totalPages: 1,
  });

  const fetchOrders = async (page = currentPage, limit = ordersPerPage) => {
    setIsLoading(true);
    try {
      const response = await orderAPI.getAll({
        page,
        limit,
      });

      const items = Array.isArray(response)
        ? response
        : (response.data || response.content || []);

      const formatted = items.map(o => ({
        id: o.orderNumber || o._id || o.id,
        restaurantName: o.restaurant?.name || o.restaurantName || 'Unknown Restaurant',
        cuisine: o.restaurant?.cuisine || o.cuisine || 'Multi-Cuisine',
        city: o.restaurant?.city || 'Mangalore',
        image: (() => {
          const img = o.restaurant?.logoImage || o.restaurant?.coverImage || o.restaurant?.logo || o.restaurant?.logoUrl || o.restaurant?.image || o.restaurantImage;
          if (!img) return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80';
          return img.startsWith('http') ? img : `https://d1do212giwnd6s.cloudfront.net/${img}`;
        })(),
        itemsCount: ((o.orderItems || o.items) && (o.orderItems || o.items).length > 0) 
          ? (() => { const t = (o.orderItems || o.items).reduce((sum, i) => sum + (i.quantity || 1), 0); return `${t} item${t > 1 ? 's' : ''}`; })() 
          : (o.itemsCount || '1 item'),
        itemsSummary: ((o.orderItems || o.items) && (o.orderItems || o.items).length > 0)
          ? (o.orderItems || o.items).map(i => `${i.quantity || 1} × ${i.name || i.foodItem?.name || 'Item'}`).join(', ')
          : (o.itemsSummary || ''),
        deliveryAddress: o.deliveryAddress,
        location: (() => {
          const addr = o.deliveryAddress;
          if (!addr) return 'Koramangala, Bangalore';
          if (typeof addr === 'string') return addr;
          return [addr.houseFlat, addr.streetArea, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ') || addr.city || 'Koramangala, Bangalore';
        })(),
        price: o.totalAmount || o.price || 0,
        paymentMethod: (o.paymentMethod || '').toUpperCase() === 'ONLINE' ? 'Paid Online' : 'Cash on Delivery',
        status: (o.orderStatus || o.status || 'PENDING').toUpperCase(),
        items: o.orderItems || o.items || [],
      }));

      setOrders(formatted);

      if (response && (response.total !== undefined || response.totalPages !== undefined)) {
        setPagination({
          page: response.page || page,
          limit: response.limit || limit,
          total: response.total !== undefined ? response.total : formatted.length,
          totalPages: response.totalPages || 1,
        });
      } else {
        setPagination({
          page,
          limit,
          total: formatted.length,
          totalPages: Math.ceil(formatted.length / limit) || 1,
        });
      }

      setTrackingOrder(prev => {
        if (!prev) return null;
        const updated = formatted.find(o => o.id === prev.id);
        return updated || prev;
      });

      setSelectedOrder(prev => {
        if (!prev) return null;
        const updated = formatted.find(o => o.id === prev.id);
        return updated || prev;
      });
    } catch (err) {
      console.warn('Live order fetch failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(currentPage, ordersPerPage);
  }, [currentPage, ordersPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'Delivered') return order.status === 'DELIVERED';
    if (activeTab === 'Ongoing') return order.status !== 'DELIVERED';
    return true;
  });

  const isAllTab = activeTab === 'All Orders';
  const totalCount = isAllTab ? pagination.total : filteredOrders.length;
  const totalPages = isAllTab ? pagination.totalPages : Math.ceil(filteredOrders.length / ordersPerPage) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = totalCount > 0 ? (safeCurrentPage - 1) * ordersPerPage + 1 : 0;
  const endIndex = isAllTab
    ? Math.min((safeCurrentPage - 1) * ordersPerPage + orders.length, totalCount)
    : Math.min(startIndex + filteredOrders.length - 1, totalCount);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (safeCurrentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (safeCurrentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-poppins">

      <div className="space-y-1">
        <h1 className="text-[32px] sm:text-[36px] font-[700] text-[#111827] tracking-tight">
          My Orders
        </h1>
        <p className="text-[14px] text-[#6B7280] font-[400]">
          View and manage your orders
        </p>
      </div>

      <div className="pt-2 w-full">
        <div className="flex w-full sm:inline-flex sm:w-auto items-center justify-between bg-[#FFFFFF] border border-[#F1F1F1] rounded-[10px] sm:rounded-[12px] p-1 sm:p-1.5 shadow-sm">
          {['All Orders', 'Ongoing', 'Delivered'].map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex-1 sm:flex-none px-1 sm:px-6 py-1.5 sm:py-2 rounded-[6px] sm:rounded-[8px] text-[10px] min-[375px]:text-[11px] sm:text-[14px] font-[600] transition-all cursor-pointer whitespace-nowrap text-center ${
                  isSelected
                    ? 'bg-[#FFF1ED] text-[#FF4B2B] shadow-sm sm:shadow-none'
                    : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB]'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4 pt-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-[#6B7280]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF4B2B] mx-auto"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-[#6B7280] space-y-4">
            <ShoppingBag className="w-12 h-12 text-[#D1D5DB] mx-auto" />
            <p className="font-[500] text-[15px]">
              No {activeTab.toLowerCase()} orders found.
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            let statusBg = 'bg-[#F9FAFB] text-[#111827]';
            let StatusIcon = CheckCircle2;
            let actionText = 'View Details';

            if (order.status === 'DELIVERED') {
              statusBg = 'bg-[#DCFCE7] text-[#16A34A]';
              StatusIcon = CheckCircle2;
              actionText = 'View Details';
            } else if (order.status === 'PREPARING') {
              statusBg = 'bg-[#E0F2FE] text-[#0284C7]';
              StatusIcon = Clock;
              actionText = 'Track Order';
            } else if (order.status === 'OUT_FOR_DELIVERY') {
              statusBg = 'bg-[#FEF3C7] text-[#D97706]';
              StatusIcon = Truck;
              actionText = 'Track Order';
            } else {
              statusBg = 'bg-[#F9FAFB] text-[#111827]';
              StatusIcon = CheckCircle2;
              actionText = 'Track Order';
            }

            return (
              <div
                key={order.id}
                className="bg-[#FFFFFF] rounded-[14px] border border-[#F1F1F1] shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-3 lg:p-5 grid grid-cols-2 lg:flex lg:flex-row lg:items-center lg:justify-between gap-2.5 lg:gap-6 transition-all hover:shadow-md"
              >
                <div className="col-span-2 lg:col-auto flex items-center space-x-3 lg:space-x-4 lg:min-w-[240px] flex-1">
                  <img
                    src={order.image}
                    alt={order.restaurantName}
                    className="w-14 h-14 lg:w-[72px] lg:h-[72px] rounded-[10px] object-cover shrink-0 border border-[#F1F1F1]"
                  />
                  <div className="min-w-0 flex flex-col justify-center">
                    <h3 className="font-[700] text-[#111827] text-[15px] lg:text-[16px] tracking-tight truncate">
                      {order.restaurantName}
                    </h3>
                    <p className="text-[13px] text-[#4B5563] font-[500] truncate mt-1.5 leading-snug">
                      {order.itemsSummary || order.itemsCount}
                    </p>
                  </div>
                </div>

                <div className="hidden lg:flex col-span-1 lg:col-auto flex-col space-y-0.5 lg:space-y-1 lg:min-w-[100px]">
                  <span className="text-[11px] lg:text-[12px] text-[#6B7280] font-[500]">Order ID</span>
                  <span className="text-[13px] lg:text-[14px] font-[600] text-[#111827]">{order.id}</span>
                </div>

                <div className="col-span-1 lg:col-auto flex flex-col justify-center lg:min-w-[140px]">
                  <span className="text-[12px] lg:text-[14px] text-[#6B7280] font-[500]">{order.date}</span>
                </div>

                <div className="col-span-1 lg:col-auto flex flex-col items-end lg:items-start justify-center lg:justify-start lg:space-y-1 lg:min-w-[120px]">
                  <span className="text-[14px] lg:text-[16px] font-[700] text-[#FF4B2B]">₹{order.price}</span>
                  <span className="hidden lg:block text-[11px] lg:text-[12px] text-[#6B7280] font-[500]">{order.paymentMethod || 'Cash on Delivery'}</span>
                </div>

                <div className="col-span-2 lg:col-auto flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start lg:space-y-3 lg:min-w-[140px] shrink-0 pt-2 lg:pt-0 mt-1 lg:mt-0 border-t border-[#F1F1F1] lg:border-t-0">
                  <div className={`${statusBg} px-2.5 lg:px-3 py-1 rounded-full text-[11px] lg:text-[12px] font-[700] flex items-center space-x-1 lg:space-x-1.5`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    <span>{formatStatusForUI(order.status)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (actionText === 'Track Order') {
                        setTrackingOrder(order);
                      } else {
                        setSelectedOrder(order);
                      }
                    }}
                    className={`w-auto lg:w-full px-4 lg:px-0 py-1.5 lg:py-2 border font-[600] text-[12px] lg:text-[13px] rounded-[8px] lg:rounded-[10px] transition-colors text-center cursor-pointer ${
                      actionText === 'Track Order'
                        ? 'border-[#FF4B2B] text-[#FF4B2B] hover:bg-[#FFF1ED]' 
                        : 'border-[#F1F1F1] text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827]'
                    }`}
                  >
                    {actionText}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {!isLoading && filteredOrders.length > 0 && totalPages > 1 && (
        <div className="bg-[#FFFFFF] rounded-[14px] border border-[#F1F1F1] shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm font-semibold text-[#6B7280]">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              Showing <span className="font-bold text-[#111827]">{startIndex}</span>–<span className="font-bold text-[#111827]">{endIndex}</span> of{' '}
              <span className="font-bold text-[#111827]">{totalCount}</span> orders
            </span>

            {totalCount > 7 && (
              <div className="flex items-center gap-1.5 ml-0 sm:ml-2 pl-0 sm:pl-3 sm:border-l border-gray-200">
                <span className="text-[12px] text-gray-500 font-medium">Per page:</span>
                <select
                  value={ordersPerPage}
                  onChange={(e) => {
                    setOrdersPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-[#F9FAFB] border border-[#F1F1F1] rounded-lg px-2 py-1 text-xs font-bold text-[#111827] focus:outline-none cursor-pointer"
                >
                  <option value={7}>7</option>
                  <option value={14}>14</option>
                  <option value={21}>21</option>
                </select>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center space-x-1 sm:space-x-1.5">
              <button
                type="button"
                disabled={safeCurrentPage <= 1}
                onClick={() => {
                  setCurrentPage((prev) => Math.max(prev - 1, 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-3 py-1.5 rounded-[8px] text-xs font-bold border border-[#F1F1F1] text-[#111827] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F9FAFB] flex items-center space-x-1 cursor-pointer transition-all"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
              </button>

              <div className="flex items-center space-x-1">
                {getPageNumbers().map((p, idx) =>
                  p === '...' ? (
                    <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-400 font-bold">
                      ...
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setCurrentPage(p);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`w-8 h-8 rounded-[8px] text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                        safeCurrentPage === p
                          ? 'bg-[#FF4B2B] text-white shadow-xs'
                          : 'border border-[#F1F1F1] text-[#111827] hover:bg-[#F9FAFB]'
                      }`}
                      aria-current={safeCurrentPage === p ? 'page' : undefined}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>

              <button
                type="button"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => {
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-3 py-1.5 rounded-[8px] text-xs font-bold border border-[#F1F1F1] text-[#111827] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F9FAFB] flex items-center space-x-1 cursor-pointer transition-all"
                aria-label="Next page"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      <TrackOrderModal
        order={trackingOrder}
        isOpen={!!trackingOrder}
        onClose={() => setTrackingOrder(null)}
        onRefresh={fetchOrders}
      />

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm font-poppins">
          <div className="bg-[#FFFFFF] w-full max-w-md rounded-[14px] shadow-[0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">

            <div className="p-5 border-b border-[#F1F1F1] flex items-center justify-between">
              <div>
                <h2 className="text-[18px] font-[700] text-[#111827] tracking-tight">{selectedOrder.restaurantName}</h2>
                <p className="text-[13px] font-[500] text-[#6B7280] mt-0.5">Order ID: {selectedOrder.id}</p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="relative flex justify-between mb-8 px-2">
                <div className="absolute top-6 left-[32px] right-[32px] h-1 bg-gray-200 rounded-full z-0">
                  <div 
                    className="absolute top-0 left-0 h-full bg-[#FF4B2B] rounded-full z-0 transition-all duration-500"
                    style={{ width: `${
                      selectedOrder.status === 'DELIVERED' ? 100 :
                      selectedOrder.status === 'OUT_FOR_DELIVERY' ? 66.66 :
                      selectedOrder.status === 'PREPARING' ? 33.33 : 0
                    }%` }}
                  />
                </div>

                {[
                  { id: 1, label: 'Pending', img: '/pending-icon.png' },
                  { id: 2, label: 'Preparing', img: '/preparing-icon.png' },
                  { id: 3, label: 'On the Way', img: '/on-the-way-icon.png' },
                  { id: 4, label: 'Delivered', img: '/delivered-icon.svg' }
                ].map((step) => {
                  const currentStepId = selectedOrder.status === 'DELIVERED' ? 4 :
                    selectedOrder.status === 'OUT_FOR_DELIVERY' ? 3 :
                    selectedOrder.status === 'PREPARING' ? 2 : 1;

                  const isCompleted = currentStepId >= step.id;
                  const isActive = currentStepId === step.id;

                  return (
                    <div key={step.id} className="relative z-10 flex flex-col items-center">
                      <div className={`relative w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-colors duration-300 ${
                        isCompleted 
                          ? 'bg-[#FF4B2B] text-white' 
                          : 'bg-gray-200 text-gray-400'
                      }`}>
                        {isActive && (
                          <div className="absolute inset-0 rounded-full bg-[#FF4B2B] animate-ripple"></div>
                        )}
                        <div className="relative z-10 flex items-center justify-center">
                          {step.img ? (
                            <img src={step.img} alt={step.label} className={`w-7 h-7 object-contain ${!isCompleted && 'opacity-50 grayscale'}`} />
                          ) : step.fallbackIcon ? (
                            <step.fallbackIcon className="w-6 h-6" />
                          ) : (
                            <div className="w-3 h-3 rounded-full bg-white opacity-50" />
                          )}
                        </div>
                      </div>
                      <span className={`text-[11px] font-[600] mt-2 text-center absolute top-14 whitespace-nowrap ${
                        isCompleted ? 'text-[#111827]' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {selectedOrder.status === 'DELIVERED' && (
                <div className="flex flex-col items-center justify-center mb-4 mt-2">
                  <div className="w-24 h-24 flex items-center justify-center">
                    <Lottie src={successAnimation} autoplay loop={false} />
                  </div>
                  <h3 className="text-[16px] font-[700] text-[#16A34A] mt-1 tracking-tight">Delivered</h3>
                </div>
              )}

              <hr className="border-[#F1F1F1] my-5" />

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-[12px] font-[600] text-gray-500 uppercase tracking-wider">Delivery Address</p>
                    <p className="text-[13px] font-[500] text-[#111827] mt-1">{selectedOrder.location}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-[12px] font-[600] text-gray-500 uppercase tracking-wider">Placed Time</p>
                    <p className="text-[13px] font-[500] text-[#111827] mt-1">{selectedOrder.date}</p>
                  </div>
                </div>
              </div>

              <hr className="border-[#F1F1F1] my-5" />

              <div>
                <h4 className="text-[14px] font-[600] text-[#111827] mb-3">Order Summary</h4>
                <div className="space-y-3 max-h-[200px] overflow-y-auto no-scrollbar pr-2">
                  {selectedOrder.items?.map((item, i) => (
                    <div key={i} className="flex items-center justify-between pb-3 border-b border-[#F1F1F1] last:border-0 last:pb-0">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={
                            item.image
                              ? (item.image.startsWith('http') ? item.image : `https://d1do212giwnd6s.cloudfront.net/${item.image}`)
                              : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'
                          }
                          alt={item.name}
                          className="w-12 h-12 rounded-[8px] object-cover bg-[#F9FAFB] border border-[#F1F1F1]"
                        />
                        <div>
                          <p className="text-[13px] font-[600] text-[#111827]">
                            {item.name}
                          </p>
                          <p className="text-[12px] font-[500] text-gray-500">
                            {item.quantity}x
                          </p>
                        </div>
                      </div>
                      <p className="text-[14px] font-[700] text-[#111827]">₹{item.price * (item.quantity || 1)}</p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-dashed border-gray-200">
                  <p className="text-[14px] font-[700] text-[#111827]">Total Amount</p>
                  <p className="text-[16px] font-[800] text-[#FF4B2B]">₹{selectedOrder.price}</p>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-[#F1F1F1] bg-gray-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2.5 rounded-[10px] border border-[#F1F1F1] font-[600] text-[14px] text-[#6B7280] hover:bg-[#F9FAFB] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
