import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Building2,
  UploadCloud,
  FileText,
  Loader2,
  AlertCircle,
  X,
  Check,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { restaurantAPI, uploadAPI } from '../../services/api';
import { PanelLoading } from '../../components/common/PanelLoading';

export const RestaurantVerificationPage = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [selectedFile, setSelectedFile] = useState(null);

  const [formData, setFormData] = useState({
    restaurantName: '',
    phone: '',
    restaurantAddress: '',
    licenseNo: '',
    fssaiDocUrl: '',
    status: 'Pending',
    rejectionReason: '',
  });

  const [isApplicationSubmitted, setIsApplicationSubmitted] = useState(false);

  const loadVerificationData = async () => {
    try {
      setIsLoading(true);
      const res = await restaurantAPI.getVerification();
      const data = res?.data || res || {};
      if (data) {
        setIsApplicationSubmitted(Boolean(data.fssaiDocUrl));
        setFormData({
          restaurantName: data.restaurantName || data.name || '',
          phone: data.phone || user?.phone || '',
          restaurantAddress: data.restaurantAddress || data.address || data.location || '',
          licenseNo: data.fssaiLicenseNo || data.licenseNo || '',
          fssaiDocUrl: data.fssaiDocUrl || '',
          status: data.status || 'Pending',
          rejectionReason: data.rejectionReason || '',
        });
      }
    } catch (err) {
      console.error('Failed to load verification data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVerificationData();
  }, []);

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === 'phone') {
      value = value.replace(/[^0-9]/g, '').slice(0, 10);
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFormData((prev) => ({
        ...prev,
        fssaiDocUrl: file.name,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setToastMessage('');

      let docUrl = formData.fssaiDocUrl || 'fssai_certificate.pdf';
      if (selectedFile) {
        const uploadRes = await uploadAPI.uploadFile(selectedFile, 'documents');
        docUrl = uploadRes.url;
      }

      const payload = {
        restaurantName: formData.restaurantName,
        phone: formData.phone,
        restaurantAddress: formData.restaurantAddress,
        licenseNo: formData.licenseNo,
        fssaiDocUrl: docUrl,
      };

      const res = await restaurantAPI.submitVerification(payload);
      const updatedData = res?.data || res || {};

      setIsApplicationSubmitted(true);
      setFormData((prev) => ({
        ...prev,
        restaurantName: updatedData.restaurantName || prev.restaurantName,
        phone: updatedData.phone || prev.phone,
        restaurantAddress: updatedData.restaurantAddress || prev.restaurantAddress,
        licenseNo: updatedData.licenseNo || prev.licenseNo,
        fssaiDocUrl: docUrl,
        status: 'Pending',
        rejectionReason: '',
      }));

      setToastType('success');
      setToastMessage('Verification application submitted! Status is set to PENDING waiting for Admin approval.');
    } catch (err) {
      setToastType('error');
      setToastMessage(err.message || 'Failed to submit verification details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusStr = (formData.status || 'PENDING').toUpperCase();
  const isApproved = statusStr === 'APPROVED' || statusStr === 'ACTIVE';
  const isRejected = statusStr === 'REJECTED';
  const isPending = !isApproved && !isRejected && isApplicationSubmitted;

  if (isLoading) {
    return <PanelLoading message="Loading verification details..." />;
  }

  return (
    <div className="space-y-6 font-poppins text-[#111827]">
      {toastMessage && (
        <div
          className={`p-4 rounded-[10px] text-[12px] font-[500] flex items-center justify-between shadow-xs transition-all ${toastType === 'error'
            ? 'bg-rose-50 border border-rose-200 text-rose-800'
            : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            }`}
        >
          <div className="flex items-center gap-2">
            {toastType === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage('')}
            className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div>
        <h2 className="text-[20px] sm:text-[26px] md:text-[28px] font-[700] text-[#111827] tracking-tight">
          Restaurant Verification
        </h2>
      </div>

      {isApproved && (
        <div className="p-4 sm:p-6 rounded-[14px] bg-[#FFFFFF] border border-[#F1F1F1] shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-row items-center gap-3 sm:gap-4">
            <img
              src="/shield-check-icon.png"
              alt="Verification Approved"
              className="w-8 h-8 sm:w-11 sm:h-11 shrink-0 object-contain self-center"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-[600] text-[16px] sm:text-[19px] text-[#111827]">Verification Approved</span>
                <span className="px-2 py-0.5 rounded-[4px] text-[11px] sm:text-[12px] font-[600] uppercase bg-[#DCFCE7] text-[#22C55E]">
                  APPROVED
                </span>
              </div>
              <p className="text-[12px] sm:text-[13px] text-[#6B7280] font-[400] mt-1 leading-relaxed">
                <span className="sm:hidden">Restaurant is verified & active.</span>
                <span className="hidden sm:inline">Your restaurant is fully verified and active. You have full access to your Dashboard, Menu, and Orders.</span>
              </p>
            </div>
          </div>

          {formData.fssaiDocUrl && (
            <div className="w-full lg:w-auto mt-2 lg:mt-0">
              <button
                onClick={() => window.open(formData.fssaiDocUrl, '_blank')}
                className="w-full lg:w-auto px-4 py-2 sm:py-2.5 bg-[#FFFFFF] border border-[#F1F1F1] text-[#111827] hover:bg-[#FAFAFA] font-[500] rounded-[10px] text-[13px] sm:text-[14px] flex items-center justify-center gap-1.5 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.06)] cursor-pointer"
              >
                <FileText className="w-4 h-4 text-[#6B7280]" />
                <span>View FSSAI Certificate</span>
              </button>
            </div>
          )}
        </div>
      )}

      {isPending && (
        <div className="p-4 sm:p-6 rounded-[14px] bg-[#FFFFFF] border border-[#F1F1F1] shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-row items-center gap-3 sm:gap-4">
            <img
              src="/pending-icon.png"
              alt="Verification Pending"
              className="w-8 h-8 sm:w-11 sm:h-11 shrink-0 object-contain animate-spin self-center"
              style={{ animationDuration: '7s' }}
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-[600] text-[16px] sm:text-[19px] text-[#111827]">Verification Pending</span>
                <span className="px-2 py-0.5 rounded-[4px] text-[11px] sm:text-[12px] font-[600] uppercase bg-amber-50 text-amber-600 border border-amber-200">
                  PENDING
                </span>
              </div>
              <p className="text-[13px] sm:text-[14px] text-[#111827] font-[600] mt-1">
                Waiting for Admin Approval
              </p>
              <p className="text-[12px] text-[#6B7280] font-[400] mt-0.5 leading-relaxed">
                <span className="sm:hidden">Application is under review. Editing disabled.</span>
                <span className="hidden sm:inline">Your application details have been submitted and are currently under review by platform administrators. Editing is disabled until review completion.</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="p-4 sm:p-6 rounded-[14px] bg-[#FFFFFF] border border-[#F1F1F1] shadow-[0_4px_16px_rgba(0,0,0,0.06)] space-y-3 sm:space-y-4">
          <div className="flex flex-row items-center gap-3 sm:gap-4">
            <img
              src="/rejected-icon.svg"
              alt="Verification Rejected"
              className="w-8 h-8 sm:w-11 sm:h-11 shrink-0 object-contain self-center"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-[600] text-[16px] sm:text-[19px] text-[#111827]">Verification Rejected</span>
                <span className="px-2 py-0.5 rounded-[4px] text-[11px] sm:text-[12px] font-[600] uppercase bg-[#FEE2E2] text-[#DC2626] border border-red-200">
                  REJECTED
                </span>
              </div>
              <p className="text-[12px] sm:text-[13px] text-[#6B7280] font-[400] mt-1">
                <span className="sm:hidden">Please review feedback below & resubmit.</span>
                <span className="hidden sm:inline">Action Required: Please review the admin feedback below, update your information, and resubmit.</span>
              </p>
            </div>
          </div>

          <div className="p-3 sm:p-4 rounded-[10px] bg-[#FAFAFA] border border-[#F1F1F1] text-[12px] sm:text-[13px] space-y-1">
            <span className="font-[600] text-[#111827] block">
              Admin Rejection Reason:
            </span>
            <p className="text-[#6B7280] font-[400] leading-relaxed">
              {formData.rejectionReason || 'Uploaded documents or restaurant details failed validation. Please update your details and submit clear documents.'}
            </p>
          </div>
        </div>
      )}

      {(isPending || isApproved) && (
        <div className="bg-[#FFFFFF] rounded-[14px] border border-[#F1F1F1] shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
          <div className="border-b border-[#F1F1F1] pb-3 sm:pb-4">
            <h3 className="text-[17px] sm:text-[20px] font-[700] text-[#111827]">
              Restaurant Details
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 text-[13px] sm:text-[14px]">
            <div className="p-3 sm:p-4 rounded-[10px] bg-[#FAFAFA] border border-[#F1F1F1] space-y-1">
              <span className="block text-[#6B7280] font-[500] text-[11px] sm:text-[12px]">
                Restaurant Name
              </span>
              <p className="text-[#111827] font-[600] text-[13px] sm:text-[14px] break-words">
                {formData.restaurantName || 'N/A'}
              </p>
            </div>

            <div className="p-3 sm:p-4 rounded-[10px] bg-[#FAFAFA] border border-[#F1F1F1] space-y-1">
              <span className="block text-[#6B7280] font-[500] text-[11px] sm:text-[12px]">
                Phone Number
              </span>
              <p className="text-[#111827] font-[600] text-[13px] sm:text-[14px] break-words">
                {formData.phone || 'N/A'}
              </p>
            </div>

            <div className="sm:col-span-2 p-3 sm:p-4 rounded-[10px] bg-[#FAFAFA] border border-[#F1F1F1] space-y-1">
              <span className="block text-[#6B7280] font-[500] text-[11px] sm:text-[12px]">
                Restaurant Address
              </span>
              <p className="text-[#111827] font-[600] text-[13px] sm:text-[14px] leading-relaxed break-words">
                {formData.restaurantAddress || 'N/A'}
              </p>
            </div>

            <div className="p-3 sm:p-4 rounded-[10px] bg-[#FAFAFA] border border-[#F1F1F1] space-y-1">
              <span className="block text-[#6B7280] font-[500] text-[11px] sm:text-[12px]">
                FSSAI License Number
              </span>
              <p className="text-[#111827] font-[600] text-[13px] sm:text-[14px] break-words">
                {formData.licenseNo || 'N/A'}
              </p>
            </div>

            <div className="p-3 sm:p-4 rounded-[10px] bg-[#FAFAFA] border border-[#F1F1F1] space-y-1">
              <span className="block text-[#6B7280] font-[500] text-[11px] sm:text-[12px]">
                FSSAI Certificate
              </span>
              <p className="text-[#111827] font-[600] text-[13px] sm:text-[14px] truncate">
                {formData.fssaiDocUrl || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {(isRejected || (!isApplicationSubmitted && !isPending && !isApproved)) && (
        <div className="bg-[#FFFFFF] rounded-[14px] border border-[#F1F1F1] shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-4 sm:p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="border-b border-[#F1F1F1] pb-3">
              <h3 className="text-[17px] sm:text-[20px] font-[600] text-[#111827] flex items-center gap-2">
                {isRejected ? <RotateCcw className="w-5 h-5 text-[#FF4B2B]" /> : <Building2 className="w-5 h-5 text-[#FF4B2B]" />}
                {isRejected ? 'Correct & Resubmit Verification Details' : 'Fill Restaurant Verification Details'}
              </h3>
              <p className="text-[12px] sm:text-[14px] text-[#6B7280] mt-0.5">
                {isRejected
                  ? 'Update any rejected or missing information below and click Resubmit.'
                  : 'Enter your restaurant information and upload your FSSAI certificate to apply for verification.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
              <div>
                <label className="block text-[11px] sm:text-[12px] font-[500] text-[#6B7280] mb-1">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  name="restaurantName"
                  value={formData.restaurantName}
                  onChange={handleChange}
                  placeholder="e.g. Spice Villa Restaurant"
                  required
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-[10px] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF4B2B]/20 focus:border-[#FF4B2B] text-[13px] sm:text-[14px] text-[#111827] font-[500] transition-all bg-gray-50 hover:bg-white focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] sm:text-[12px] font-[500] text-[#6B7280] mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  maxLength="10"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. 9876543210"
                  required
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-[10px] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF4B2B]/20 focus:border-[#FF4B2B] text-[13px] sm:text-[14px] text-[#111827] font-[500] transition-all bg-gray-50 hover:bg-white focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] sm:text-[12px] font-[500] text-[#6B7280] mb-1">
                Address
              </label>
              <textarea
                name="restaurantAddress"
                rows={3}
                value={formData.restaurantAddress}
                onChange={handleChange}
                placeholder="e.g. #123, 100 Feet Road, Indiranagar, Bengaluru - 560038"
                required
                className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-[10px] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF4B2B]/20 focus:border-[#FF4B2B] text-[13px] sm:text-[14px] text-[#111827] font-[500] transition-all bg-gray-50 hover:bg-white focus:bg-white resize-none"
              />
            </div>

            <div>
              <label className="block text-[11px] sm:text-[12px] font-[500] text-[#6B7280] mb-1">
                FSSAI License Number
              </label>
              <input
                type="text"
                name="licenseNo"
                value={formData.licenseNo}
                onChange={handleChange}
                placeholder="e.g. 14-digit FSSAI Registration / License Number"
                required
                className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-[10px] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF4B2B]/20 focus:border-[#FF4B2B] text-[13px] sm:text-[14px] text-[#111827] font-[500] transition-all bg-gray-50 hover:bg-white focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] sm:text-[12px] font-[500] text-[#6B7280] mb-1">
                FSSAI Certificate Upload
              </label>

              <div className="relative border-2 border-dashed border-gray-300 hover:border-[#FF4B2B] rounded-[14px] sm:rounded-[16px] p-5 sm:p-8 text-center transition-all bg-gray-50 hover:bg-white group cursor-pointer shadow-xs hover:shadow-sm">
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  required={!formData.fssaiDocUrl && !selectedFile}
                />

                {selectedFile || formData.fssaiDocUrl ? (
                  <div className="flex flex-col items-center justify-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-[#DCFCE7] text-[#22C55E] flex items-center justify-center shadow-xs">
                      <Check className="w-5 h-5 sm:w-7 sm:h-7" />
                    </div>
                    <div>
                      <p className="text-[13px] sm:text-[15px] font-[600] text-[#111827] break-all">
                        {selectedFile ? selectedFile.name : formData.fssaiDocUrl}
                      </p>
                      <p className="text-[12px] sm:text-[13px] text-[#22C55E] font-[500] mt-0.5">
                        Certificate file attached successfully
                      </p>
                    </div>
                    <span className="text-[11px] sm:text-[13px] text-[#FF4B2B] font-[600] group-hover:underline mt-1 bg-[#FFF1ED] px-3.5 py-1 rounded-full">
                      Click to replace file
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-white text-gray-400 group-hover:bg-[#FFF1ED] group-hover:text-[#FF4B2B] flex items-center justify-center transition-all shadow-xs border border-gray-100">
                      <UploadCloud className="w-5 h-5 sm:w-7 sm:h-7" />
                    </div>
                    <div>
                      <p className="text-[13px] sm:text-[15px] font-[600] text-[#111827]">
                        Click to upload FSSAI Certificate
                      </p>
                      <p className="text-[11px] sm:text-[13px] text-gray-500 mt-1 font-[400]">
                        Supports PDF, PNG, JPG (Max 10MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 sm:pt-4 border-t border-[#F1F1F1]">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-[#FF4B2B] hover:bg-[#e03a00] text-white font-[500] rounded-[10px] text-[13px] sm:text-[14px] flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : isRejected ? (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Update & Resubmit for Verification</span>
                  </>
                ) : (
                  <span>Submit for Verification</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

