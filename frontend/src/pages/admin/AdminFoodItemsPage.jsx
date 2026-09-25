import React, { useState, useEffect } from 'react';
import {
  Search,
  Trash2,
  X,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  Power,
  Tag,
} from 'lucide-react';
import { adminAPI } from '../../services/api';

export const AdminFoodItemsPage = () => {
  const [foodItemsList, setFoodItemsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewingItem, setViewingItem] = useState(null);
  const [dishToDelete, setDishToDelete] = useState(null);

  const loadAdminFoodItems = async () => {
    try {
      setIsLoading(true);
      const res = await adminAPI.getDishes();
      const items = Array.isArray(res) ? res : res.data || [];
      setFoodItemsList(items);
    } catch (err) {
      console.error('Failed to load admin food items:', err);
      setToastMessage(err.message || 'Failed to load food items from database.');
      setToastType('error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminFoodItems();
  }, []);

  const handleToggleStatus = async (id, currentAvailability) => {
    try {
      setUpdatingId(id);
      setToastMessage('');
      const targetAvail = !currentAvailability;
      const updated = await adminAPI.updateDishStatus(id, targetAvail);

      setFoodItemsList((prev) =>
        prev.map((item) => {
          const itemIdStr = String(item.id || item._id);
          if (itemIdStr === String(id)) {
            return {
              ...item,
              ...updated,
              isAvailable: targetAvail,
            };
          }
          return item;
        })
      );

      setToastMessage(`Food item status updated to ${targetAvail ? 'Available / Active' : 'Unavailable / Deactivated'}!`);
      setToastType('success');
    } catch (err) {
      console.error('Failed to update food item status:', err);
      setToastMessage(err.message || 'Failed to update food item availability in database');
      setToastType('error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteDish = (id) => {
    setDishToDelete(id);
  };

  const confirmDeleteDish = async () => {
    if (!dishToDelete) return;
    const id = dishToDelete;
    setDishToDelete(null);

    try {
      await adminAPI.deleteDish(id);
      setFoodItemsList((prev) => prev.filter((item) => String(item.id || item._id) !== String(id)));
      setToastMessage('Food item deleted successfully');
      setToastType('success');
    } catch (err) {
      setToastMessage('Failed to delete food item: ' + err.message);
      setToastType('error');
    }
  };

  const filteredItems = foodItemsList.filter((item) => {
    const matchesSearch =
      (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.restaurantName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' ||
      (item.category || '').toLowerCase() === selectedCategory.toLowerCase();

    const isAvail = item.isAvailable !== false;
    let matchesTab = true;
    if (activeTab === 'Active') matchesTab = isAvail === true;
    else if (activeTab === 'Inactive') matchesTab = isAvail === false;

    return matchesSearch && matchesCategory && matchesTab;
  });

  return (
    <div className="space-y-6">
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
            Food Items Management
          </h1>
          <p className="text-[14px] font-[500] text-[#6B7280] mt-1">
            View all food menu items across partner restaurants, toggle availability, and inspect details.
          </p>
        </div>
      </div>

      <div className="bg-[#FFFFFF] rounded-[14px] border border-[#F1F1F1] p-2 shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('All')}
          className={`px-4 py-2.5 rounded-[10px] text-[14px] font-[500] transition-all cursor-pointer ${
            activeTab === 'All' ? 'bg-[#111827] text-white shadow-sm' : 'text-[#6B7280] hover:bg-[#FAFAFA]'
          }`}
        >
          All Items ({foodItemsList.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('Active')}
          className={`px-4 py-2.5 rounded-[10px] text-[14px] font-[500] transition-all cursor-pointer ${
            activeTab === 'Active' ? 'bg-[#111827] text-white shadow-sm' : 'text-[#6B7280] hover:bg-[#FAFAFA]'
          }`}
        >
          Active / Available ({foodItemsList.filter((i) => i.isAvailable !== false).length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('Inactive')}
          className={`px-4 py-2.5 rounded-[10px] text-[14px] font-[500] transition-all cursor-pointer ${
            activeTab === 'Inactive' ? 'bg-[#111827] text-white shadow-sm' : 'text-[#6B7280] hover:bg-[#FAFAFA]'
          }`}
        >
          Deactivated / Out of Stock ({foodItemsList.filter((i) => i.isAvailable === false).length})
        </button>
      </div>

      <div className="bg-[#FFFFFF] rounded-[14px] border border-[#F1F1F1] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)] space-y-5">

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80 lg:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by food name, restaurant, or category..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#FFFFFF] border border-[#F1F1F1] rounded-[10px] text-[14px] text-[#111827] placeholder:text-[#6B7280] focus:outline-none focus:ring-1 focus:ring-[#FF4B2B] focus:border-[#FF4B2B] transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 bg-[#FFFFFF] border border-[#F1F1F1] rounded-[10px] text-[14px] font-[500] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#FF4B2B] focus:border-[#FF4B2B] transition-all cursor-pointer flex-1 sm:flex-none"
            >
              <option value="All">All Categories</option>
              <option value="Biryani">Biryani</option>
              <option value="Main Course">Main Course</option>
              <option value="Starters">Starters</option>
              <option value="Pizza">Pizza</option>
              <option value="Burgers">Burgers</option>
              <option value="Desserts">Desserts</option>
              <option value="Beverages">Beverages</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#F1F1F1] text-[12px] font-[500] text-[#6B7280]">
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">Item</th>
                <th className="py-3 px-3">Restaurant</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Price</th>
                <th className="py-3 px-3">Diet Type</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F1F1] text-[14px] text-[#111827]">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-400 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-[#FF5424]" />
                      <span>Loading real food item data from database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-400 font-medium">
                    No food items found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const targetId = item.id || item._id;
                  const isUpdating = String(updatingId) === String(targetId);
                  const isAvail = item.isAvailable !== false;

                  return (
                    <tr key={targetId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-3 font-semibold text-slate-900">#{idx + 1}</td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'}
                            alt={item.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200/60 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{item.name}</div>
                            {item.rating && (
                              <span className="text-[10px] text-amber-600 font-bold">★ {item.rating}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-800">
                        {item.restaurantName || 'Royal Biryani'}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                          <Tag className="w-3 h-3 text-slate-400" />
                          {item.category || 'Popular'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-slate-900">
                        ₹{item.price}
                      </td>
                      <td className="py-3.5 px-3">
                        {item.isVeg ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            <span className="w-2.5 h-2.5 rounded-sm border border-emerald-600 bg-emerald-500 inline-block"></span>
                            Veg
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700">
                            <span className="w-2.5 h-2.5 rounded-sm border border-rose-600 bg-rose-500 inline-block"></span>
                            Non-Veg
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        {isAvail ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            Deactivated
                          </span>
                        )}
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
                                onClick={() => setViewingItem(item)}
                                className="px-3 py-1.5 border border-[#F1F1F1] text-[#111827] hover:bg-[#FAFAFA] font-[500] shadow-[0_4px_16px_rgba(0,0,0,0.06)] rounded-[8px] text-[12px] flex items-center gap-1.5 transition-all cursor-pointer"
                                title="View Food Item & Restaurant Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Details</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleStatus(targetId, isAvail)}
                                className={`px-3 py-1.5 border font-[500] shadow-[0_4px_16px_rgba(0,0,0,0.06)] rounded-[8px] text-[12px] flex items-center gap-1.5 transition-all cursor-pointer ${
                                  isAvail
                                    ? 'border-[#F1F1F1] text-[#111827] hover:bg-[#FAFAFA]'
                                    : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                                }`}
                                title={isAvail ? 'Deactivate Food Item' : 'Activate Food Item'}
                              >
                                <Power className="w-3.5 h-3.5" />
                                <span>{isAvail ? 'Deactivate' : 'Activate'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteDish(targetId)}
                                className="px-3 py-1.5 border border-[#F1F1F1] text-rose-600 hover:bg-rose-50 font-[500] shadow-[0_4px_16px_rgba(0,0,0,0.06)] rounded-[8px] text-[12px] flex items-center gap-1.5 transition-all cursor-pointer"
                                title="Delete Food Item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
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
      </div>

      {viewingItem && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-[14px] max-w-lg w-full p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-[#F1F1F1] relative space-y-4">
            <div className="flex items-center justify-between border-b border-[#F1F1F1] pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={viewingItem.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'}
                  alt={viewingItem.name}
                  className="w-12 h-12 rounded-[10px] object-cover border border-[#F1F1F1]"
                />
                <div>
                  <h3 className="text-[20px] font-[600] text-[#111827]">{viewingItem.name}</h3>
                  <p className="text-[14px] font-[500] text-[#6B7280]">{viewingItem.restaurantName || 'Restaurant Partner'}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingItem(null)}
                className="text-[#6B7280] hover:text-[#111827] p-1.5 rounded-[10px] hover:bg-[#FAFAFA]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 font-semibold block">Price</span>
                <span className="font-bold text-slate-900 text-sm">₹{viewingItem.price}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 font-semibold block">Category</span>
                <span className="font-bold text-slate-900">{viewingItem.category || 'Popular'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 font-semibold block">Dietary Preference</span>
                <span className="font-bold text-slate-900">{viewingItem.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-400 font-semibold block">Operating Availability</span>
                <span className={`font-bold ${viewingItem.isAvailable !== false ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {viewingItem.isAvailable !== false ? 'Active / Available' : 'Deactivated / Unavailable'}
                </span>
              </div>
            </div>

            {viewingItem.description && (
              <div className="p-3.5 bg-orange-50/60 border border-orange-100 rounded-xl text-xs space-y-1">
                <span className="text-amber-800 font-bold block">Item Description</span>
                <p className="text-slate-600">{viewingItem.description}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                className="px-5 py-2.5 bg-slate-900 text-white font-semibold text-xs rounded-xl hover:bg-slate-800"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {dishToDelete && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-[14px] max-w-sm w-full p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-[#F1F1F1] relative space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-2">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-[18px] font-[600] text-[#111827]">Delete Food Item</h3>
              <p className="text-[14px] text-[#6B7280]">
                Are you sure you want to permanently delete this food item? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-[#F1F1F1]">
              <button
                type="button"
                onClick={() => setDishToDelete(null)}
                className="flex-1 px-4 py-2.5 text-[14px] font-[500] text-[#6B7280] hover:text-[#111827] bg-[#FAFAFA] border border-[#F1F1F1] rounded-[10px] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteDish}
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
