import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, ShieldCheck, LogOut, Camera, Save, Edit2, X } from 'lucide-react';
import { authAPI, uploadAPI } from '../../services/api';

export const AdminProfilePage = () => {
  const { user, login, logout, token, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    profilePhoto: user?.profilePhoto || '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const updatedUser = await authAPI.updateProfile(formData);
      if (typeof updateUser === 'function') {
        updateUser(updatedUser);
      } else if (typeof login === 'function') {
        login(updatedUser, updatedUser.role || 'ADMIN', token);
      }
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      setIsEditing(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      setMessage({ text: err.message || 'Failed to update profile', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const uploadRes = await uploadAPI.uploadFile(file, 'profiles');
        setFormData({ ...formData, profilePhoto: uploadRes.url });
      } catch (err) {
        setMessage({ text: 'Failed to upload photo: ' + err.message, type: 'error' });
      }
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="space-y-6 font-poppins text-[#111827]">
      <div>
        <h1 className="text-[24px] md:text-[28px] font-[700] text-[#111827] tracking-tight">
          Admin Profile
        </h1>
        <p className="text-[14px] font-[400] text-[#6B7280] mt-1">
          Manage your administrator account details
        </p>
      </div>

      <div className="bg-[#FFFFFF] rounded-[14px] border border-[#F1F1F1] shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-6 md:p-8 space-y-8 w-full">

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-[#F1F1F1]">
          <div className="flex items-center space-x-5">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-[#FF4B2B]/10 text-[#FF4B2B] font-bold text-3xl flex items-center justify-center border-2 border-[#FF4B2B]/20 overflow-hidden shadow-sm">
                {formData.profilePhoto ? (
                  <img src={formData.profilePhoto} alt="Admin Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'AD'}</span>
                )}
              </div>
              <label className="absolute inset-0 bg-black/50 text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-semibold">Change</span>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">{user?.name || 'Administrator'}</h2>
              <div className="flex items-center space-x-2 mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFF1ED] text-[#FF4B2B]">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  {user?.role || 'Admin'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-sm rounded-[10px] transition-all cursor-pointer border border-rose-100 shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>

        {message.text && (
          <div className={`p-4 rounded-[10px] text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-4 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  disabled={!isEditing}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-[#FF4B2B] focus:ring-1 focus:ring-[#FF4B2B] disabled:bg-gray-100/50 disabled:text-gray-500 disabled:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-4 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  disabled={!isEditing}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-[#FF4B2B] focus:ring-1 focus:ring-[#FF4B2B] disabled:bg-gray-100/50 disabled:text-gray-500 disabled:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 gap-3">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-semibold text-sm rounded-[10px] transition-all cursor-pointer shadow-sm"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex items-center space-x-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-semibold text-sm rounded-[10px] transition-all cursor-pointer shadow-sm"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center space-x-2 px-6 py-3 bg-[#FF4B2B] hover:bg-[#e03a00] text-white font-semibold text-sm rounded-[10px] transition-all cursor-pointer shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </form>

      </div>
    </div>
  );
};
