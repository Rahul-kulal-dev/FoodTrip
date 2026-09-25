import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import { dishAPI, uploadAPI } from '../../services/api';
import { PanelLoading } from '../../components/common/PanelLoading';

const getCategoryStyle = (category) => {
  const cat = (category || '').toLowerCase();
  if (cat === 'biryani' || cat === 'popular') return 'bg-[#FFF1ED] text-[#FF4B2B] border-[#FF4B2B]/20';
  if (cat === 'starters') return 'bg-emerald-50 text-emerald-600 border-emerald-100';
  if (cat === 'main course') return 'bg-blue-50 text-blue-600 border-blue-100';
  if (cat === 'breads') return 'bg-purple-50 text-purple-600 border-purple-100';
  if (cat === 'sides') return 'bg-emerald-50 text-emerald-600 border-emerald-100';
  if (cat === 'desserts') return 'bg-pink-50 text-pink-600 border-pink-100';
  return 'bg-[#FAFAFA] text-[#6B7280] border-[#F1F1F1]';
};

export const RestaurantMenuPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState('All Status');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Popular',
    price: '',
    isAvailable: true,
    isVeg: true,
    image: '',
  });

  const fetchDishes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dishAPI.getMyDishes();
      const dishes = Array.isArray(data) ? data : [];
      setItems(
        dishes.map((d) => ({
          id: d._id || d.id,
          name: d.name || '',
          description: d.description || '',
          category: d.category || 'popular',
          price: d.price || 0,
          available: d.isAvailable !== false,
          isVeg: d.isVeg !== false,
          image: d.image || '',
          rating: d.rating || 4.5,
          restaurantId: d.restaurantId || '',
        }))
      );
    } catch (err) {
      console.error('Failed to fetch menu items:', err);
      setError(err.message || 'Failed to load menu items');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDishes();
  }, [fetchDishes]);

  const availableCategories = useMemo(() => {
    const cats = new Set(items.map((item) => item.category));
    return Array.from(cats).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(query);
        const matchDesc = item.description.toLowerCase().includes(query);
        if (!matchName && !matchDesc) return false;
      }

      if (selectedCategory !== 'All Categories' && item.category !== selectedCategory) {
        return false;
      }

      if (selectedStatus === 'Available' && !item.available) return false;
      if (selectedStatus === 'Unavailable' && item.available) return false;

      return true;
    });
  }, [items, searchQuery, selectedCategory, selectedStatus]);

  const handleToggleAvailability = async (id) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const newAvailable = !item.available;

    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, available: newAvailable } : i))
    );

    try {
      const payload = {
        name: item.name,
        description: item.description,
        category: item.category,
        price: Number(item.price),
        isAvailable: newAvailable,
        isVeg: item.isVeg,
        image: item.image,
      };
      await dishAPI.update(id, payload);
    } catch (err) {
      console.error('Failed to toggle availability:', err);
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, available: !newAvailable } : i))
      );
    }
  };

  const handleDeleteItem = (id) => {
    setItemToDelete(id);
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    const id = itemToDelete;
    setItemToDelete(null);

    const deletedItem = items.find((i) => i.id === id);
    setItems((prev) => prev.filter((item) => item.id !== id));

    try {
      await dishAPI.delete(id);
    } catch (err) {
      console.error('Failed to delete dish:', err);
      if (deletedItem) {
        setItems((prev) => [deletedItem, ...prev]);
      }
    }
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormError(null);
    setFormData({
      name: '',
      description: '',
      category: 'Popular',
      price: '',
      isAvailable: true,
      isVeg: true,
      image: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormError(null);
    setFormData({
      name: item.name,
      description: item.description,
      category: item.category,
      price: item.price.toString(),
      isAvailable: item.available,
      isVeg: item.isVeg,
      image: item.image,
    });
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) return;

    setSaving(true);

    try {
      let finalImageUrl = '';
      if (formData.image instanceof File) {
        const uploadRes = await uploadAPI.uploadFile(formData.image, 'food');
        finalImageUrl = uploadRes.url;
      } else {
        finalImageUrl = typeof formData.image === 'string' ? formData.image.trim() : '';
      }

      const defaultImage =
        finalImageUrl ||
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80';

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        price: Number(formData.price),
        isAvailable: formData.isAvailable,
        isVeg: formData.isVeg,
        image: defaultImage,
      };
      if (editingItem) {
        const updated = await dishAPI.update(editingItem.id, payload);
        setItems((prev) =>
          prev.map((item) =>
            item.id === editingItem.id
              ? {
                ...item,
                name: updated.name || payload.name,
                description: updated.description || payload.description,
                category: updated.category || payload.category,
                price: updated.price ?? payload.price,
                available: updated.isAvailable !== false,
                isVeg: updated.isVeg !== false,
                image: updated.image || defaultImage,
              }
              : item
          )
        );
      } else {
        const created = await dishAPI.create(payload);
        const newItem = {
          id: created._id || created.id,
          name: created.name || payload.name,
          description: created.description || payload.description,
          category: created.category || payload.category,
          price: created.price ?? payload.price,
          available: created.isAvailable !== false,
          isVeg: created.isVeg !== false,
          image: created.image || defaultImage,
          rating: created.rating || 4.5,
          restaurantId: created.restaurantId || '',
        };
        setItems((prev) => [newItem, ...prev]);
      }

      setIsModalOpen(false);
      setFormError(null);
    } catch (err) {
      console.error('Failed to save dish:', err);
      setFormError(err.message || 'Failed to save menu item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && items.length === 0) {
    return <PanelLoading message="Loading menu items..." />;
  }

  if (error && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
          <i className="fa-solid fa-circle-exclamation text-xl text-red-400"></i>
        </div>
        <p className="text-sm font-semibold text-gray-600">{error}</p>
        <button
          type="button"
          onClick={fetchDishes}
          className="px-5 py-2.5 bg-[#FF5200] hover:bg-[#E04800] text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-poppins text-[#111827]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[24px] sm:text-[28px] font-[700] text-[#111827] tracking-tight">
            Menu Items
          </h2>
          <p className="text-[13px] sm:text-[14px] font-[400] text-[#6B7280] mt-1">
            Manage your restaurant menu items
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center px-5 py-3 bg-[#FF4B2B] hover:bg-[#e03a00] text-white font-[500] text-[14px] rounded-[10px] transition-all shadow-sm cursor-pointer shrink-0"
        >
          <i className="fa-solid fa-plus mr-2 text-xs"></i>
          Add Menu Item
        </button>
      </div>

      <div className="bg-[#FFFFFF] rounded-[14px] border border-[#F1F1F1] shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-3.5 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
          <div className="relative w-full lg:flex-1 lg:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <i className="fa-solid fa-magnifying-glass text-sm"></i>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by item name..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#FFFFFF] border border-[#F1F1F1] rounded-[10px] text-[14px] text-[#111827] placeholder-[#6B7280] focus:outline-none focus:border-[#FF4B2B] focus:ring-1 focus:ring-[#FF4B2B] transition-all"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full appearance-none bg-[#FFFFFF] border border-[#F1F1F1] rounded-[10px] px-3.5 py-2.5 pr-8 text-[13px] sm:text-[14px] font-[500] text-[#111827] focus:outline-none focus:border-[#FF4B2B] focus:ring-1 focus:ring-[#FF4B2B] transition-all cursor-pointer truncate"
              >
                <option value="All Categories">All Categories</option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#6B7280]">
                <i className="fa-solid fa-chevron-down text-xs"></i>
              </div>
            </div>

            <div className="relative w-full sm:w-40">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full appearance-none bg-[#FFFFFF] border border-[#F1F1F1] rounded-[10px] px-3.5 py-2.5 pr-8 text-[13px] sm:text-[14px] font-[500] text-[#111827] focus:outline-none focus:border-[#FF4B2B] focus:ring-1 focus:ring-[#FF4B2B] transition-all cursor-pointer truncate"
              >
                <option value="All Status">All Status</option>
                <option value="Available">Available</option>
                <option value="Unavailable">Unavailable</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#6B7280]">
                <i className="fa-solid fa-chevron-down text-xs"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="md:hidden space-y-3">
          {filteredItems.length === 0 ? (
            <div className="py-10 text-center text-[#6B7280] font-[500] text-[13px] bg-gray-50/60 rounded-[12px] border border-dashed border-gray-200">
              {items.length === 0
                ? 'No menu items yet. Tap "Add Menu Item" above to get started.'
                : 'No menu items found matching your criteria.'}
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-[12px] border border-[#F1F1F1] bg-white shadow-xs hover:border-gray-200 transition-all flex flex-col gap-3"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'}
                    alt={item.name || 'Dish Image'}
                    className="w-16 h-16 rounded-[10px] object-cover border border-[#F1F1F1] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`w-3.5 h-3.5 rounded-xs border-2 flex items-center justify-center shrink-0 ${
                            item.isVeg ? 'border-green-600' : 'border-red-600'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.isVeg ? 'bg-green-600' : 'bg-red-600'
                            }`}
                          />
                        </span>
                        <h4 className="font-[600] text-[#111827] text-[14px] truncate">{item.name}</h4>
                      </div>
                      <span className="font-[700] text-[#FF4B2B] text-[14px] shrink-0">₹{item.price}</span>
                    </div>

                    {item.description && (
                      <p className="text-[12px] text-[#6B7280] line-clamp-1 mt-0.5">{item.description}</p>
                    )}

                    <div className="mt-1.5 flex items-center gap-2">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-[4px] text-[11px] font-[500] border ${getCategoryStyle(
                          item.category
                        )}`}
                      >
                        {item.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-[#F1F1F1] gap-2">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleToggleAvailability(item.id)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        item.available ? 'bg-[#FF4B2B]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                          item.available ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className={`text-[12px] font-[500] ${item.available ? 'text-[#111827]' : 'text-[#6B7280]'}`}>
                      {item.available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(item)}
                      className="inline-flex items-center px-2.5 py-1.5 border border-[#FF4B2B] text-[#FF4B2B] hover:bg-[#FFF1ED] rounded-[8px] text-[11px] font-[500] transition-colors cursor-pointer"
                    >
                      <i className="fa-solid fa-pen mr-1 text-[9px]"></i>
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="inline-flex items-center px-2.5 py-1.5 border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-[8px] text-[11px] font-[500] transition-colors cursor-pointer"
                    >
                      <i className="fa-solid fa-trash mr-1 text-[9px]"></i>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#F1F1F1] text-[12px] font-[500] text-[#6B7280] uppercase tracking-wider bg-[#FAFAFA]">
                <th className="py-3 px-4 w-24 rounded-tl-[10px]">Image</th>
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Availability</th>
                <th className="py-3 px-4 text-center rounded-tr-[10px]">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#F1F1F1]">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#6B7280] font-[500]">
                    {items.length === 0
                      ? 'No menu items yet. Click "Add Menu Item" to get started.'
                      : 'No menu items found matching your criteria.'}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="py-4 px-4">
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'}
                        alt={item.name || 'Dish Image'}
                        className="w-12 h-12 rounded-[10px] object-cover border border-[#F1F1F1]"
                      />
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <p className="font-[500] text-[#111827] text-[14px]">{item.name}</p>
                        <span
                          className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center shrink-0 ${item.isVeg ? 'border-green-600' : 'border-red-600'
                            }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'
                              }`}
                          />
                        </span>
                      </div>
                      <p className="text-[12px] text-[#6B7280] mt-0.5">{item.description}</p>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-[4px] text-[12px] font-[500] border ${getCategoryStyle(
                          item.category
                        )}`}
                      >
                        {item.category}
                      </span>
                    </td>

                    <td className="py-4 px-4 font-[500] text-[#111827] text-[14px]">
                      ₹{item.price}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => handleToggleAvailability(item.id)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${item.available ? 'bg-[#FF4B2B]' : 'bg-gray-300'
                            }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${item.available ? 'translate-x-5' : 'translate-x-0'
                              }`}
                          />
                        </button>
                        <span
                          className={`text-[12px] font-[500] ${item.available ? 'text-[#111827]' : 'text-[#6B7280]'
                            }`}
                        >
                          {item.available ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="inline-flex items-center px-3 py-1.5 border border-[#FF4B2B] text-[#FF4B2B] hover:bg-[#FFF1ED] rounded-[10px] text-[12px] font-[500] transition-colors cursor-pointer"
                        >
                          <i className="fa-solid fa-pen mr-1.5 text-[10px]"></i>
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-rose-300 text-rose-500 hover:bg-rose-50 rounded-[10px] text-[12px] font-[500] transition-colors cursor-pointer"
                        >
                          <i className="fa-solid fa-trash mr-1.5 text-[10px]"></i>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100 text-xs text-gray-500 font-medium">
          <span>
            Showing {filteredItems.length} of {items.length} items
          </span>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="fixed inset-0 -z-10" onClick={() => setIsModalOpen(false)} />

          <div className="relative bg-white rounded-2xl sm:rounded-[18px] border border-gray-100 max-w-md w-full shadow-2xl max-h-[92vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
              <h3 className="text-[17px] sm:text-[19px] font-[700] text-[#111827]">
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            <form onSubmit={handleSaveItem} id="menu-item-form" className="flex-1 overflow-y-auto px-4 sm:px-6 py-3.5 sm:py-4 space-y-3.5 sm:space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium flex items-center gap-2">
                  <i className="fa-solid fa-circle-exclamation shrink-0"></i>
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[#4B5563] font-[600] text-[12px]">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chicken Biryani"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-[10px] border border-gray-200 bg-white text-[#111827] text-[14px] font-[500] placeholder:text-gray-400 focus:outline-none focus:border-[#FF4B2B] focus:ring-1 focus:ring-[#FF4B2B]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[#4B5563] font-[600] text-[12px]">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief dish description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-[10px] border border-gray-200 bg-white text-[#111827] text-[13px] font-[500] placeholder:text-gray-400 focus:outline-none focus:border-[#FF4B2B] focus:ring-1 focus:ring-[#FF4B2B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[#4B5563] font-[600] text-[12px]">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-[10px] border border-gray-200 bg-white text-[#111827] text-[13px] font-[500] focus:outline-none focus:border-[#FF4B2B] focus:ring-1 focus:ring-[#FF4B2B] cursor-pointer"
                  >
                    <option value="Popular">Popular</option>
                    <option value="Starters">Starters</option>
                    <option value="Main Course">Main Course</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Beverages">Beverages</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[#4B5563] font-[600] text-[12px]">Price (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="220"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-[10px] border border-gray-200 bg-white text-[#111827] text-[14px] font-[500] placeholder:text-gray-400 focus:outline-none focus:border-[#FF4B2B] focus:ring-1 focus:ring-[#FF4B2B]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[#4B5563] font-[600] text-[12px]">
                  Image Upload <span className="text-red-500">*</span>
                </label>
                <label className="flex items-center gap-3 p-2.5 rounded-[10px] border border-dashed border-gray-300 hover:border-[#FF4B2B] bg-gray-50/80 hover:bg-orange-50/30 cursor-pointer transition-colors group">
                  <input
                    type="file"
                    accept="image/*"
                    required={!editingItem && !formData.image}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setFormData({ ...formData, image: file });
                      }
                    }}
                    className="hidden"
                  />
                  {formData.image instanceof File ? (
                    <div className="flex items-center gap-2.5 w-full min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <i className="fa-solid fa-image text-sm"></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-[600] text-gray-800 truncate">{formData.image.name}</p>
                        <p className="text-[11px] text-emerald-600 font-[500]">Ready to upload</p>
                      </div>
                      <span className="text-[12px] text-[#FF4B2B] font-[600] shrink-0 group-hover:underline">Change</span>
                    </div>
                  ) : formData.image && typeof formData.image === 'string' ? (
                    <div className="flex items-center gap-2.5 w-full min-w-0">
                      <img src={formData.image} alt="Dish" className="w-9 h-9 rounded-lg object-cover shrink-0 border border-gray-200" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-[600] text-gray-800 truncate">Current photo</p>
                        <p className="text-[11px] text-gray-500 font-[500]">Tap to change</p>
                      </div>
                      <span className="text-[12px] text-[#FF4B2B] font-[600] shrink-0 group-hover:underline">Change</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 w-full py-1 text-gray-500 group-hover:text-[#FF4B2B]">
                      <i className="fa-solid fa-cloud-arrow-up text-sm"></i>
                      <span className="text-[12px] font-[500]">Tap to select dish photo</span>
                    </div>
                  )}
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <label
                  htmlFor="avail-check"
                  className={`flex items-center gap-2 p-2.5 rounded-[10px] border cursor-pointer transition-colors ${
                    formData.isAvailable ? 'bg-orange-50/40 border-[#FF4B2B]/40' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    id="avail-check"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="w-4 h-4 text-[#FF4B2B] rounded focus:ring-[#FF4B2B] cursor-pointer"
                  />
                  <span className="text-[12px] font-[600] text-gray-800 select-none">Available</span>
                </label>

                <label
                  htmlFor="veg-check"
                  className={`flex items-center gap-2 p-2.5 rounded-[10px] border cursor-pointer transition-colors ${
                    formData.isVeg ? 'bg-emerald-50/40 border-emerald-300' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    id="veg-check"
                    checked={formData.isVeg}
                    onChange={(e) => setFormData({ ...formData, isVeg: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-[12px] font-[600] text-gray-800 select-none">Vegetarian</span>
                </label>
              </div>
            </form>

            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100 bg-gray-50/70 shrink-0 grid grid-cols-2 gap-2.5 sm:flex sm:justify-end sm:space-x-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-[10px] border border-gray-200 bg-white text-gray-600 font-[600] text-[13px] hover:bg-gray-50 transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="menu-item-form"
                disabled={saving}
                className="w-full sm:w-auto px-5 py-2.5 rounded-[10px] bg-[#FF4B2B] hover:bg-[#e03a00] text-white font-[600] text-[13px] shadow-xs transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-center"
              >
                {saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {itemToDelete && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-[14px] max-w-sm w-full p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-[#F1F1F1] relative space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-2">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-[18px] font-[600] text-[#111827]">Delete Item</h3>
              <p className="text-[14px] text-[#6B7280]">
                Are you sure you want to delete this menu item? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-[#F1F1F1]">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="flex-1 px-4 py-2.5 text-[14px] font-[500] text-[#6B7280] hover:text-[#111827] bg-[#FAFAFA] border border-[#F1F1F1] rounded-[10px] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteItem}
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
