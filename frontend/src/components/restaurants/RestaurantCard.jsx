import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Clock, MapPin, ArrowRight } from 'lucide-react';
import { DEFAULT_IMAGES } from '../../constants/imageConstants';

export const RestaurantCard = ({ restaurant }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const cuisinesList = Array.isArray(restaurant?.cuisines)
    ? restaurant.cuisines
    : (Array.isArray(restaurant?.cuisine) ? restaurant.cuisine : (typeof restaurant?.cuisine === 'string' ? restaurant.cuisine.split(', ') : []));

  const categoryPills = cuisinesList.length > 0
    ? cuisinesList.slice(0, 3)
    : ['North Indian', 'Biryani', 'Fast Food'];

  const handleCardClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      window.scrollTo(0, 0);
    }
    navigate(`/restaurant/${restaurant?._id || restaurant?.id || 1}`);
  };

  const isOpen = restaurant?.isOpenNow ?? true;

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full relative rounded-[20px] md:rounded-[24px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] bg-white cursor-pointer group transition-shadow duration-300 font-poppins border border-gray-100/90 select-none"
    >
      <div className="flex md:hidden flex-row items-center gap-2.5 min-[380px]:gap-3 p-2.5 min-[380px]:p-3 h-[142px] min-[380px]:h-[150px] sm:h-[158px] w-full min-w-0">
        <div className="relative w-[105px] min-[380px]:w-[120px] sm:w-[130px] h-full rounded-[14px] min-[380px]:rounded-[16px] sm:rounded-[18px] overflow-hidden bg-gray-100 shrink-0">
          <img
            src={restaurant?.coverImage || restaurant?.bannerImage || restaurant?.image || DEFAULT_IMAGES.RESTAURANT_BANNER}
            alt={restaurant?.name || 'Restaurant'}
            loading="lazy"
            decoding="async"
            className={`w-full h-full object-cover transition-transform duration-500 ease-out ${isHovered ? 'scale-105' : 'scale-100'}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 pointer-events-none" />

          <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-md px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs border border-white/60 select-none">
            {isOpen ? (
              <>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                <span className="text-emerald-700 text-[9.5px] font-bold tracking-wide">Open</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF4B2B]" />
                <span className="text-[#FF4B2B] text-[9.5px] font-bold tracking-wide">Closed</span>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-between min-w-0 h-full py-0.5 overflow-hidden">
          <div>
            <div className="flex items-center gap-2 overflow-hidden min-w-0">
              <div className="w-8 h-8 min-[380px]:w-9 min-[380px]:h-9 rounded-full bg-[#FFF1ED] border border-[#FF4B2B]/15 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                {restaurant?.logoImage || restaurant?.logo || restaurant?.logoUrl ? (
                  <img
                    src={restaurant.logoImage || restaurant.logo || restaurant.logoUrl}
                    alt={`${restaurant.name} logo`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-extrabold text-[12px] min-[380px]:text-[13px] text-[#FF4B2B] uppercase">
                    {restaurant?.name ? restaurant.name.substring(0, 2) : 'RS'}
                  </span>
                )}
              </div>

              <div className="flex flex-col min-w-0 flex-1">
                <h3 className="font-bold text-gray-900 text-[13px] min-[380px]:text-[14px] leading-tight truncate group-hover:text-[#FF4B2B] transition-colors">
                  {restaurant?.name || 'Restaurant Name'}
                </h3>
                <p className="text-gray-500 text-[9.5px] min-[380px]:text-[10px] font-medium mt-0.5 truncate uppercase tracking-wider">
                  {cuisinesList.length > 0 ? cuisinesList.join(' • ') : 'Delicious Cuisines'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-2 text-[10.5px] min-[380px]:text-[11px] text-gray-500 whitespace-nowrap overflow-hidden">
              <div className="flex items-center gap-1 shrink-0 bg-amber-50 px-1.5 py-0.5 rounded-md">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span className="font-bold text-gray-900 text-[10.5px] min-[380px]:text-[11px]">{restaurant?.rating || '4.8'}</span>
                <span className="text-gray-400 text-[9px] hidden min-[360px]:inline">({restaurant?.reviewCount || '1.2K'})</span>
              </div>

              <span className="text-gray-300 shrink-0">•</span>

              <div className="flex items-center gap-1 shrink-0">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="font-medium text-gray-600 text-[10.5px] min-[380px]:text-[11px]">{restaurant?.deliveryTime || '25–35 min'}</span>
              </div>

              {restaurant?.distance !== undefined && (
                <>
                  <span className="text-gray-300 shrink-0">•</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <MapPin className="w-3 h-3 text-[#FF4B2B]" />
                    <span className="font-medium text-gray-600 text-[10.5px] min-[380px]:text-[11px]">{restaurant.distance} km</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 mt-1 pt-1.5 border-t border-gray-100 overflow-x-auto no-scrollbar whitespace-nowrap">
            {categoryPills.map((category, index) => (
              <span
                key={`${category}-${index}`}
                className="px-2 py-0.5 rounded-full text-[9.5px] min-[380px]:text-[10px] font-medium bg-gray-50 text-gray-600 border border-gray-100 hover:bg-[#FFF1ED] hover:text-[#FF4B2B] transition-colors shrink-0 truncate max-w-[100px]"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="hidden md:flex flex-col">
        <div className="h-[200px] md:h-[240px] w-full overflow-hidden relative bg-gray-100">
          <img
            src={restaurant?.coverImage || restaurant?.bannerImage || restaurant?.image || DEFAULT_IMAGES.RESTAURANT_BANNER}
            alt={restaurant?.name || 'Restaurant'}
            loading="lazy"
            decoding="async"
            className={`w-full h-full object-cover transition-transform duration-500 ${isHovered ? 'scale-105' : 'scale-100'}`}
          />

          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-2.5 md:px-3 py-1 md:py-1.5 rounded-full flex items-center gap-1.5 md:gap-2 shadow-sm select-none">
            <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${isOpen ? 'bg-[#22C55E]' : 'bg-[#FF4B2B]'}`} />
            <span className={`text-[10px] md:text-xs font-[700] tracking-wide ${isOpen ? 'text-[#16a34a]' : 'text-[#FF4B2B]'}`}>
              {isOpen ? 'Open' : 'Closed'}
            </span>
          </div>
        </div>

        <div className="bg-white relative -mt-4 md:-mt-6 p-4 md:p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#FFF1ED] flex items-center justify-center shrink-0 overflow-hidden border border-[#FF4B2B]/10">
                {restaurant?.logoImage || restaurant?.logo || restaurant?.logoUrl ? (
                  <img
                    src={restaurant.logoImage || restaurant.logo || restaurant.logoUrl}
                    alt={`${restaurant.name} logo`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-extrabold text-[16px] md:text-[18px] text-[#FF4B2B] uppercase">
                    {restaurant?.name ? restaurant.name.substring(0, 2) : 'RS'}
                  </span>
                )}
              </div>
              <div className="flex flex-col overflow-hidden">
                <h3 className="font-[700] text-gray-900 text-[15px] md:text-lg leading-tight truncate">
                  {restaurant?.name || 'Restaurant'}
                </h3>
                <p className="text-gray-500 text-[11px] md:text-[11px] mt-0.5 md:mt-1 truncate uppercase tracking-wider font-[500]">
                  {cuisinesList.length > 0 ? cuisinesList.join(' • ') : 'Various Cuisines'}
                </p>
              </div>
            </div>

            <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-[#FF4B2B] text-white flex items-center justify-center shrink-0 ml-3 group-hover:bg-[#E03E1E] transition-all duration-200 shadow-sm select-none">
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.5} />
            </div>
          </div>

          <div className="flex items-center gap-1.5 md:gap-3 mt-4 text-[10px] md:text-[12px] text-gray-500 whitespace-nowrap overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-1 shrink-0">
              <Star className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#F59E0B] fill-[#F59E0B]" />
              <span className="font-[700] text-gray-900">{restaurant?.rating || '4.8'}</span>
              <span>({restaurant?.reviewCount || '1.2K'})</span>
            </div>
            <span className="text-gray-300 shrink-0">•</span>
            <div className="flex items-center gap-1 shrink-0">
              <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
              <span>{restaurant?.deliveryTime || '25-35 min'}</span>
            </div>
            {restaurant?.distance !== undefined && (
              <>
                <span className="text-gray-300 shrink-0">•</span>
                <div className="flex items-center gap-1 shrink-0">
                  <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#FF4B2B]" />
                  <span>{restaurant.distance} km</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
