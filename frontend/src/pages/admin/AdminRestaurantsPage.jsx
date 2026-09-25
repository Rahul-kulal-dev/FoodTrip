import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Store,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Check,
  Ban,
  RotateCcw,
  Loader2,
  Eye,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';

export const AdminRestaurantsPage = () => {
  const {
    deleteRestaurant,
    addRestaurant,
  } = useAuth();

  const [restaurantsList, setRestaurantsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingRestaurant, setViewingRestaurant] = useState(null);
  const [restaurantToDelete, setRestaurantToDelete] = useState(null);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    owner: '',
    cuisine: 'Biryani',
    location: '',
    status: 'ACTIVE',
    email: '',
    phone: '',
  });

  const loadAdminRestaurants = async () => {
    try {
      setIsLoading(true);
      const res = await adminAPI.getRestaurants();
      const items = Array.isArray(res) ? res : res.data || [];
      setRestaurantsList(items);
    } catch (err) {
      console.error('Failed to load admin restaurants:', err);
      setToastMessage(err.message || 'Failed to load restaurants from database.');
      setToastType('error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminRestaurants();
  }, []);

  const normalizeStatus = (statusStr) => {
    if (!statusStr) return 'PENDING';
    const s = String(statusStr).toUpperCase();
    if (s === 'ACTIVE') return 'ACTIVE';
    if (s === 'PENDING') return 'PENDING';
    if (s === 'REJECTED') return 'REJECTED';
    if (s === 'SUSPENDED' || s === 'INACTIVE') return 'SUSPENDED';
    return s;
  };

  const counts = {
    All: restaurantsList.length,
    Pending: restaurantsList.filter((r) => normalizeStatus(r.status) === 'PENDING').length,
    Active: restaurantsList.filter((r) => normalizeStatus(r.status) === 'ACTIVE').length,
    Rejected: restaurantsList.filter((r) => normalizeStatus(r.status) === 'REJECTED').length,
    Suspended: restaurantsList.filter((r) => normalizeStatus(r.status) === 'SUSPENDED').length,
  };

  const filteredRestaurants = restaurantsList.filter((r) => {
    const matchesSearch =
      (r.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.owner || r.ownerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.cuisine || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.location || r.city || r.address || '').toLowerCase().includes(searchQuery.toLowerCase());

    const normalizeCuisine = (c) => (c || '').toString().toUpperCase().replace(/[\s_-]+/g, '');
    const matchesCuisine =
      selectedCuisine === 'All' ||
      normalizeCuisine(r.cuisine) === normalizeCuisine(selectedCuisine) ||
      normalizeCuisine(r.cuisine).includes(normalizeCuisine(selectedCuisine)) ||
      normalizeCuisine(selectedCuisine).includes(normalizeCuisine(r.cuisine));

    const norm = normalizeStatus(r.status);
    let matchesTab = true;
    if (activeTab === 'Pending') matchesTab = norm === 'PENDING';
    else if (activeTab === 'Active') matchesTab = norm === 'ACTIVE';
    else if (activeTab === 'Rejected') matchesTab = norm === 'REJECTED';
    else if (activeTab === 'Suspended') matchesTab = norm === 'SUSPENDED';

    return matchesSearch && matchesCuisine && matchesTab;
  });

  const handleStatusChange = async (id, targetStatus) => {
    try {
      setUpdatingId(id);
      setToastMessage('');
      const response = await adminAPI.updateRestaurantStatus(id, targetStatus);
      const updatedData = response?.data || response;

      setRestaurantsList((prev) =>
        prev.map((r) => {
          const targetIdStr = String(id);
          const rIdStr = String(r.id || r._id || r.restaurantId);
          if (rIdStr === targetIdStr) {
            return {
              ...r,
              ...updatedData,
              status: targetStatus,
            };
          }
          return r;
        })
      );

      setToastMessage(`Restaurant status updated to ${targetStatus} successfully!`);
      setToastType('success');
    } catch (err) {
      console.error('Failed to update restaurant status:', err);
      setToastMessage(err.message || 'Failed to update restaurant status in database');
      setToastType('error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleApprove = (id) => handleStatusChange(id, 'ACTIVE');
  const handleReject = (id) => handleStatusChange(id, 'REJECTED');
  const handleSuspend = (id) => handleStatusChange(id, 'SUSPENDED');

  const handleDelete = (id) => {
    setRestaurantToDelete(id);
  };

  const confirmDelete = async () => {
    if (!restaurantToDelete) return;
    const id = restaurantToDelete;
    setRestaurantToDelete(null);

    try {
      if (adminAPI.deleteRestaurant) {
        await adminAPI.deleteRestaurant(id);
      } else {
        await deleteRestaurant(id);
      }
      setRestaurantsList((prev) => prev.filter((r) => String(r.id || r._id || r.restaurantId) !== String(id)));
      setToastMessage('Restaurant record deleted successfully');
      setToastType('success');
    } catch (err) {
      setToastMessage('Failed to delete restaurant: ' + err.message);
      setToastType('error');
    }
  };

  const handleOpenAddModal = () => {
    setEditingRestaurant(null);
    setFormData({
      name: '',
      owner: '',
      cuisine: 'Biryani',
      location: '',
      status: 'Active',
      email: '',
      phone: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (restaurant) => {
    setEditingRestaurant(restaurant);
    setFormData({
      name: restaurant.name,
      owner: restaurant.owner,
      cuisine: restaurant.cuisine,
      location: restaurant.location,
      status: restaurant.status,
      email: restaurant.email || '',
      phone: restaurant.phone || '',
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.owner || !formData.location) return;

    if (editingRestaurant) {
      updateRestaurantStatus(editingRestaurant.id, formData.status);
    } else {
      addRestaurant({
        name: formData.name,
        owner: formData.owner,
        cuisine: formData.cuisine,
        location: formData.location,
        status: formData.status,
        email: formData.email,
        phone: formData.phone,
      });
    }

    setIsModalOpen(false);
  };

  const renderStatusBadge = (status) => {
    const norm = normalizeStatus(status);
    switch (norm) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100/90 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Active
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100/90 text-amber-800 border border-amber-200 animate-pulse">
            <Clock className="w-3 h-3 text-amber-600" />
            Pending Review
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100/90 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            Rejected
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <Ban className="w-3 h-3 text-slate-500" />
            Suspended
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const tabs = [
    { id: 'All', label: 'All Restaurants', count: counts.All, badgeColor: 'bg-slate-100 text-slate-700' },
    { id: 'Pending', label: 'Pending Approval', count: counts.Pending, badgeColor: 'bg-amber-100 text-amber-800' },
    { id: 'Active', label: 'Active', count: counts.Active, badgeColor: 'bg-emerald-100 text-emerald-800' },
    { id: 'Rejected', label: 'Rejected', count: counts.Rejected, badgeColor: 'bg-rose-100 text-rose-800' },
    { id: 'Suspended', label: 'Suspended', count: counts.Suspended, badgeColor: 'bg-slate-200 text-slate-800' },
  ];

  return (
    <div className="space-y-6 font-poppins text-[#111827]">
      {toastMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs transition-all ${
            toastType === 'error' ? 'bg-rose-50 border border-rose-200 text-rose-800' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastType === 'error' ? <XCircle className="w-4 h-4 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage('')} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-[700] text-[#111827] tracking-tight">
            Restaurant Partner Management
          </h1>
          <p className="text-[14px] font-[500] text-[#6B7280] mt-1">
            Review partner registrations, approve pending applications, and manage operating statuses.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 bg-[#FF4B2B] hover:bg-[#E04518] text-white font-[500] px-4 py-2.5 rounded-[10px] text-[14px] transition-all shadow-sm cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Restaurant</span>
        </button>
      </div>

      <div className="bg-[#FFFFFF] rounded-[14px] border border-[#F1F1F1] p-2 shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex flex-wrap items-center gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[14px] font-[500] transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#111827] text-white shadow-sm'
                  : 'text-[#6B7280] hover:bg-[#FAFAFA] hover:text-[#111827]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  isActive ? 'bg-white/20 text-white' : tab.badgeColor
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="bg-[#FFFFFF] rounded-[14px] border border-[#F1F1F1] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)] space-y-5">

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80 lg:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, owner, or cuisine..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#FFFFFF] border border-[#F1F1F1] rounded-[10px] text-[14px] text-[#111827] placeholder:text-[#6B7280] focus:outline-none focus:ring-1 focus:ring-[#FF4B2B] focus:border-[#FF4B2B] transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={selectedCuisine}
              onChange={(e) => setSelectedCuisine(e.target.value)}
              className="px-4 py-2.5 bg-[#FFFFFF] border border-[#F1F1F1] rounded-[10px] text-[14px] font-[500] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#FF4B2B] focus:border-[#FF4B2B] transition-all cursor-pointer flex-1 sm:flex-none"
            >
              <option value="All">All Cuisines</option>
              <option value="Biryani">Biryani</option>
              <option value="Italian">Italian</option>
              <option value="Fast Food">Fast Food</option>
              <option value="South Indian">South Indian</option>
              <option value="Healthy Food">Healthy Food</option>
              <option value="Chinese">Chinese</option>
              <option value="Cafe">Cafe</option>
              <option value="North Indian">North Indian</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#F1F1F1] text-[12px] font-[500] text-[#6B7280]">
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">Logo</th>
                <th className="py-3 px-3">Restaurant Name</th>
                <th className="py-3 px-3">Owner</th>
                <th className="py-3 px-3">Cuisine</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Registered On</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F1F1] text-[14px] text-[#111827]">
              {isLoading ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-slate-400 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-[#FF5424]" />
                      <span>Loading real restaurant data from database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRestaurants.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-slate-400 font-medium">
                    No restaurants found in "{activeTab}" view.
                  </td>
                </tr>
              ) : (
                filteredRestaurants.map((rest) => {
                  const targetId = rest.id || rest._id || rest.restaurantId;
                  const norm = normalizeStatus(rest.status);
                  const isUpdating = String(updatingId) === String(targetId);

                  return (
                    <tr key={targetId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-3 font-semibold text-slate-900">{rest.code || '#1'}</td>
                      <td className="py-3.5 px-3">
                        <div
                          className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-extrabold text-xs uppercase shadow-xs border border-slate-800/40"
                        >
                          {rest.name ? rest.name.slice(0, 2) : 'RS'}
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">{rest.name}</div>
                        {(rest.fssaiLicenseNo || rest.licenseNo) && (
                          <span className="text-[10px] text-slate-400 font-normal">{rest.fssaiLicenseNo || rest.licenseNo}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-700">
                        <div>{rest.owner || rest.ownerName || rest.ownerUser?.name || 'Restaurant Owner'}</div>
                        {(rest.email || rest.ownerUser?.email) && (
                          <div className="text-[10px] text-slate-400 font-normal">{rest.email || rest.ownerUser?.email}</div>
                        )}
                        {(rest.phone || rest.ownerUser?.phone) && (
                          <div className="text-[10px] text-slate-400 font-normal">{rest.phone || rest.ownerUser?.phone}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600">{rest.cuisine}</td>
                      <td className="py-3.5 px-3 text-slate-600">{rest.location}</td>
                      <td className="py-3.5 px-3">
                        {renderStatusBadge(rest.status)}
                      </td>
                      <td className="py-3.5 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                        {rest.createdDate ? new Date(rest.createdDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {isUpdating ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500">
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF5424]" />
                              Updating...
                            </span>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => setViewingRestaurant(rest)}
                                className="px-2.5 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                                title="View Full Details"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                <span>Details</span>
                              </button>

                              {norm === 'PENDING' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleApprove(targetId)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                                    title="Approve & Activate Restaurant Application"
                                  >
                                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                    <span>Approve & Activate</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleReject(targetId)}
                                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                                    title="Reject Application"
                                  >
                                    <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                    <span>Reject</span>
                                  </button>
                                </>
                              )}

                              {norm === 'ACTIVE' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditModal(rest)}
                                    className="px-2.5 py-1.5 border border-orange-200 text-[#FF5424] hover:bg-orange-50 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSuspend(targetId)}
                                    className="px-2.5 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                                    title="Suspend Operating Account"
                                  >
                                    <Ban className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Suspend</span>
                                  </button>
                                </>
                              )}

                              {(norm === 'REJECTED' || norm === 'SUSPENDED') && (
                                <button
                                  type="button"
                                  onClick={() => handleApprove(targetId)}
                                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                                  title="Re-activate or Approve"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Activate</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDelete(targetId)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete Restaurant Record"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 text-xs text-slate-500 font-medium">
          <div>
            Showing {filteredRestaurants.length} of {restaurantsList.length} restaurants
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="w-8 h-8 rounded-lg border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40"
              disabled
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="w-8 h-8 rounded-lg bg-[#FF5424] text-white font-bold flex items-center justify-center shadow-xs"
            >
              1
            </button>
            <button
              type="button"
              className="w-8 h-8 rounded-lg border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40"
              disabled
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-[14px] max-w-lg w-full p-6 sm:p-7 shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-[#F1F1F1] relative space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-[#F1F1F1] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-[#FFF1ED] text-[#FF4B2B] flex items-center justify-center">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[20px] font-[600] text-[#111827]">
                    {editingRestaurant ? 'Edit Restaurant Status & Info' : 'Add New Restaurant'}
                  </h3>
                  <p className="text-[14px] font-[500] text-[#6B7280]">Enter restaurant information below</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
                <div>
                  <label className="block text-[12px] font-[500] text-[#6B7280] mb-1.5">Restaurant Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#FFFFFF] border border-[#F1F1F1] rounded-[10px] text-[14px] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#FF4B2B] focus:border-[#FF4B2B] transition-all"
                    placeholder="Restaurant Name"
                    disabled={!!editingRestaurant}
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-[500] text-[#6B7280] mb-1.5">Owner Name</label>
                  <input
                    type="text"
                    name="owner"
                    value={formData.owner}
                    onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#FFFFFF] border border-[#F1F1F1] rounded-[10px] text-[14px] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#FF4B2B] focus:border-[#FF4B2B] transition-all"
                    placeholder="Owner Full Name"
                    disabled={!!editingRestaurant}
                  />
                </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-[500] text-[#6B7280] mb-1.5">Contact Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#FFFFFF] border border-[#F1F1F1] rounded-[10px] text-[14px] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#FF4B2B] focus:border-[#FF4B2B] transition-all"
                    placeholder="Email Address"
                    disabled={!!editingRestaurant}
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-[500] text-[#6B7280] mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    maxLength="10"
                    value={formData.phone}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (e.target.name === 'phone') {
                        val = val.replace(/[^0-9]/g, '').slice(0, 10);
                      }
                      setFormData({ ...formData, [e.target.name]: val });
                    }}
                    className="w-full px-4 py-2.5 bg-[#FFFFFF] border border-[#F1F1F1] rounded-[10px] text-[14px] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#FF4B2B] focus:border-[#FF4B2B] transition-all"
                    placeholder="Phone Number"
                    disabled={!!editingRestaurant}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-[500] text-[#6B7280] mb-1.5">Location Area</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#FFFFFF] border border-[#F1F1F1] rounded-[10px] text-[14px] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#FF4B2B] focus:border-[#FF4B2B] transition-all"
                  placeholder="e.g. Indiranagar, Bengaluru"
                  disabled={!!editingRestaurant}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F1F1F1]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-[14px] font-[500] text-[#6B7280] hover:text-[#111827] bg-[#FAFAFA] border border-[#F1F1F1] rounded-[10px] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 text-[14px] font-[500] bg-[#FF4B2B] text-white rounded-[10px] hover:bg-[#E04518] shadow-sm transition-all"
                >
                  {editingRestaurant ? 'Update Status' : 'Add Restaurant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingRestaurant && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative space-y-5 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-orange-100 text-[#FF5424] flex items-center justify-center font-bold text-base">
                  {viewingRestaurant.name ? viewingRestaurant.name.slice(0, 2).toUpperCase() : 'RS'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{viewingRestaurant.name}</h3>
                  <p className="text-xs text-slate-500">{viewingRestaurant.cuisine || 'Multi-Cuisine'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingRestaurant(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 font-semibold block">Owner Name</span>
                <span className="font-bold text-slate-800 text-sm">{viewingRestaurant.owner || viewingRestaurant.ownerName || 'N/A'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 font-semibold block">Current Status</span>
                <div>{renderStatusBadge(viewingRestaurant.status)}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 font-semibold block">Contact Email</span>
                <span className="font-bold text-slate-800">{viewingRestaurant.email || 'N/A'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 font-semibold block">Phone Number</span>
                <span className="font-bold text-slate-800">{viewingRestaurant.phone || 'N/A'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1 col-span-2">
                <span className="text-slate-400 font-semibold block">Address / Location</span>
                <span className="font-bold text-slate-800">{viewingRestaurant.location || viewingRestaurant.address || 'Bengaluru'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 font-semibold block">Operating Hours</span>
                <span className="font-bold text-slate-800">{viewingRestaurant.openingTime || '10:00 AM'} - {viewingRestaurant.closingTime || '11:00 PM'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 font-semibold block">FSSAI License No.</span>
                <span className="font-bold text-slate-800">{viewingRestaurant.fssaiLicenseNo || viewingRestaurant.licenseNo || 'FSSAI-100200300'}</span>
              </div>
            </div>

            {viewingRestaurant.description && (
              <div className="p-3.5 bg-orange-50/60 border border-orange-100 rounded-xl text-xs space-y-1">
                <span className="text-amber-800 font-bold block">Description</span>
                <p className="text-slate-600">{viewingRestaurant.description}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewingRestaurant(null)}
                className="px-5 py-2.5 bg-slate-900 text-white font-semibold rounded-xl text-xs hover:bg-slate-800 transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {restaurantToDelete && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-[14px] max-w-sm w-full p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-[#F1F1F1] relative space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-2">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-[18px] font-[600] text-[#111827]">Delete Restaurant</h3>
              <p className="text-[14px] text-[#6B7280]">
                Are you sure you want to delete this restaurant record? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-[#F1F1F1]">
              <button
                type="button"
                onClick={() => setRestaurantToDelete(null)}
                className="flex-1 px-4 py-2.5 text-[14px] font-[500] text-[#6B7280] hover:text-[#111827] bg-[#FAFAFA] border border-[#F1F1F1] rounded-[10px] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 text-[14px] font-[500] bg-red-600 text-white rounded-[10px] hover:bg-red-700 shadow-sm transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
