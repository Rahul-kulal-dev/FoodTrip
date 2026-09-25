import React, { useState, useEffect } from 'react';
import {
  Clock,
  Check,
  X,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Building2,
  FileCheck,
  FileText,
  ExternalLink,
  MessageSquareWarning,
  Search,
} from 'lucide-react';
import { adminAPI } from '../../services/api';

export const AdminPendingVerificationPage = () => {
  const [allRestaurants, setAllRestaurants] = useState([]);

  const pendingRestaurants = allRestaurants.filter((r) => String(r.status || '').toUpperCase() === 'PENDING');
  const approvedRestaurants = allRestaurants.filter((r) => {
    const s = String(r.status || '').toUpperCase();
    return s === 'APPROVED' || s === 'ACTIVE';
  });
  const rejectedRestaurants = allRestaurants.filter((r) => {
    const s = String(r.status || '').toUpperCase();
    return s === 'REJECTED' || s === 'INACTIVE' || s === 'SUSPENDED';
  });

  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [activeSubTab, setActiveSubTab] = useState('Pending');
  const [selectedDetailsItem, setSelectedDetailsItem] = useState(null);

  const [rejectModal, setRejectModal] = useState({ open: false, type: '', id: '', name: '' });
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await adminAPI.getRestaurants();
      const list = Array.isArray(res) ? res : res.data || [];

      const sortByRecent = (a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return dateB - dateA;
      };

      setAllRestaurants(list.sort(sortByRecent));

    } catch (err) {
      console.error('Failed to load restaurants:', err);
      setToastMessage(err.message || 'Failed to load restaurant requests.');
      setToastType('error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openRejectModal = (type, id, name) => {
    setRejectModal({ open: true, type, id, name });
    setRejectionReason('');
  };

  const confirmRejection = async () => {
    const { type, id } = rejectModal;
    const reason = rejectionReason.trim();
    if (!reason) return;

    setRejectModal({ open: false, type: '', id: '', name: '' });

    if (type === 'Restaurant') {
      await handleRestaurantAction(id, 'REJECT', reason);
    }
  };

  const handleRestaurantAction = async (id, action, reason = '') => {
    try {
      setUpdatingId(`rest-${id}`);
      if (action === 'APPROVE' || action === 'ACTIVE') {
        await adminAPI.approveRestaurantVerification(id);
        setToastMessage('Restaurant verification APPROVED successfully! Status updated to APPROVED.');
      } else {
        await adminAPI.rejectRestaurantVerification(id, reason);
        setToastMessage('Restaurant verification REJECTED! Status updated to REJECTED.');
      }

      setAllRestaurants((prev) => prev.map((r) => {
        if (String(r.id || r._id || r.restaurantId) === String(id)) {
          return { ...r, status: action === 'APPROVE' || action === 'ACTIVE' ? 'Active' : 'Rejected' };
        }
        return r;
      }));
      setToastType('success');
    } catch (err) {
      setToastMessage(err.message || 'Failed to update restaurant verification status');
      setToastType('error');
    } finally {
      setUpdatingId(null);
    }
  };

  const renderVerificationRow = (item) => {
    const targetId = item.id || item._id || item.restaurantId;
    const isUpdating = updatingId === `rest-${targetId}`;
    const businessName = item.restaurantName || item.name;
    const contactName = item.owner || item.ownerName || item.ownerUser?.name || 'Restaurant Owner';
    const email = item.email || item.ownerUser?.email;
    const phone = item.phone || item.ownerUser?.phone;
    const licenseNo = item.fssaiLicenseNo || item.licenseNo;

    return (
      <div
        key={`Restaurant-${targetId}`}
        className="group flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4 p-3.5 sm:p-5 rounded-[16px] border border-gray-200 hover:border-[#FF4B2B]/30 hover:shadow-[0_8px_30px_rgba(255,75,43,0.08)] transition-all bg-white"
      >
        <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shrink-0 border-2 border-gray-200 shadow-sm sm:shadow-md bg-white overflow-hidden group-hover:border-gray-300 group-hover:shadow-lg transition-all">
            <img
              src={item.logoImage || item.logo || item.coverImage || item.image || "/assets/icons/restaurant-icon.png?v=2"}
              alt="Restaurant"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="min-w-0 space-y-1 sm:space-y-1.5">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h3 className="font-[700] text-gray-900 text-[15px] sm:text-[18px] md:text-[20px] truncate tracking-tight">{businessName}</h3>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-[12px] sm:text-[13px] text-gray-500 font-[500]">
              <span className="flex items-center gap-1.5 bg-gray-100/80 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-gray-700">
                <Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                {contactName}
              </span>
              {email && <span className="flex items-center gap-1.5 break-all sm:break-normal"><span className="text-gray-300 hidden sm:inline">•</span> {email}</span>}
              {phone && <span className="flex items-center gap-1.5"><span className="text-gray-300 hidden sm:inline">•</span> {phone}</span>}

              {licenseNo && (
                <span className="flex items-center gap-1 sm:gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
                  <span className="text-gray-800 font-mono bg-gray-50 px-1.5 sm:px-2 py-0.5 rounded border border-gray-200 text-[11px] sm:text-[12px]">{licenseNo}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={`w-full md:w-auto mt-1 md:mt-0 pt-3 md:pt-0 border-t md:border-0 border-gray-100 ${
          activeSubTab === 'Pending' ? 'grid grid-cols-3 gap-2 md:flex md:items-center md:gap-3' : 'flex items-center gap-2 md:gap-3'
        }`}>
          {isUpdating ? (
            <span className="col-span-3 inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 text-[12px] sm:text-[13px] font-[600] text-gray-600 bg-gray-50 border border-gray-200 rounded-[10px] w-full md:w-auto justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-[#FF4B2B]" />
              Processing...
            </span>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setSelectedDetailsItem({ type: 'Restaurant', ...item })}
                className="px-2 sm:px-4 py-2 sm:py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-[600] shadow-sm rounded-[10px] text-[11.5px] sm:text-[13px] flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Details</span>
              </button>

              {activeSubTab === 'Pending' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleRestaurantAction(targetId, 'APPROVE')}
                    className="px-2 sm:px-4 py-2 sm:py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-[600] shadow-sm shadow-emerald-500/20 rounded-[10px] text-[11.5px] sm:text-[13px] flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Approve</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openRejectModal('Restaurant', targetId, businessName)}
                    className="px-2 sm:px-4 py-2 sm:py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-[600] shadow-sm shadow-rose-500/20 rounded-[10px] text-[11.5px] sm:text-[13px] flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Reject</span>
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 font-poppins text-[#111827]">
      {toastMessage && (
        <div
          className={`p-3.5 sm:p-4 rounded-[10px] text-[12.5px] sm:text-[13px] font-[500] flex items-center justify-between transition-all ${toastType === 'error' ? 'bg-[#FEE2E2] border border-[#DC2626]/20 text-[#DC2626]' : 'bg-[#DCFCE7] border border-[#22C55E]/20 text-[#15803D]'
            }`}
        >
          <div className="flex items-center gap-2">
            {toastType === 'error' ? <XCircle className="w-4 h-4 text-[#DC2626] shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" />}
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage('')} className="text-[#6B7280] hover:text-[#111827] cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-[20px] sm:text-[28px] font-[700] text-[#111827] tracking-tight">
            Restaurant Verification
          </h1>
          <p className="text-[12.5px] sm:text-[14px] font-[500] text-[#6B7280] mt-1">
            Review submitted verification details, compliance documents, and approve/reject partner applications.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 sm:px-4 py-1.5 sm:py-2 rounded-[10px] text-amber-700 text-[12px] sm:text-[13px] font-[500] shrink-0 self-start sm:self-auto">
          <img
            src="/pending-icon.png"
            alt="Pending"
            className="w-4 h-4 sm:w-5 sm:h-5 object-contain animate-spin"
            style={{ animationDuration: '7s' }}
          />
          <span>{pendingRestaurants.length} Pending Restaurants</span>
        </div>
      </div>

      <div className="bg-[#FAFAFA] rounded-[14px] border border-[#F1F1F1] p-1 sm:p-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.06)] grid grid-cols-3 sm:flex sm:items-center gap-1 sm:gap-1.5">
        {[
          { key: 'Pending', label: 'Pending', icon: Clock, img: null, count: pendingRestaurants.length },
          { key: 'Approved', label: 'Approved', icon: CheckCircle2, img: null, count: approvedRestaurants.length },
          { key: 'Rejected', label: 'Rejected', icon: XCircle, img: null, count: rejectedRestaurants.length },
        ].map((tab) => {
          const isActive = activeSubTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveSubTab(tab.key)}
              className={`flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2 sm:px-5 py-2 sm:py-2.5 rounded-[10px] text-[12px] sm:text-[14px] font-[500] transition-all cursor-pointer whitespace-nowrap ${isActive
                ? 'bg-[#FFFFFF] text-[#FF4B2B] shadow-sm border border-[#F1F1F1]'
                : 'text-[#6B7280] hover:bg-[#FFFFFF] hover:text-[#111827]'
                }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] font-extrabold ${isActive
                ? 'bg-[#FFF1ED] text-[#FF4B2B]'
                : 'bg-amber-100/80 text-amber-700'
                }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, email, phone, or license..."
          className="w-full pl-10 sm:pl-11 pr-4 py-2 sm:py-2.5 bg-[#FFFFFF] rounded-[10px] border border-[#F1F1F1] text-[13px] sm:text-[14px] text-[#111827] placeholder:text-[#6B7280] focus:outline-none focus:ring-1 focus:ring-[#FF4B2B] focus:border-[#FF4B2B] transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#111827] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="bg-[#FFFFFF] rounded-[14px] border border-[#F1F1F1] p-3.5 sm:p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)] space-y-4 sm:space-y-5">

        <div className="overflow-x-auto">

          {activeSubTab === 'Pending' && (() => {
            const sortByRecent = (a, b) => {
              const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
              const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
              return dateB - dateA;
            };

            const allItems = [
              ...pendingRestaurants.map((r) => ({ ...r, _itemType: 'Restaurant' })),
            ].sort(sortByRecent);

            const filteredItems = searchQuery ? allItems.filter((item) => {
              const q = searchQuery.toLowerCase().trim();
              const name = (item.restaurantName || item.name || '').toLowerCase();
              const email = (item.email || item.ownerUser?.email || '').toLowerCase();
              const phone = (item.phone || item.ownerUser?.phone || '').toLowerCase();
              const license = (item.fssaiLicenseNo || item.licenseNo || item.drivingLicense?.number || '').toLowerCase();
              const owner = (item.owner || item.ownerName || item.ownerUser?.name || '').toLowerCase();
              return name.includes(q) || email.includes(q) || phone.includes(q) || license.includes(q) || owner.includes(q);
            }) : allItems;

            return (
              <div className="space-y-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-16 text-[#6B7280] gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-[#FF4B2B]" />
                    <span className="text-[14px] font-[500]">Loading pending verifications...</span>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-2">
                    <CheckCircle2 className="w-8 h-8 text-[#D1D5DB]" />
                    <span className="text-[#111827] font-[600] text-[14px]">All caught up!</span>
                    <span className="text-[13px] text-[#6B7280] font-[500]">{searchQuery ? 'No results matching your search.' : 'No pending verification applications.'}</span>
                  </div>
                ) : (
                  filteredItems.map((item) => {
                    const isRest = item._itemType === 'Restaurant';
                    return renderVerificationRow(item, isRest);
                  })
                )}
              </div>
            );
          })()}

          {activeSubTab === 'Approved' && (() => {
            const allItems = [
              ...approvedRestaurants.map((r) => ({ ...r, _itemType: 'Restaurant' })),
            ];

            const filteredItems = searchQuery ? allItems.filter((item) => {
              const q = searchQuery.toLowerCase().trim();
              const name = (item.restaurantName || item.name || '').toLowerCase();
              const email = (item.email || item.ownerUser?.email || '').toLowerCase();
              const phone = (item.phone || item.ownerUser?.phone || '').toLowerCase();
              const license = (item.fssaiLicenseNo || item.licenseNo || item.drivingLicense?.number || '').toLowerCase();
              const owner = (item.owner || item.ownerName || item.ownerUser?.name || '').toLowerCase();
              return name.includes(q) || email.includes(q) || phone.includes(q) || license.includes(q) || owner.includes(q);
            }) : allItems;

            return (
              <div className="space-y-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-16 text-[#6B7280] gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-[#FF4B2B]" />
                    <span className="text-[14px] font-[500]">Loading approved verifications...</span>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-2">
                    <CheckCircle2 className="w-8 h-8 text-[#D1D5DB]" />
                    <span className="text-[#111827] font-[600] text-[14px]">{searchQuery ? 'All caught up!' : 'No approved restaurants'}</span>
                    <span className="text-[13px] text-[#6B7280] font-[500]">{searchQuery ? 'No results matching your search.' : 'There are currently no approved restaurant applications to display.'}</span>
                  </div>
                ) : (
                  filteredItems.map((item) => renderVerificationRow(item))
                )}
              </div>
            );
          })()}

          {activeSubTab === 'Rejected' && (() => {
            const allItems = [
              ...rejectedRestaurants.map((r) => ({ ...r, _itemType: 'Restaurant' })),
            ];

            const filteredItems = searchQuery ? allItems.filter((item) => {
              const q = searchQuery.toLowerCase().trim();
              const name = (item.restaurantName || item.name || '').toLowerCase();
              const email = (item.email || item.ownerUser?.email || '').toLowerCase();
              const phone = (item.phone || item.ownerUser?.phone || '').toLowerCase();
              const license = (item.fssaiLicenseNo || item.licenseNo || item.drivingLicense?.number || '').toLowerCase();
              const owner = (item.owner || item.ownerName || item.ownerUser?.name || '').toLowerCase();
              return name.includes(q) || email.includes(q) || phone.includes(q) || license.includes(q) || owner.includes(q);
            }) : allItems;

            return (
              <div className="space-y-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-16 text-[#6B7280] gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-[#FF4B2B]" />
                    <span className="text-[14px] font-[500]">Loading rejected verifications...</span>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-2">
                    <XCircle className="w-8 h-8 text-[#D1D5DB]" />
                    <span className="text-[#111827] font-[600] text-[14px]">{searchQuery ? 'All caught up!' : 'No rejected restaurants'}</span>
                    <span className="text-[13px] text-[#6B7280] font-[500]">{searchQuery ? 'No results matching your search.' : 'There are currently no rejected restaurant applications to display.'}</span>
                  </div>
                ) : (
                  filteredItems.map((item) => renderVerificationRow(item))
                )}
              </div>
            );
          })()}

        </div>
      </div>

      {selectedDetailsItem && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#FFFFFF] rounded-[14px] max-w-xl w-full p-4 sm:p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-[#F1F1F1] relative space-y-4 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#F1F1F1] pb-3 shrink-0">
              <div>
                <h3 className="text-[17px] sm:text-[20px] font-[600] text-[#111827]">
                  Restaurant Verification Details
                </h3>
                <span className="text-[11.5px] sm:text-[12px] text-[#6B7280] font-mono">ID: {selectedDetailsItem.id || selectedDetailsItem._id}</span>
              </div>
              <button
                onClick={() => setSelectedDetailsItem(null)}
                className="text-[#6B7280] hover:text-[#111827] p-1.5 rounded-[10px] hover:bg-[#FAFAFA] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 text-[12.5px] sm:text-[13px] pr-0.5">
              <div className="p-3.5 sm:p-4 bg-[#FAFAFA] border border-[#F1F1F1] rounded-[14px] space-y-3">
                <div className="font-[600] text-[#FF4B2B] text-[11.5px] sm:text-[12px] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#F1F1F1] pb-2">
                  <Building2 className="w-4 h-4 text-[#FF4B2B]" />
                  Restaurant Verification Details
                </div>

                <div className="space-y-2.5 sm:space-y-3 pt-1">
                  <div className="p-2.5 sm:p-3 bg-[#FFFFFF] rounded-[10px] border border-[#F1F1F1]">
                    <span className="text-[#6B7280] font-[500] text-[10.5px] sm:text-[11px] uppercase tracking-wider block mb-0.5">
                      Restaurant Name
                    </span>
                    <p className="text-[#111827] font-[600] text-[13.5px] sm:text-[14px]">
                      {selectedDetailsItem.restaurantName || selectedDetailsItem.name || 'N/A'}
                    </p>
                  </div>

                  <div className="p-2.5 sm:p-3 bg-[#FFFFFF] rounded-[10px] border border-[#F1F1F1]">
                    <span className="text-[#6B7280] font-[500] text-[10.5px] sm:text-[11px] uppercase tracking-wider block mb-0.5">
                      Owner / Contact Person
                    </span>
                    <p className="text-[#111827] font-[600] text-[13.5px] sm:text-[14px]">
                      {selectedDetailsItem.owner || selectedDetailsItem.ownerName || selectedDetailsItem.ownerUser?.name || 'N/A'}
                    </p>
                  </div>

                  <div className="p-2.5 sm:p-3 bg-[#FFFFFF] rounded-[10px] border border-[#F1F1F1]">
                    <span className="text-[#6B7280] font-[500] text-[10.5px] sm:text-[11px] uppercase tracking-wider block mb-0.5">
                      Email Address
                    </span>
                    <p className="text-[#111827] font-[600] text-[13.5px] sm:text-[14px]">
                      {selectedDetailsItem.email || selectedDetailsItem.ownerUser?.email || 'N/A'}
                    </p>
                  </div>

                  <div className="p-2.5 sm:p-3 bg-[#FFFFFF] rounded-[10px] border border-[#F1F1F1]">
                    <span className="text-[#6B7280] font-[500] text-[10.5px] sm:text-[11px] uppercase tracking-wider block mb-0.5">
                      Phone Number
                    </span>
                    <p className="text-[#111827] font-[600] text-[13.5px] sm:text-[14px]">
                      {selectedDetailsItem.phone || selectedDetailsItem.ownerUser?.phone || 'N/A'}
                    </p>
                  </div>

                  <div className="p-2.5 sm:p-3 bg-[#FFFFFF] rounded-[10px] border border-[#F1F1F1]">
                    <span className="text-[#6B7280] font-[500] text-[10.5px] sm:text-[11px] uppercase tracking-wider block mb-0.5">
                      Address
                    </span>
                    <p className="text-[#111827] font-[500] text-[13px] sm:text-[14px] leading-relaxed">
                      {selectedDetailsItem.restaurantAddress || selectedDetailsItem.address || selectedDetailsItem.location || 'N/A'}
                    </p>
                  </div>

                  <div className="p-2.5 sm:p-3 bg-[#FFFFFF] rounded-[10px] border border-[#F1F1F1]">
                    <span className="text-[#6B7280] font-[500] text-[10.5px] sm:text-[11px] uppercase tracking-wider block mb-0.5">
                      FSSAI License Number
                    </span>
                    <p className="text-[#111827] font-mono font-[600] text-[13.5px] sm:text-[14px]">
                      {selectedDetailsItem.fssaiLicenseNo || selectedDetailsItem.licenseNo || 'N/A'}
                    </p>
                  </div>

                  <div className="p-3 sm:p-3.5 bg-[#FFFFFF] rounded-[10px] border border-[#F1F1F1] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                    <div className="space-y-0.5 overflow-hidden">
                      <span className="text-[#6B7280] font-[500] text-[10.5px] sm:text-[11px] uppercase tracking-wider block">
                        FSSAI Certificate Document
                      </span>
                      <div className="flex items-center gap-2 pt-0.5">
                        <FileText className="w-4 h-4 text-[#FF4B2B] shrink-0" />
                        <span className="text-[#111827] font-[600] text-[12.5px] sm:text-[13px] truncate max-w-[200px] sm:max-w-[220px]">
                          {selectedDetailsItem.fssaiDocUrl || 'fssai_certificate.pdf'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const doc = selectedDetailsItem.fssaiDocUrl || 'fssai_certificate.pdf';
                          if (doc.startsWith('http') || doc.startsWith('data:')) {
                            window.open(doc, '_blank');
                          } else {
                            const element = document.createElement('a');
                            const file = new Blob([`FSSAI Certificate Document\nRestaurant: ${selectedDetailsItem.restaurantName || selectedDetailsItem.name}\nLicense No: ${selectedDetailsItem.fssaiLicenseNo || selectedDetailsItem.licenseNo}\nFile Name: ${doc}`], { type: 'text/plain' });
                            element.href = URL.createObjectURL(file);
                            element.download = doc.endsWith('.pdf') || doc.endsWith('.png') || doc.endsWith('.jpg') ? doc : `${doc}.txt`;
                            document.body.appendChild(element);
                            element.click();
                            document.body.removeChild(element);
                          }
                        }}
                        className="w-full sm:w-auto justify-center px-3 py-1.5 bg-[#FFF1ED] hover:bg-[#FFE4DB] text-[#FF4B2B] font-[500] rounded-[10px] text-[12px] flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[#FF4B2B]" />
                        <span>View Certificate</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#F1F1F1] shrink-0">
              <button
                type="button"
                onClick={() => setSelectedDetailsItem(null)}
                className="px-3 sm:px-4 py-2 bg-[#FAFAFA] border border-[#F1F1F1] text-[#6B7280] hover:text-[#111827] font-[500] text-[12px] sm:text-[13px] rounded-[10px] transition-colors cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const targetId = selectedDetailsItem.id || selectedDetailsItem._id || selectedDetailsItem.restaurantId;
                    setSelectedDetailsItem(null);
                    openRejectModal('Restaurant', targetId, selectedDetailsItem.restaurantName || selectedDetailsItem.name);
                  }}
                  className="px-3 sm:px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-[#FFFFFF] font-[500] text-[12px] sm:text-[13px] rounded-[10px] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Reject</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const targetId = selectedDetailsItem.id || selectedDetailsItem._id || selectedDetailsItem.restaurantId;
                    handleRestaurantAction(targetId, 'APPROVE');
                    setSelectedDetailsItem(null);
                  }}
                  className="px-3 sm:px-4 py-2 bg-[#22C55E] hover:bg-[#16A34A] text-[#FFFFFF] font-[500] text-[12px] sm:text-[13px] rounded-[10px] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Approve</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {rejectModal.open && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm z-[60] flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#FFFFFF] rounded-[14px] max-w-md w-full p-4 sm:p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-[#F1F1F1] relative space-y-4 sm:space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-[14px] bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0">
                <MessageSquareWarning className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-[17px] sm:text-[20px] font-[600] text-[#111827]">
                  Reject Verification
                </h3>
                <p className="text-[12px] sm:text-[13px] text-[#6B7280] font-[500] mt-0.5">
                  Provide a reason for rejecting <strong className="text-[#111827]">{rejectModal.name || 'this application'}</strong>.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-[11px] sm:text-[12px] font-[500] text-[#6B7280] uppercase tracking-wider mb-2">
                Rejection Reason / Message
              </label>
              <textarea
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. FSSAI certificate is expired, please upload a valid one..."
                className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-[10px] border border-[#F1F1F1] focus:outline-none focus:ring-1 focus:ring-[#DC2626] focus:border-[#DC2626] text-[13px] sm:text-[14px] font-[500] text-[#111827] placeholder:text-[#6B7280] transition-all resize-none"
                autoFocus
              />
              {!rejectionReason.trim() && (
                <p className="text-[11.5px] sm:text-[12px] text-[#DC2626] font-[500] mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  A rejection reason is required before confirming.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F1F1F1]">
              <button
                type="button"
                onClick={() => setRejectModal({ open: false, type: '', id: '', name: '' })}
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-[#FAFAFA] border border-[#F1F1F1] text-[#6B7280] hover:text-[#111827] font-[500] text-[12px] sm:text-[13px] rounded-[10px] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRejection}
                disabled={!rejectionReason.trim()}
                className="px-4 sm:px-5 py-2 sm:py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-[#FFFFFF] font-[500] text-[12px] sm:text-[13px] rounded-[10px] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
