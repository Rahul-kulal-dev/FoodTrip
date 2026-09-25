import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, X, CheckCircle2, Eye, Clock, Truck, AlertCircle } from 'lucide-react';

import { orderAPI } from '../../services/api';
import { PanelLoading } from '../../components/common/PanelLoading';

export const RestaurantOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const getBadgeStyle = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100/80 text-amber-800 border-amber-200/60';
      case 'PREPARING': return 'bg-blue-100/80 text-blue-800 border-blue-200/60';
      case 'OUT_FOR_DELIVERY': return 'bg-rose-100/80 text-rose-800 border-rose-200/60';
      case 'DELIVERED': return 'bg-gray-100/80 text-gray-800 border-gray-200/60';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatusForUI = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'PENDING') return 'Pending';
    if (s === 'PREPARING') return 'Preparing';
    if (s === 'OUT_FOR_DELIVERY') return 'Out for Delivery';
    if (s === 'DELIVERED') return 'Delivered';
    return s;
  };

  const formatAddress = (addr) => {
    if (!addr) return 'N/A';
    if (typeof addr === 'string') return addr;
    return [addr.houseFlat, addr.streetArea, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ') || 'N/A';
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await orderAPI.getMyRestaurantOrders();
      const rawOrders = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
      const normalizedOrders = rawOrders
        .sort((a, b) => new Date(b.orderedAt || b.createdAt || 0) - new Date(a.orderedAt || a.createdAt || 0))
        .map(o => {
        const rawStatus = (o.orderStatus || o.status || 'PENDING').toUpperCase();
        const dateObj = new Date(o.orderedAt || o.createdAt || Date.now());
        const orderItemList = o.items && o.items.length > 0 ? o.items : (o.orderItems || []);
        return {
          dbId: o._id || o.id,
          id: o.orderNumber || `#FD-${Math.floor(100000+Math.random()*900000)}`,
          customer: o.user?.name || o.customerName || 'Customer',
          phone: o.user?.phone || o.customerPhone || 'N/A',
          deliveryAddress: formatAddress(o.deliveryAddress),
          address: formatAddress(o.deliveryAddress),
          itemCount: o.itemsCount || `${orderItemList.reduce((sum, item) => sum + (item.quantity || 1), 0)} items`,
          itemSummary: o.itemsSummary || orderItemList.map(i => i.name || i.foodItem?.name).join(', '),
          amount: `₹${o.totalAmount || 0}`,
          date: dateObj.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
          time: dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          status: rawStatus,
          uiStatus: formatStatusForUI(rawStatus),
          badgeStyle: getBadgeStyle(rawStatus),
          items: orderItemList.map(i => ({ name: i.name || i.foodItem?.name, qty: i.quantity, price: i.price }))
        };
      });
      setOrders(normalizedOrders);
    } catch (err) {
      console.error('Failed to fetch orders', err);
      setError('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchOrders();
  }, []);

  const filterTabs = [
    { label: 'All', count: orders.length, filterValue: 'All' },
    { label: 'Pending', count: orders.filter((o) => o.status === 'PENDING').length, filterValue: 'PENDING' },
    { label: 'Preparing', count: orders.filter((o) => o.status === 'PREPARING').length, filterValue: 'PREPARING' },
    { label: 'Out for Delivery', count: orders.filter((o) => o.status === 'OUT_FOR_DELIVERY').length, filterValue: 'OUT_FOR_DELIVERY' },
    { label: 'Delivered', count: orders.filter((o) => o.status === 'DELIVERED').length, filterValue: 'DELIVERED' },
  ];

  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchId = ord.id.toLowerCase().includes(q);
        const matchCust = ord.customer.toLowerCase().includes(q);
        if (!matchId && !matchCust) return false;
      }
      if (statusFilter !== 'All' && ord.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [orders, searchQuery, statusFilter]);

  const handleUpdateStatus = async (id, newStatus) => {
    const orderToUpdate = orders.find(o => o.id === id);
    if (!orderToUpdate) return;

    const newBadge = getBadgeStyle(newStatus);
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: newStatus, uiStatus: formatStatusForUI(newStatus), badgeStyle: newBadge } : o))
    );
    if (selectedOrder && selectedOrder.id === id) {
      setSelectedOrder((prev) => ({ ...prev, status: newStatus, uiStatus: formatStatusForUI(newStatus), badgeStyle: newBadge }));
    }

    try {
      await orderAPI.updateStatus(orderToUpdate.dbId, newStatus);
    } catch (err) {
      console.error('Failed to update status', err);
      fetchOrders();
    }
  };

  if (loading && orders.length === 0) {
    return <PanelLoading message="Loading orders..." />;
  }

  return (
    <div className="space-y-6 font-poppins text-[#111827]">

      <h2 className="text-[28px] font-[700] text-[#111827] tracking-tight">
        Orders
      </h2>

      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">

        <div className="relative w-full xl:w-96 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID or Customer name..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#F1F1F1] rounded-[10px] text-[14px] text-[#111827] placeholder-[#6B7280] shadow-xs focus:outline-none focus:border-[#FF4B2B] focus:ring-1 focus:ring-[#FF4B2B] transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth touch-pan-x">
          {filterTabs.map((tab) => {
            const isSelected = statusFilter === tab.filterValue;
            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => setStatusFilter(tab.filterValue)}
                className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-[10px] text-[11.5px] sm:text-[12px] font-[600] transition-all whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#FF4B2B] text-white shadow-xs'
                    : 'bg-white text-[#6B7280] border border-[#F1F1F1] hover:bg-gray-50'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isSelected ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

      </div>

      <div className="hidden md:block bg-[#FFFFFF] rounded-[14px] border border-[#F1F1F1] shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-6 space-y-4">

        <div className="overflow-x-auto">
          <div className="min-w-[850px]">
            <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-[#FAFAFA] rounded-[10px] text-[12px] font-[500] text-[#6B7280] uppercase tracking-wider mb-2">
              <span className="col-span-2">Order ID</span>
              <span className="col-span-2">Customer</span>
              <span className="col-span-3">Items</span>
              <span className="col-span-1">Amount</span>
              <span className="col-span-2">Date & Time</span>
              <span className="col-span-1 text-center">Status</span>
              <span className="col-span-1 text-center">Action</span>
            </div>

            {loading ? (
              <PanelLoading message="Loading orders..." fullPage={false} />
            ) : error ? (
              <div className="text-center py-10 text-red-500 text-sm font-medium flex items-center justify-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-sm font-medium">
                No orders match your search query or status filter.
              </div>
            ) : (
              <div className="divide-y divide-[#F1F1F1]">
                {filteredOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="grid grid-cols-12 gap-3 px-4 py-4 items-center text-[14px] hover:bg-[#FAFAFA] transition-colors"
                  >
                    <span className="col-span-2 font-[500] text-[#111827]">
                      {ord.id}
                    </span>

                    <span className="col-span-2 font-[400] text-[#111827] truncate">
                      {ord.customer}
                    </span>

                    <div className="col-span-3 min-w-0">
                      <p className="font-[400] text-[#111827] text-[12px]">
                        {ord.itemCount}
                      </p>
                      <p className="text-[12px] text-[#6B7280] truncate">
                        {ord.itemSummary}
                      </p>
                    </div>

                    <span className="col-span-1 font-[500] text-[#111827]">
                      {ord.amount}
                    </span>

                    <div className="col-span-2 text-[12px]">
                      <p className="font-[400] text-[#111827]">{ord.date}</p>
                      <p className="text-[#6B7280]">{ord.time}</p>
                    </div>

                    <div className="col-span-1 flex justify-center">
                      <span className={`px-3 py-1 rounded-[4px] text-[12px] font-[500] border whitespace-nowrap ${ord.badgeStyle}`}>
                        {ord.uiStatus}
                      </span>
                    </div>

                    <div className="col-span-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(ord)}
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

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100 text-xs text-gray-500 font-semibold">
          <span>
            Showing 1–{filteredOrders.length} of {orders.length} orders
          </span>

          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                currentPage === 1
                  ? 'bg-[#FF5200] text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-700'
              }`}
            >
              1
            </button>

            <button
              type="button"
              onClick={() => setCurrentPage(2)}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                currentPage === 2
                  ? 'bg-[#FF5200] text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-700'
              }`}
            >
              2
            </button>

            <button
              type="button"
              onClick={() => setCurrentPage(2)}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      <div className="md:hidden space-y-3">
        {loading ? (
          <PanelLoading message="Loading orders..." fullPage={false} />
        ) : error ? (
          <div className="text-center py-10 text-red-500 text-sm font-medium flex items-center justify-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-sm font-medium">
            No orders match your search query or status filter.
          </div>
        ) : (
          filteredOrders.map((ord) => (
            <div
              key={ord.id}
              className="bg-[#FFFFFF] rounded-[14px] border border-[#F1F1F1] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-4 space-y-3 hover:border-gray-200 transition-all"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-[600] text-[14px] text-[#111827]">{ord.id}</span>
                <div className="relative">
                  <select
                    value={ord.status}
                    onChange={(e) => handleUpdateStatus(ord.id, e.target.value)}
                    className={`text-[11px] font-[600] px-2 py-1 rounded-[6px] border cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#FF4B2B] ${ord.badgeStyle}`}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PREPARING">Preparing</option>
                    <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                    <option value="DELIVERED">Delivered</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[13px] font-[500] text-[#111827]">{ord.customer}</p>
                <p className="text-[12px] text-[#6B7280] truncate">{ord.itemSummary}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#F5F5F5]">
                <span className="font-[600] text-[15px] text-[#FF4B2B]">{ord.amount}</span>
                <span className="text-[11px] text-[#6B7280] font-[400]">{ord.date}, {ord.time}</span>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-[#F5F5F5]">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(ord)}
                  className="flex-1 py-2 px-3 border border-[#FF4B2B] text-[#FF4B2B] hover:bg-[#FFF1ED] font-[600] text-[12px] rounded-[10px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </button>

                {ord.status === 'PENDING' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(ord.id, 'PREPARING')}
                    className="flex-1 py-2 px-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-[600] text-[12px] rounded-[10px] flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Start Preparing</span>
                  </button>
                )}
                {ord.status === 'PREPARING' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(ord.id, 'OUT_FOR_DELIVERY')}
                    className="flex-1 py-2 px-3 bg-[#F59E0B] hover:bg-[#D97706] text-white font-[600] text-[12px] rounded-[10px] flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Out for Delivery</span>
                  </button>
                )}
                {ord.status === 'OUT_FOR_DELIVERY' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(ord.id, 'DELIVERED')}
                    className="flex-1 py-2 px-3 bg-[#22C55E] hover:bg-[#16A34A] text-white font-[600] text-[12px] rounded-[10px] flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Delivered</span>
                  </button>
                )}
                {ord.status === 'DELIVERED' && (
                  <div className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 font-[500] text-[12px] rounded-[10px] flex items-center justify-center gap-1.5 border border-gray-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Delivered</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        <div className="flex items-center justify-center gap-4 pt-2 text-xs text-gray-500 font-semibold">
          <span>Showing {filteredOrders.length} of {orders.length}</span>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4 font-poppins">
          <div className="bg-[#FFFFFF] w-full sm:max-w-lg rounded-t-[20px] sm:rounded-[14px] p-5 sm:p-8 space-y-5 sm:space-y-6 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] sm:shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-[#F1F1F1] max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between border-b border-[#F1F1F1] pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-[18px] sm:text-[20px] font-[600] text-[#111827]">
                    Order {selectedOrder.id}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-[4px] text-[12px] font-[500] border ${selectedOrder.badgeStyle}`}>
                    {selectedOrder.uiStatus}
                  </span>
                </div>
                <p className="text-[12px] text-[#6B7280] font-[400] mt-0.5">
                  Placed on {selectedOrder.date} at {selectedOrder.time}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-[#6B7280] hover:text-[#111827] p-1.5 rounded-full hover:bg-[#FAFAFA] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#FAFAFA] rounded-[14px] p-4 space-y-1.5 border border-[#F1F1F1] text-[12px]">
              <div className="flex justify-between">
                <span className="font-[400] text-[#6B7280]">Customer:</span>
                <span className="font-[500] text-[#111827]">{selectedOrder.customer}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-[400] text-[#6B7280]">Phone:</span>
                <span className="font-[500] text-[#111827]">{selectedOrder.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-[400] text-[#6B7280]">Delivery Address:</span>
                <span className="font-[500] text-[#111827] text-right max-w-[60%]">{selectedOrder.deliveryAddress || selectedOrder.address}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-[12px] font-[500] text-[#6B7280] uppercase tracking-wider">
                Order Items
              </h4>
              <div className="divide-y divide-[#F1F1F1] border border-[#F1F1F1] rounded-[14px] p-4 bg-[#FFFFFF] space-y-2 text-[12px]">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center pt-2 first:pt-0">
                    <span className="font-[400] text-[#111827]">
                      {item.name} × {item.qty}
                    </span>
                    <span className="font-[500] text-[#111827]">
                      ₹{item.price * item.qty}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3 border-t border-[#F1F1F1] text-[14px] font-[600] text-[#111827]">
                  <span>Total Amount</span>
                  <span className="text-[#FF4B2B]">{selectedOrder.amount}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="block text-[12px] font-[500] text-[#6B7280] mb-2">
                Order Action
              </label>
              {selectedOrder.status === 'PENDING' && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'PREPARING')}
                  className="w-full py-3 rounded-[10px] bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[14px] font-[600] transition-colors cursor-pointer"
                >
                  Start Preparing
                </button>
              )}
              {selectedOrder.status === 'PREPARING' && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'OUT_FOR_DELIVERY')}
                  className="w-full py-3 rounded-[10px] bg-[#F59E0B] hover:bg-[#D97706] text-white text-[14px] font-[600] transition-colors cursor-pointer"
                >
                  Mark as Out for Delivery
                </button>
              )}
              {selectedOrder.status === 'OUT_FOR_DELIVERY' && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'DELIVERED')}
                  className="w-full py-3 rounded-[10px] bg-[#22C55E] hover:bg-[#16A34A] text-white text-[14px] font-[600] transition-colors cursor-pointer"
                >
                  Mark as Delivered
                </button>
              )}
              {selectedOrder.status === 'DELIVERED' && (
                <div className="w-full py-3 rounded-[10px] bg-[#FAFAFA] border border-[#F1F1F1] text-center text-[#6B7280] text-[13px] font-[500]">
                  Order Delivered
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 pb-2 sm:pb-0">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-2.5 rounded-[10px] bg-[#FF4B2B] hover:bg-[#e03a00] text-white font-[500] text-[14px] transition-all shadow-xs cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
