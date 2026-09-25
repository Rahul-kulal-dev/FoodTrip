import React, { useState, useEffect } from 'react';
import {
  Search,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  Loader2,
  Eye,
  X,
} from 'lucide-react';
import { adminAPI } from '../../services/api';

export const AdminOrdersPage = () => {
  const [ordersList, setOrdersList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingOrder, setViewingOrder] = useState(null);

  const loadAdminOrders = async () => {
    try {
      setIsLoading(true);
      const res = await adminAPI.getOrders();
      const items = Array.isArray(res) ? res : res.data || [];
      setOrdersList(items);
    } catch (err) {
      console.error('Failed to load admin orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminOrders();
  }, []);

  const counts = {
    All: ordersList.length,
    Pending: ordersList.filter((o) => (o.status || '').toUpperCase() === 'PENDING').length,
    Preparing: ordersList.filter((o) => (o.status || '').toUpperCase() === 'PREPARING').length,
    OutForDelivery: ordersList.filter((o) => (o.status || '').toUpperCase() === 'OUT_FOR_DELIVERY').length,
    Delivered: ordersList.filter((o) => (o.status || '').toUpperCase() === 'DELIVERED').length,
  };

  const filteredOrders = ordersList.filter((order) => {
    const matchesSearch =
      (order.orderNumber || order._id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.user?.name || order.user?.email || order.customerName || order.customerEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.restaurant?.name || order.restaurantName || '').toLowerCase().includes(searchQuery.toLowerCase());

    const statusStr = (order.orderStatus || order.status || '').toUpperCase();
    let matchesTab = true;
    if (activeTab === 'Pending') matchesTab = statusStr === 'PENDING';
    else if (activeTab === 'Preparing') matchesTab = statusStr === 'PREPARING';
    else if (activeTab === 'OutForDelivery') matchesTab = statusStr === 'OUT_FOR_DELIVERY';
    else if (activeTab === 'Delivered') matchesTab = statusStr === 'DELIVERED';

    return matchesSearch && matchesTab;
  });

  const formatDeliveryAddress = (addr) => {
    if (!addr) return 'N/A';
    if (typeof addr === 'string') return addr;
    return [addr.houseFlat, addr.streetArea, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ') || addr.city || 'N/A';
  };

  const renderStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'DELIVERED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-[11px] font-[500] bg-[#DCFCE7] text-[#15803D] border border-[#22C55E]/20">
          <CheckCircle2 className="w-3 h-3 text-[#22C55E]" />
          Delivered
        </span>
      );
    } else if (s === 'PREPARING') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-[11px] font-[500] bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          Preparing
        </span>
      );
    } else if (s === 'OUT_FOR_DELIVERY') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-[11px] font-[500] bg-sky-50 text-sky-700 border border-sky-200">
          <Truck className="w-3 h-3 text-sky-600" />
          Out for Delivery
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-[11px] font-[500] bg-[#FAFAFA] text-[#6B7280] border border-[#F1F1F1]">
        Pending
      </span>
    );
  };

  return (
    <div className="space-y-6 font-poppins text-[#111827]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-[700] text-[#111827] tracking-tight">
            Orders Management
          </h1>
          <p className="text-[14px] font-[500] text-[#6B7280] mt-1">
            Monitor real customer food delivery orders, status updates, and transaction details across all restaurants.
          </p>
        </div>
      </div>

      <div className="bg-[#FFFFFF] rounded-[14px] border border-[#F1F1F1] p-2 shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('All')}
          className={`px-4 py-2.5 rounded-[10px] text-[14px] font-[500] transition-all cursor-pointer ${activeTab === 'All' ? 'bg-[#FFF1ED] text-[#FF4B2B] shadow-sm border border-[#FF4B2B]/15' : 'text-[#6B7280] hover:bg-[#FAFAFA]'
            }`}
        >
          All Orders ({counts.All})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('Preparing')}
          className={`px-4 py-2.5 rounded-[10px] text-[14px] font-[500] transition-all cursor-pointer ${activeTab === 'Preparing' ? 'bg-[#FFF1ED] text-[#FF4B2B] shadow-sm border border-[#FF4B2B]/15' : 'text-[#6B7280] hover:bg-[#FAFAFA]'
            }`}
        >
          Preparing ({counts.Preparing})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('OutForDelivery')}
          className={`px-4 py-2.5 rounded-[10px] text-[14px] font-[500] transition-all cursor-pointer ${activeTab === 'OutForDelivery' ? 'bg-[#FFF1ED] text-[#FF4B2B] shadow-sm border border-[#FF4B2B]/15' : 'text-[#6B7280] hover:bg-[#FAFAFA]'
            }`}
        >
          Out for Delivery ({counts.OutForDelivery})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('Delivered')}
          className={`px-4 py-2.5 rounded-[10px] text-[14px] font-[500] transition-all cursor-pointer ${activeTab === 'Delivered' ? 'bg-[#FFF1ED] text-[#FF4B2B] shadow-sm border border-[#FF4B2B]/15' : 'text-[#6B7280] hover:bg-[#FAFAFA]'
            }`}
        >
          Delivered ({counts.Delivered})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('Pending')}
          className={`px-4 py-2.5 rounded-[10px] text-[14px] font-[500] transition-all cursor-pointer ${activeTab === 'Pending' ? 'bg-[#FFF1ED] text-[#FF4B2B] shadow-sm border border-[#FF4B2B]/15' : 'text-[#6B7280] hover:bg-[#FAFAFA]'
            }`}
        >
          Pending ({counts.Pending})
        </button>
      </div>

      <div className="bg-[#FFFFFF] rounded-[14px] border border-[#F1F1F1] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)] space-y-5">
        <div className="relative w-full sm:w-80 lg:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order ID, customer, or restaurant..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#FFFFFF] border border-[#F1F1F1] rounded-[10px] text-[14px] text-[#111827] placeholder:text-[#6B7280] focus:outline-none focus:ring-1 focus:ring-[#FF4B2B] focus:border-[#FF4B2B] transition-all"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#F1F1F1] text-[12px] font-[500] text-[#6B7280]">
                <th className="py-3 px-3">Order ID</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Restaurant</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F1F1] text-[14px] text-[#111827]">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-[#6B7280] font-[500]">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-[#FF4B2B]" />
                      <span className="text-[14px]">Loading live system orders...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12">
                    <div className="flex flex-col items-center gap-1">
                      <ShoppingBag className="w-8 h-8 text-[#D1D5DB]" />
                      <span className="text-[14px] font-[500] text-[#6B7280]">No orders found.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order._id || order.id || order.orderNumber} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="py-3.5 px-3 font-[600] text-[#111827]">{order.orderNumber || order.id || order._id || 'N/A'}</td>
                    <td className="py-3.5 px-3">
                      <div className="font-[500] text-[#111827]">{order.user?.name || order.user?.email || order.customerName || 'Guest'}</div>
                      <div className="text-[11px] text-[#6B7280]">{[order.deliveryAddress?.city, order.deliveryAddress?.pincode].filter(Boolean).join(' - ') || order.deliveryAddress?.city || (typeof order.deliveryAddress === 'string' ? order.deliveryAddress : 'N/A')}</div>
                    </td>
                    <td className="py-3.5 px-3 font-[500] text-[#111827]">{order.restaurantName || order.restaurant?.name || 'N/A'}</td>
                    <td className="py-3.5 px-3 font-[600] text-[#111827]">₹{order.totalAmount || order.amount || 0}</td>
                    <td className="py-3.5 px-3 uppercase text-[11px] font-[500] text-[#6B7280]">
                      {order.paymentMethod || order.paymentMode || 'N/A'}
                    </td>
                    <td className="py-3.5 px-3">{renderStatusBadge(order.status || order.orderStatus)}</td>
                    <td className="py-3.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => setViewingOrder(order)}
                        className="px-3 py-1.5 border border-[#F1F1F1] text-[#111827] hover:bg-[#FAFAFA] font-[500] shadow-[0_4px_16px_rgba(0,0,0,0.06)] rounded-[8px] text-[12px] flex items-center gap-1.5 mx-auto transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewingOrder && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-[14px] max-w-lg w-full p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-[#F1F1F1] relative space-y-4">
            <div className="flex items-center justify-between border-b border-[#F1F1F1] pb-3">
              <h3 className="text-[20px] font-[600] text-[#111827]">
                Order {viewingOrder.orderNumber || viewingOrder.id || viewingOrder._id}
              </h3>
              <button onClick={() => setViewingOrder(null)} className="text-[#6B7280] hover:text-[#111827] p-1.5 rounded-[10px] hover:bg-[#FAFAFA]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-[14px]">
              <div className="p-3 bg-[#FAFAFA] rounded-[10px] flex justify-between border border-[#F1F1F1]">
                <span className="text-[#6B7280]">Restaurant</span>
                <span className="font-[600] text-[#111827]">{viewingOrder.restaurantName || viewingOrder.restaurant?.name || 'N/A'}</span>
              </div>
              <div className="p-3 bg-[#FAFAFA] rounded-[10px] flex justify-between border border-[#F1F1F1]">
                <span className="text-[#6B7280]">Customer</span>
                <span className="font-[600] text-[#111827]">{viewingOrder.user?.name || viewingOrder.user?.email || viewingOrder.customerName || 'Guest'}</span>
              </div>
              <div className="p-3 bg-[#FAFAFA] rounded-[10px] flex justify-between border border-[#F1F1F1]">
                <span className="text-[#6B7280]">Delivery Address</span>
                <span className="font-[600] text-[#111827] text-right max-w-[60%]">
                  {formatDeliveryAddress(viewingOrder.deliveryAddress)}
                </span>
              </div>
              <div className="p-3 bg-[#FAFAFA] rounded-[10px] flex justify-between border border-[#F1F1F1]">
                <span className="text-[#6B7280]">Total Amount</span>
                <span className="font-[600] text-[#111827]">₹{viewingOrder.totalAmount || viewingOrder.amount || 0}</span>
              </div>
              <div className="p-3 bg-[#FAFAFA] rounded-[10px] flex justify-between items-center border border-[#F1F1F1]">
                <span className="text-[#6B7280]">Status</span>
                {renderStatusBadge(viewingOrder.status || viewingOrder.orderStatus)}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#F1F1F1]">
              <button
                type="button"
                onClick={() => setViewingOrder(null)}
                className="px-4 py-2.5 bg-[#FAFAFA] border border-[#F1F1F1] text-[#6B7280] hover:text-[#111827] font-[500] text-[14px] rounded-[10px] transition-colors"
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
