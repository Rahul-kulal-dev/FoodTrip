import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, ShieldCheck, LogOut, ArrowLeft, Pencil } from 'lucide-react';
import { authAPI } from '../services/api';

export const CustomerProfilePage = () => {
  const { user, logout, updateUser } = useAuth();
  const { addresses: contextAddresses, addAddress, updateAddress } = useCart();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState(contextAddresses || []);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [formData, setFormData] = useState({
    houseFlat: '',
    streetArea: '',
    city: '',
    state: '',
    pincode: '',
  });

  React.useEffect(() => {
    if (contextAddresses && contextAddresses.length > 0) {
      setAddresses(contextAddresses);
      const primaryAddr = contextAddresses[0];
      setFormData({
        houseFlat: primaryAddr.houseFlat || '',
        streetArea: primaryAddr.streetArea || '',
        city: primaryAddr.city || '',
        state: primaryAddr.state || '',
        pincode: primaryAddr.pincode || '',
      });
    }
    setProfileData({
      name: user?.name || '',
      phone: user?.phone || (contextAddresses && contextAddresses[0]?.phone) || '',
    });
  }, [contextAddresses, user]);

  const handleLogout = () => {
    logout();
  };

  const saveAddress = (constructedData) => {
    if (addresses.length > 0) {
      const addrToUpdate = addresses[0];
      if (updateAddress) updateAddress(addrToUpdate.id || addrToUpdate._id, constructedData);
    } else {
      if (addAddress) addAddress(constructedData);
    }
  };

  const inputClass = `w-full px-3.5 sm:px-4 py-2.5 rounded-[10px] border text-xs sm:text-[14px] font-medium transition-colors ${!isEditingProfile ? 'bg-gray-50 border-gray-200 text-gray-700' : 'bg-white border-gray-200 text-gray-900 focus:outline-none focus:border-[#FF4B2B] focus:ring-1 focus:ring-[#FF4B2B]'}`;

  return (
    <div className="min-h-[80vh] bg-[#F8F9FA] py-4 sm:py-10 px-3 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">

        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 mb-4 sm:mb-6 font-semibold cursor-pointer active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-sm border border-gray-100 mb-4 sm:mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center space-x-3.5 sm:space-x-5 min-w-0">
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-[#FF5200]/10 text-[#FF5200] font-black text-xl sm:text-2xl flex items-center justify-center border-2 border-[#FF5200]/20 shadow-sm shrink-0">
              {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'CU'}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight truncate">{user?.name || 'Customer'}</h1>
              <p className="text-xs sm:text-sm text-gray-500 font-medium truncate">{user?.email || 'customer@example.com'}</p>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold bg-orange-50 text-[#FF5200]">
                  <ShieldCheck className="w-3 sm:w-3.5 h-3 sm:h-3.5 mr-1" />
                  {user?.role || 'Customer'}
                </span>
                <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-emerald-50 text-emerald-600">
                  Active
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 sm:px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm rounded-xl transition-all cursor-pointer border border-red-100 shrink-0 active:scale-98"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between gap-2 mb-5 sm:mb-6">
            <h2 className="text-base sm:text-lg font-extrabold text-gray-900">Account Information</h2>
            {!isEditingProfile ? (
              <button
                onClick={() => setIsEditingProfile(true)}
                className="inline-flex items-center space-x-1.5 px-3 sm:px-4 py-2 border border-[#E5E7EB] hover:bg-[#F3F4F6] text-[#4B5563] rounded-[10px] font-[600] text-xs sm:text-[13px] transition-colors cursor-pointer shrink-0"
              >
                <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="px-3 sm:px-4 py-2 rounded-[10px] border border-[#E5E7EB] font-[600] text-xs sm:text-[13px] text-[#6B7280] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={isSavingProfile}
                  onClick={async () => {
                    setIsSavingProfile(true);
                    try {
                      const hasAddress = formData.houseFlat?.trim() || formData.streetArea?.trim() || formData.city?.trim();
                      const payload = { ...profileData };
                      let constructedData = null;
                      if (hasAddress) {
                        constructedData = {
                          ...formData,
                          fullName: profileData.name || user?.name || 'User',
                          phone: profileData.phone || user?.phone || '',
                          addressType: (formData.addressType || 'HOME').toUpperCase()
                        };
                        payload.addresses = [constructedData];
                      }

                      const res = await authAPI.updateProfile(payload);
                      if (res && (res._id || res.id || res.email)) {
                        updateUser(res);
                        if (constructedData) saveAddress(constructedData);
                        setIsEditingProfile(false);
                      } else {
                        console.error(res?.message || 'Failed to update profile');
                      }
                    } catch (err) {
                      console.error('Update profile error:', err);
                      updateUser(profileData);
                      saveAddress();
                      setIsEditingProfile(false);
                    } finally {
                      setIsSavingProfile(false);
                    }
                  }}
                  className="px-3.5 sm:px-4 py-2 rounded-[10px] bg-[#FF4B2B] hover:bg-[#e03a00] text-white font-[600] text-xs sm:text-[13px] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingProfile ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5 sm:mb-2">
                Full Name
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 sm:left-4 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  disabled={!isEditingProfile}
                  value={isEditingProfile ? profileData.name : (user?.name || '')}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className={`w-full pl-10 sm:pl-11 pr-3 sm:pr-4 py-2.5 sm:py-3 border rounded-xl text-xs sm:text-sm font-medium ${!isEditingProfile ? 'bg-gray-50 border-gray-200 text-gray-700' : 'bg-white border-gray-200 text-gray-900 focus:outline-none focus:border-[#FF4B2B] focus:ring-1 focus:ring-[#FF4B2B]'}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5 sm:mb-2">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 sm:left-4 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full pl-10 sm:pl-11 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-700 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5 sm:mb-2">
                Phone Number
              </label>
              <div className="relative flex items-center">
                <Phone className="absolute left-3.5 sm:left-4 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  maxLength="10"
                  disabled={!isEditingProfile}
                  value={isEditingProfile ? profileData.phone : (user?.phone || (addresses && addresses[0]?.phone) || '')}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })}
                  className={`w-full pl-10 sm:pl-11 pr-3 sm:pr-4 py-2.5 sm:py-3 border rounded-xl text-xs sm:text-sm font-medium ${!isEditingProfile ? 'bg-gray-50 border-gray-200 text-gray-700' : 'bg-white border-gray-200 text-gray-900 focus:outline-none focus:border-[#FF4B2B] focus:ring-1 focus:ring-[#FF4B2B]'}`}
                />
              </div>
            </div>
          </div>

          <hr className="my-6 sm:my-8 border-gray-100" />

          <div>
            <div className="mb-4">
              <h3 className="text-sm sm:text-base font-extrabold text-gray-900 flex items-center gap-1.5 sm:gap-2">
                <MapPin className="w-4 h-4 text-[#FF5200]" />
                <span>Delivery Address</span>
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">Used as default address during checkout</p>
            </div>

            <div className="space-y-3.5 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-[13px] font-[600] text-[#111827] mb-1">House/Flat No.</label>
                <input type="text" disabled={!isEditingProfile} value={formData.houseFlat} onChange={(e) => setFormData({ ...formData, houseFlat: e.target.value })} className={inputClass} placeholder="e.g. Flat 101, A Block" />
              </div>

              <div>
                <label className="block text-xs sm:text-[13px] font-[600] text-[#111827] mb-1">Street/Area</label>
                <input type="text" disabled={!isEditingProfile} value={formData.streetArea} onChange={(e) => setFormData({ ...formData, streetArea: e.target.value })} className={inputClass} placeholder="e.g. 4th Cross, Koramangala" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-[13px] font-[600] text-[#111827] mb-1">City</label>
                  <input type="text" disabled={!isEditingProfile} value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className={inputClass} placeholder="e.g. Bangalore" />
                </div>
                <div>
                  <label className="block text-xs sm:text-[13px] font-[600] text-[#111827] mb-1">State</label>
                  <input type="text" disabled={!isEditingProfile} value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className={inputClass} placeholder="e.g. Karnataka" />
                </div>
                <div>
                  <label className="block text-xs sm:text-[13px] font-[600] text-[#111827] mb-1">Pincode</label>
                  <input type="text" disabled={!isEditingProfile} value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/[^0-9]/g, '') })} className={inputClass} placeholder="e.g. 560034" maxLength="6" />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

