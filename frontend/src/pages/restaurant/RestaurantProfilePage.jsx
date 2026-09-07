import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { restaurantAPI, uploadAPI } from '../../services/api';
import { PanelLoading } from '../../components/common/PanelLoading';

const format12Hour = (time24) => {
  if (!time24) return 'Not Set';
  const [hour, minute] = time24.split(':');
  if (!hour || !minute) return time24;
  let h = parseInt(hour, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h.toString().padStart(2, '0')}:${minute} ${ampm}`;
};

const CustomSelect = ({ value, onChange, options, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <div 
        className="px-2 py-2.5 rounded-[10px] border border-[#F1F1F1] text-[#111827] bg-white cursor-pointer flex justify-between items-center shadow-xs"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-center w-full">{value}</span>
        <i className="fa-solid fa-chevron-down text-[10px] text-gray-500 absolute right-3"></i>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-[#F1F1F1] rounded-[10px] shadow-lg z-[100]">
          {options.map((opt) => (
            <div 
              key={opt.value} 
              className={`px-3 py-2 cursor-pointer text-sm text-center hover:bg-[#FFF1ED] hover:text-[#FF4B2B] ${opt.value === value ? 'bg-[#FFF1ED] text-[#FF4B2B] font-medium' : 'text-gray-700'}`}
              onClick={() => {
                onChange({ target: { value: opt.value } });
                setIsOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const TimeSelect = ({ value, onChange }) => {
  let [hour, minuteFull] = (value || "09:00").split(":");
  let minute = (minuteFull || "00").split(" ")[0];
  let h = parseInt(hour || "9", 10);
  const ampm = value?.includes('PM') ? 'PM' : (value?.includes('AM') ? 'AM' : (h >= 12 ? 'PM' : 'AM'));
  h = h % 12;
  if (h === 0) h = 12;
  const displayHour = h.toString().padStart(2, '0');

  const handleHourChange = (e) => {
    let newH = parseInt(e.target.value, 10);
    if (ampm === 'PM' && newH !== 12) newH += 12;
    if (ampm === 'AM' && newH === 12) newH = 0;
    onChange(`${newH.toString().padStart(2, '0')}:${minute || '00'}`);
  };

  const handleMinuteChange = (e) => {
    onChange(`${(hour || '09').padStart(2, '0')}:${e.target.value}`);
  };

  const handleAmPmChange = (e) => {
    const newAmpm = e.target.value;
    if (newAmpm === ampm) return;
    let newH = parseInt(hour || "9", 10);
    if (newAmpm === 'PM' && newH < 12) newH += 12;
    if (newAmpm === 'AM' && newH >= 12) newH -= 12;
    onChange(`${newH.toString().padStart(2, '0')}:${minute || '00'}`);
  };

  const hourOptions = Array.from({ length: 12 }, (_, i) => {
    const hVal = (i + 1).toString().padStart(2, '0');
    return { value: hVal, label: hVal };
  });

  const minOptions = Array.from({ length: 60 }, (_, i) => {
    const mVal = i.toString().padStart(2, '0');
    return { value: mVal, label: mVal };
  });

  const ampmOptions = [
    { value: 'AM', label: 'AM' },
    { value: 'PM', label: 'PM' }
  ];

  return (
    <div className="flex space-x-2">
      <CustomSelect 
        value={displayHour} 
        onChange={handleHourChange} 
        options={hourOptions}
        className="w-1/3"
      />
      <CustomSelect 
        value={minute || '00'} 
        onChange={handleMinuteChange} 
        options={minOptions}
        className="w-1/3"
      />
      <CustomSelect 
        value={ampm} 
        onChange={handleAmPmChange} 
        options={ampmOptions}
        className="w-1/3"
      />
    </div>
  );
};

const ImageWithLoader = ({ src, alt, className, spinnerSize }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [src]);

  return (
    <>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/10 z-10">
          <i className={`fa-solid fa-spinner fa-spin text-gray-400 ${spinnerSize || 'text-2xl'}`}></i>
        </div>
      )}
      <img
        key={src}
        ref={imgRef}
        src={src}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        onError={() => setIsLoaded(true)}
        className={`${className} ${!isLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
      />
    </>
  );
};

export const RestaurantProfilePage = () => {
  const { user, logout } = useAuth();

  const [restaurantInfo, setRestaurantInfo] = useState({
    logo: '',
    banner: '',
    name: '',
    cuisinesSummary: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
  });

  const [businessDetails, setBusinessDetails] = useState({
    cuisineType: '',
    openingTime: '',
    closingTime: '',
    workingDays: [],
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await restaurantAPI.getMe();

        if (data) {
          setRestaurantInfo({
            logo: data.logoImage || data.logo || '',
            banner: data.coverImage || data.bannerImage || '',
            name: data.name || '',
            cuisinesSummary: Array.isArray(data.cuisine) ? data.cuisine.join(', ') : (data.cuisine || ''),
            ownerName: data.owner || user?.name || '',
            email: data.email || '',
            phone: data.phone || user?.phone || '',
            address: data.address || '',
          });

          let wDays = data.workingDays;
          if (typeof wDays === 'string') {
            wDays = wDays.split(',').map(d => d.trim()).filter(Boolean);
          } else if (!Array.isArray(wDays)) {
            wDays = [];
          }

          setBusinessDetails({
            cuisineType: Array.isArray(data.cuisine) ? data.cuisine.join(', ') : (data.cuisine || ''),
            openingTime: data.openingTime || '',
            closingTime: data.closingTime || '',
            workingDays: wDays,
          });
        }
      } catch (err) {
        console.error('Failed to fetch restaurant profile:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const [activeModal, setActiveModal] = useState(null);

  const [infoForm, setInfoForm] = useState({ ...restaurantInfo });
  const [businessForm, setBusinessForm] = useState({ ...businessDetails });
  const [logoInput, setLogoInput] = useState(restaurantInfo.logo);
  const [bannerInput, setBannerInput] = useState(restaurantInfo.banner);

  const handleOpenInfoModal = () => {
    setInfoForm({ ...restaurantInfo });
    setActiveModal('info');
  };

  const [isSavingInfo, setIsSavingInfo] = useState(false);

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setIsSavingInfo(true);
    try {
      const payload = {
        name: infoForm.name.trim(),
        owner: infoForm.ownerName.trim(),
        phone: infoForm.phone.trim(),
        address: infoForm.address.trim(),
      };
      await restaurantAPI.updateMe(payload);
      setRestaurantInfo({ ...infoForm });
      setActiveModal(null);
    } catch (err) {
      console.error('Failed to update restaurant info:', err);
    } finally {
      setIsSavingInfo(false);
    }
  };

  const handleOpenBusinessModal = () => {
    setBusinessForm({ ...businessDetails });
    setActiveModal('business');
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveBusiness = async (e) => {
    console.log(">>> handleSaveBusiness STARTED!");
    try {
      e.preventDefault();
      console.log(">>> e.preventDefault() successful");

      console.log(">>> Validating form data:", businessForm);
      if (!businessForm.cuisineType || !businessForm.cuisineType.trim() || !businessForm.openingTime || !businessForm.closingTime || !businessForm.workingDays || businessForm.workingDays.length === 0) {
        console.error('>>> Validation failed!', businessForm);
        return;
      }

      console.log(">>> Validation passed. Setting isSaving to true.");
      setIsSaving(true);

      const cuisineMapping = {
        'Pizza': 'PIZZA',
        'Burger': 'BURGER',
        'Biryani': 'BIRYANI',
        'Chinese': 'CHINESE',
        'South Indian': 'SOUTH_INDIAN',
        'North Indian': 'NORTH_INDIAN',
        'Multi-Cuisine': 'MULTI_CUISINE',
      };

      const cuisineValue = cuisineMapping[businessForm.cuisineType] || businessForm.cuisineType.toUpperCase().replace(/ /g, '_').replace(/-/g, '_');

      const payload = {
        cuisine: cuisineValue,
        openingTime: businessForm.openingTime,
        closingTime: businessForm.closingTime,
        workingDays: businessForm.workingDays
      };
      console.log(">>> Prepared API payload:", payload);

      try {
        console.log(">>> Calling restaurantAPI.updateMe...");
        const result = await restaurantAPI.updateMe(payload);
        console.log(">>> API call SUCCESS! Result:", result);
      } catch (apiErr) {
        console.error(">>> API ERROR CATCH BLOCK:", apiErr);
        throw apiErr;
      }

      console.log(">>> Updating local states...");
      setBusinessDetails({ ...businessForm, cuisineType: payload.cuisine });
      setRestaurantInfo(prev => ({ ...prev, cuisinesSummary: payload.cuisine }));

      console.log(">>> Closing modal...");
      setActiveModal(null);
      console.log(">>> handleSaveBusiness FINISHED SUCCESSFULLY!");
    } catch (err) {
      console.error('>>> OUTER CATCH - Failed to update business details:', err);
    } finally {
      console.log(">>> finally block - setting isSaving to false");
      setIsSaving(false);
    }
  };

  const [isSavingLogo, setIsSavingLogo] = useState(false);

  const handleSaveLogo = async (e) => {
    e.preventDefault();
    setIsSavingLogo(true);
    try {
      let finalUrl = logoInput;
      if (logoInput instanceof File) {
        const uploadRes = await uploadAPI.uploadFile(logoInput, 'restaurants');
        finalUrl = uploadRes.url;
      } else {
        finalUrl = typeof logoInput === 'string' ? logoInput.trim() : '';
      }
      await restaurantAPI.updateMe({ logoImage: finalUrl });
      setRestaurantInfo((prev) => ({ ...prev, logo: finalUrl }));
      setActiveModal(null);
    } catch (err) {
      console.error('Failed to update logo:', err);
    } finally {
      setIsSavingLogo(false);
    }
  };

  const [isSavingBanner, setIsSavingBanner] = useState(false);

  const handleSaveBanner = async (e) => {
    e.preventDefault();
    setIsSavingBanner(true);
    try {
      let finalUrl = bannerInput;
      if (bannerInput instanceof File) {
        const uploadRes = await uploadAPI.uploadFile(bannerInput, 'restaurants');
        finalUrl = uploadRes.url;
      } else {
        finalUrl = typeof bannerInput === 'string' ? bannerInput.trim() : '';
      }
      await restaurantAPI.updateMe({ coverImage: finalUrl });
      setRestaurantInfo((prev) => ({ ...prev, banner: finalUrl }));
      setActiveModal(null);
    } catch (err) {
      console.error('Failed to update banner:', err);
    } finally {
      setIsSavingBanner(false);
    }
  };

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await restaurantAPI.deleteMe();
      setActiveModal(null);
      if (typeof logout === 'function') {
        logout();
      } else {
        localStorage.clear();
        window.location.href = '/login';
      }
    } catch (err) {
      console.error('Failed to delete account:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <PanelLoading message="Loading profile..." />;
  }

  return (
    <div className="space-y-4 lg:space-y-5 font-poppins text-[#111827]">
      <div>
        <h2 className="text-[28px] font-[700] text-[#111827] tracking-tight">
          Profile
        </h2>
        <p className="text-[14px] font-[400] text-[#6B7280] mt-1">
          Manage your restaurant profile and account settings
        </p>
      </div>

      <div className="w-full h-32 sm:h-40 lg:h-40 rounded-[14px] overflow-hidden border border-[#F1F1F1] shadow-sm mb-4 lg:mb-5 relative bg-[#111827] group">
        {restaurantInfo.banner ? (
          <ImageWithLoader 
            src={restaurantInfo.banner} 
            alt="Restaurant Banner" 
            className="w-full h-full object-cover group-hover:brightness-90 transition-all absolute inset-0"
            spinnerSize="text-4xl"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-white/50">
            <i className="fa-regular fa-image text-4xl mb-2"></i>
            <span className="text-sm font-medium">No banner uploaded</span>
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            setBannerInput(restaurantInfo.banner);
            setActiveModal('banner');
          }}
          className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-[#111827] px-4 py-2 rounded-[10px] text-[13px] font-[600] shadow-md transition-colors flex items-center gap-2 cursor-pointer border border-gray-200"
        >
          <i className="fa-solid fa-camera text-[14px]"></i>
          Upload Cover Image
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">

        <div className="lg:col-span-7 bg-[#FFFFFF] rounded-[14px] border border-[#F1F1F1] shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-5 space-y-5">

          <div className="flex items-center justify-between">
            <h3 className="text-[20px] font-[600] text-[#111827] tracking-tight">
              Restaurant Information
            </h3>
            <button
              type="button"
              onClick={handleOpenInfoModal}
              className="inline-flex items-center px-3.5 py-1.5 border border-[#FF4B2B] text-[#FF4B2B] hover:bg-[#FFF1ED] rounded-[10px] text-[12px] font-[500] transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-pen mr-1.5 text-[10px]"></i>
              Edit
            </button>
          </div>

          <div className="flex items-start space-x-5 pt-2 pb-4 border-b border-[#F1F1F1]">
            <div 
              onClick={() => {
                setLogoInput(restaurantInfo.logo);
                setActiveModal('logo');
              }}
              title="Click to change logo"
              className="w-24 h-24 rounded-[14px] bg-[#0F0E0E] flex flex-col items-center justify-center text-amber-400 p-2 border border-[#F1F1F1] shadow-2xs shrink-0 overflow-hidden relative cursor-pointer group"
            >
              {restaurantInfo.logo ? (
                <>
                  <ImageWithLoader
                    src={restaurantInfo.logo}
                    alt={restaurantInfo.name}
                    className="w-full h-full object-cover rounded-[10px] absolute inset-0 group-hover:brightness-75 transition-all"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-[10px]">
                    <i className="fa-solid fa-camera text-white text-lg"></i>
                  </div>
                </>
              ) : (
                <div className="text-center group-hover:opacity-80 transition-opacity">
                  <i className="fa-solid fa-store text-2xl mb-0.5 text-gray-400"></i>
                  <p className="text-[10px] font-[500] tracking-widest text-gray-400 uppercase leading-tight mt-1">
                    NO LOGO
                  </p>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-[20px] font-[500] text-[#111827] tracking-tight truncate">
                {restaurantInfo.name}
              </h4>
              <p className="text-[12px] font-[400] text-[#6B7280] mt-0.5 truncate">
                {restaurantInfo.cuisinesSummary}
              </p>
              <button
                type="button"
                onClick={() => {
                  setLogoInput(restaurantInfo.logo);
                  setActiveModal('logo');
                }}
                className="mt-2.5 inline-flex items-center px-3 py-1.5 border border-[#E5E7EB] text-[#111827] hover:bg-[#F9FAFB] rounded-[8px] text-[12px] font-[500] transition-colors cursor-pointer shadow-xs"
              >
                <i className="fa-solid fa-camera mr-1.5 text-[11px] text-[#6B7280]"></i>
                Change Logo
              </button>
            </div>
          </div>

          <div className="divide-y divide-[#F1F1F1] text-[14px] space-y-4">

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-3 text-[#6B7280]">
                <i className="fa-solid fa-store w-5 text-[#9CA3AF] text-[14px]"></i>
                <span className="font-[500] text-[#6B7280]">Restaurant Name</span>
              </div>
              <span className="font-[500] text-[#111827] text-right">{restaurantInfo.name}</span>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center space-x-3 text-[#6B7280]">
                <i className="fa-solid fa-user w-5 text-[#9CA3AF] text-[14px]"></i>
                <span className="font-[500] text-[#6B7280]">Owner Name</span>
              </div>
              <span className="font-[500] text-[#111827] text-right">{restaurantInfo.ownerName}</span>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center space-x-3 text-[#6B7280]">
                <i className="fa-solid fa-phone w-5 text-[#9CA3AF] text-[14px]"></i>
                <span className="font-[500] text-[#6B7280]">Phone Number</span>
              </div>
              <span className="font-[500] text-[#111827] text-right">{restaurantInfo.phone}</span>
            </div>

            <div className="flex items-start justify-between pt-4">
              <div className="flex items-center space-x-3 text-[#6B7280] shrink-0">
                <i className="fa-solid fa-location-dot w-5 text-[#9CA3AF] text-[14px]"></i>
                <span className="font-[500] text-[#6B7280]">Address</span>
              </div>
              <span className="font-[500] text-[#111827] text-right max-w-xs leading-snug pl-4">
                {restaurantInfo.address}
              </span>
            </div>

          </div>
        </div>

        <div className="lg:col-span-5 space-y-5">

          <div className="bg-[#FFFFFF] rounded-[14px] border border-[#F1F1F1] shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[20px] font-[600] text-[#111827] tracking-tight">
                Business Details
              </h3>
              <button
                type="button"
                onClick={handleOpenBusinessModal}
                className="inline-flex items-center px-3.5 py-1.5 border border-[#FF4B2B] text-[#FF4B2B] hover:bg-[#FFF1ED] rounded-[10px] text-[12px] font-[500] transition-colors cursor-pointer"
              >
                <i className="fa-solid fa-pen mr-1.5 text-[10px]"></i>
                Edit
              </button>
            </div>

            <div className="divide-y divide-[#F1F1F1] text-[14px] space-y-4">
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-3 text-[#6B7280]">
                  <i className="fa-solid fa-utensils w-5 text-[#9CA3AF] text-[14px]"></i>
                  <span className="font-[500] text-[#6B7280]">Cuisine Type</span>
                </div>
                <span className="font-[500] text-[#111827] text-right">{businessDetails.cuisineType}</span>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center space-x-3 text-[#6B7280]">
                  <i className="fa-regular fa-clock w-5 text-[#9CA3AF] text-[14px]"></i>
                  <span className="font-[500] text-[#6B7280]">Opening Time</span>
                </div>
                <span className="font-[500] text-[#111827] text-right">{format12Hour(businessDetails.openingTime)}</span>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center space-x-3 text-[#6B7280]">
                  <i className="fa-regular fa-clock w-5 text-[#9CA3AF] text-[14px]"></i>
                  <span className="font-[500] text-[#6B7280]">Closing Time</span>
                </div>
                <span className="font-[500] text-[#111827] text-right">{format12Hour(businessDetails.closingTime)}</span>
              </div>

              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 w-1/3 shrink-0">
                  <i className="fa-regular fa-calendar text-[#FF4B2B] w-4 text-center"></i>
                  <span className="font-[500] text-[#6B7280]">Working Days</span>
                </div>
                <div className="text-right pl-4">
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(shortDay => {
                      const fullDay = { 'Mon':'Monday', 'Tue':'Tuesday', 'Wed':'Wednesday', 'Thu':'Thursday', 'Fri':'Friday', 'Sat':'Saturday', 'Sun':'Sunday' }[shortDay];
                      const isActive = Array.isArray(businessDetails.workingDays) && businessDetails.workingDays.includes(fullDay);
                      return (
                        <span key={shortDay} className={`px-2 py-0.5 rounded-[6px] text-[11px] font-[500] border ${isActive ? 'bg-[#FFF1ED] text-[#FF4B2B] border-[#FF4B2B]/20' : 'bg-[#FAFAFA] text-[#9CA3AF] border-[#F1F1F1]'}`}>
                          {shortDay}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#FFFFFF] rounded-[14px] border border-[#F1F1F1] shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-5 space-y-4">
            <h3 className="text-[20px] font-[600] text-[#111827] tracking-tight">
              Account Settings
            </h3>

            <div className="divide-y divide-[#F1F1F1] text-[14px] space-y-4">

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center space-x-3 text-[#6B7280]">
                  <i className="fa-solid fa-trash-can w-5 text-[#9CA3AF] text-[14px]"></i>
                  <span className="font-[500] text-[#6B7280]">Delete Account</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal('delete')}
                  className="inline-flex items-center px-3 py-1.5 border border-rose-300 text-rose-600 hover:bg-rose-50 rounded-[10px] text-[12px] font-[500] transition-colors cursor-pointer"
                >
                  <i className="fa-solid fa-trash-can mr-1.5 text-[10px]"></i>
                  Delete Account
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>

      {activeModal === 'info' && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-[14px] border border-[#F1F1F1] max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#F1F1F1] pb-4">
              <h3 className="text-[20px] font-[600] text-[#111827]">
                Edit Restaurant Information
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-[#6B7280] hover:text-[#111827] p-1.5 rounded-full hover:bg-[#FAFAFA] transition-colors cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSaveInfo} className="space-y-4 text-[14px] font-[400]">
              <div className="space-y-1">
                <label className="block text-[#6B7280] font-[500] text-[12px]">Restaurant Name</label>
                <input
                  type="text"
                  required
                  value={infoForm.name}
                  onChange={(e) => setInfoForm({ ...infoForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-[10px] border border-[#F1F1F1] text-[#111827] focus:outline-none focus:border-[#FF4B2B] focus:ring-1 focus:ring-[#FF4B2B]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[#6B7280] font-[500] text-[12px]">Owner Name</label>
                <input
                  type="text"
                  required
                  value={infoForm.ownerName}
                  onChange={(e) => setInfoForm({ ...infoForm, ownerName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-[10px] border border-[#F1F1F1] text-[#111827] focus:outline-none focus:border-[#FF4B2B] focus:ring-1 focus:ring-[#FF4B2B]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[#6B7280] font-[500] text-[12px]">Phone Number</label>
                <input
                  type="text"
                  required
                  value={infoForm.phone}
                  onChange={(e) => setInfoForm({ ...infoForm, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-[10px] border border-[#F1F1F1] text-[#111827] focus:outline-none focus:border-[#FF4B2B] focus:ring-1 focus:ring-[#FF4B2B]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[#6B7280] font-[500] text-[12px]">Address</label>
                <textarea
                  rows={3}
                  required
                  value={infoForm.address}
                  onChange={(e) => setInfoForm({ ...infoForm, address: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-[10px] border border-[#F1F1F1] text-[#111827] focus:outline-none focus:border-[#FF4B2B] focus:ring-1 focus:ring-[#FF4B2B]"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[#F1F1F1]">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-5 py-2.5 rounded-[10px] border border-[#F1F1F1] text-[#6B7280] font-[500] text-[14px] hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingInfo}
                  className="px-5 py-2.5 rounded-[10px] bg-[#FF4B2B] hover:bg-[#e03a00] text-white font-[500] text-[14px] transition-colors shadow-xs cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSavingInfo ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'business' && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-[14px] border border-[#F1F1F1] max-w-md w-full p-6 sm:p-8 space-y-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#F1F1F1] pb-4">
              <h3 className="text-[20px] font-[600] text-[#111827]">
                Edit Business Details
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-[#6B7280] hover:text-[#111827] p-1.5 rounded-full hover:bg-[#FAFAFA] transition-colors cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onSubmit={(e) => {
              console.log("FORM SUBMITTED!");
              handleSaveBusiness(e);
            }} className="space-y-4 text-[14px] font-[400]">
              <div className="space-y-1">
                <label className="block text-[#6B7280] font-[500] text-[12px]">Cuisine Type</label>
                <CustomSelect
                  value={businessForm.cuisineType || 'Select Cuisine'}
                  onChange={(e) => setBusinessForm({ ...businessForm, cuisineType: e.target.value })}
                  options={[
                    { value: 'Indian', label: 'Indian' },
                    { value: 'Chinese', label: 'Chinese' },
                    { value: 'Italian', label: 'Italian' },
                    { value: 'Mexican', label: 'Mexican' },
                    { value: 'Japanese', label: 'Japanese' },
                    { value: 'South Indian', label: 'South Indian' },
                    { value: 'North Indian', label: 'North Indian' }
                  ]}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[#6B7280] font-[500] text-[12px]">Opening Time</label>
                  <TimeSelect 
                    value={businessForm.openingTime} 
                    onChange={(newVal) => setBusinessForm({ ...businessForm, openingTime: newVal })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[#6B7280] font-[500] text-[12px]">Closing Time</label>
                  <TimeSelect 
                    value={businessForm.closingTime} 
                    onChange={(newVal) => setBusinessForm({ ...businessForm, closingTime: newVal })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[#6B7280] font-[500] text-[12px]">Working Days</label>
                <div className="flex flex-wrap gap-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                    const isSelected = Array.isArray(businessForm.workingDays) && businessForm.workingDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => {
                          let currentDays = Array.isArray(businessForm.workingDays) ? businessForm.workingDays : [];
                          if (isSelected) {
                            setBusinessForm({ ...businessForm, workingDays: currentDays.filter(d => d !== day) });
                          } else {
                            const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                            const newDays = [...currentDays, day].sort((a, b) => allDays.indexOf(a) - allDays.indexOf(b));
                            setBusinessForm({ ...businessForm, workingDays: newDays });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-[8px] text-[12px] font-[500] transition-colors border ${
                          isSelected 
                            ? 'bg-[#FF4B2B] text-white border-[#FF4B2B]' 
                            : 'bg-white text-[#6B7280] border-[#F1F1F1] hover:bg-[#FAFAFA]'
                        }`}
                      >
                        {day.substring(0, 3)}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[#F1F1F1]">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-5 py-2.5 rounded-[10px] border border-[#F1F1F1] text-[#6B7280] font-[500] text-[14px] hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-[10px] bg-[#FF4B2B] hover:bg-[#e03a00] text-white font-[500] text-[14px] transition-colors shadow-xs cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'logo' && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-[14px] border border-[#F1F1F1] max-w-md w-full p-6 sm:p-8 space-y-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#F1F1F1] pb-4">
              <h3 className="text-[20px] font-[600] text-[#111827]">
                Change Restaurant Logo
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-[#6B7280] hover:text-[#111827] p-1.5 rounded-full hover:bg-[#FAFAFA] transition-colors cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSaveLogo} className="space-y-4 text-[14px] font-[400]">
              <div className="space-y-1">
                <label className="block text-[#6B7280] font-[500] text-[12px]">Upload Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setLogoInput(file);
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-[10px] border border-[#F1F1F1] text-[#111827] focus:outline-none focus:border-[#FF4B2B] focus:ring-1 focus:ring-[#FF4B2B] bg-[#FAFAFA]"
                />
                {logoInput instanceof File && (
                  <p className="text-[12px] text-emerald-600 font-[500] mt-2">Image selected successfully: {logoInput.name}</p>
                )}
                {!(logoInput instanceof File) && logoInput && (
                  <p className="text-[12px] text-gray-500 font-[500] mt-2">Current image loaded.</p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[#F1F1F1]">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-5 py-2.5 rounded-[10px] border border-[#F1F1F1] text-[#6B7280] font-[500] text-[14px] hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingLogo}
                  className="px-5 py-2.5 rounded-[10px] bg-[#FF4B2B] hover:bg-[#e03a00] text-white font-[500] text-[14px] transition-colors shadow-xs cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSavingLogo ? 'Updating...' : 'Update Logo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'banner' && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-[14px] border border-[#F1F1F1] max-w-md w-full p-6 sm:p-8 space-y-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#F1F1F1] pb-4">
              <h3 className="text-[20px] font-[600] text-[#111827]">
                Update Cover Image
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-[#6B7280] hover:text-[#111827] p-1.5 rounded-full hover:bg-[#FAFAFA] transition-colors cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-4 text-[14px] font-[400]">
              <div className="space-y-1">
                <label className="block text-[#6B7280] font-[500] text-[12px]">Upload Cover / Card Image</label>
                <p className="text-[12px] text-gray-500 font-[400] mb-2">Note: This image will be used for your restaurant cover banner and card image.</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setBannerInput(file);
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-[10px] border border-[#F1F1F1] text-[#111827] focus:outline-none focus:border-[#FF4B2B] focus:ring-1 focus:ring-[#FF4B2B] bg-[#FAFAFA]"
                />
                {bannerInput instanceof File && (
                  <p className="text-[12px] text-emerald-600 font-[500] mt-2">Image selected successfully: {bannerInput.name}</p>
                )}
                {!(bannerInput instanceof File) && bannerInput && (
                  <p className="text-[12px] text-gray-500 font-[500] mt-2">Current image loaded.</p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[#F1F1F1]">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-5 py-2.5 rounded-[10px] border border-[#F1F1F1] text-[#6B7280] font-[500] text-[14px] hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBanner}
                  className="px-5 py-2.5 rounded-[10px] bg-[#FF4B2B] hover:bg-[#e03a00] text-white font-[500] text-[14px] transition-colors shadow-xs cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSavingBanner ? 'Updating...' : 'Update Image'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'delete' && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-[14px] border border-[#F1F1F1] max-w-md w-full p-6 sm:p-8 space-y-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#F1F1F1] pb-4">
              <h3 className="text-[20px] font-[600] text-rose-600 flex items-center gap-2">
                <i className="fa-solid fa-triangle-exclamation"></i>
                Delete Account
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-[#6B7280] hover:text-[#111827] p-1.5 rounded-full hover:bg-[#FAFAFA] transition-colors cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <p className="text-[14px] font-[400] text-[#6B7280] leading-relaxed">
              Are you sure you want to delete your restaurant profile? This action is permanent and cannot be undone. All active menu items and settings will be removed.
            </p>

            <div className="flex justify-end space-x-3 pt-4 border-t border-[#F1F1F1]">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-5 py-2.5 rounded-[10px] border border-[#F1F1F1] text-[#6B7280] font-[500] text-[14px] hover:bg-[#FAFAFA] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-[10px] bg-rose-600 hover:bg-rose-700 text-white font-[500] text-[14px] transition-colors shadow-xs cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
