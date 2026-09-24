import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, MapPin } from 'lucide-react';
import { restaurantAPI } from '../../services/api';
import { RestaurantCarousel } from './RestaurantCarousel';
import { useNavigate } from 'react-router-dom';

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

const KNOWN_CITIES = {
  mangalore: { lat: 12.9141, lon: 74.8560 },
  mumbai: { lat: 19.0760, lon: 72.8777 },
  bengaluru: { lat: 12.9716, lon: 77.5946 },
  bangalore: { lat: 12.9716, lon: 77.5946 },
  delhi: { lat: 28.6139, lon: 77.2090 },
  pune: { lat: 18.5204, lon: 73.8567 },
  hyderabad: { lat: 17.3850, lon: 78.4867 },
  chennai: { lat: 13.0827, lon: 80.2707 },
  kolkata: { lat: 22.5726, lon: 88.3639 },
  koppal: { lat: 15.3452, lon: 76.1548 },
  udupi: { lat: 13.3409, lon: 74.7421 },
  manipal: { lat: 13.3525, lon: 74.7928 },
  mysore: { lat: 12.2958, lon: 76.6394 },
  hubli: { lat: 15.3647, lon: 75.1240 },
  goa: { lat: 15.2993, lon: 74.1240 },
};

function getRestaurantCoordinates(rest) {
  if (rest.latitude && rest.longitude) {
    return { lat: Number(rest.latitude), lon: Number(rest.longitude) };
  }

  const fullLoc = `${rest.city || ''} ${rest.location || ''} ${rest.address || ''}`.toLowerCase();
  let baseCoords = null;

  for (const [cityName, coords] of Object.entries(KNOWN_CITIES)) {
    if (fullLoc.includes(cityName)) {
      baseCoords = coords;
      break;
    }
  }

  if (!baseCoords) {
    baseCoords = KNOWN_CITIES.mangalore;
  }

  const seedStr = rest.id || rest._id || rest.name || 'restaurant';
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const latOffset = (((Math.sin(hash) * 10000) % 1) * 0.03) - 0.015;
  const lonOffset = (((Math.cos(hash) * 10000) % 1) * 0.03) - 0.015;

  return {
    lat: baseCoords.lat + latOffset,
    lon: baseCoords.lon + lonOffset,
  };
}

async function fetchUserIpLocation() {
  const CACHE_KEY = 'foodtrip_user_ip_location';
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.lat && parsed.lon) {
        return parsed;
      }
    }
  } catch {}

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('https://ipwho.is/', { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.latitude && data.longitude) {
        const city = data.city || '';
        const region = data.region || '';
        const result = {
          lat: data.latitude,
          lon: data.longitude,
          city: city || 'Your Location',
          region: region,
          displayName: city && region ? `${city}, ${region}` : (city || region || 'Your Location'),
        };
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(result)); } catch {}
        return result;
      }
    }
  } catch {}

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('https://freeipapi.com/api/json', { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data && data.latitude && data.longitude) {
        const city = data.cityName || '';
        const region = data.regionName || '';
        const result = {
          lat: data.latitude,
          lon: data.longitude,
          city: city || 'Your Location',
          region: region,
          displayName: city && region ? `${city}, ${region}` : (city || region || 'Your Location'),
        };
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(result)); } catch {}
        return result;
      }
    }
  } catch {}

  return {
    lat: 12.9716,
    lon: 77.5946,
    city: 'Bengaluru',
    region: 'Karnataka',
    displayName: 'Bengaluru, Karnataka',
  };
}

export const NearestRestaurantsSection = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [allNearest, setAllNearest] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const navigate = useNavigate();

  const isFetchingRef = useRef(false);

  const getBatchLimit = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 3;
    }
    return 6;
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);

        const [ipLoc, res] = await Promise.all([
          fetchUserIpLocation(),
          restaurantAPI.getAll({ page: 1, limit: 40 }),
        ]);

        if (!isMounted) return;

        setUserLocation(ipLoc.displayName);

        if (res && res.success && Array.isArray(res.data)) {
          const sortedList = res.data.map((rest) => {
            const restCoords = getRestaurantCoordinates(rest);
            const dist = getDistanceFromLatLonInKm(
              ipLoc.lat,
              ipLoc.lon,
              restCoords.lat,
              restCoords.lon
            );

            return {
              ...rest,
              distance: dist < 100 ? parseFloat(dist.toFixed(1)) : Math.round(dist),
            };
          }).sort((a, b) => a.distance - b.distance);

          setAllNearest(sortedList);
          const batchSize = getBatchLimit();
          const initialBatch = sortedList.slice(0, batchSize);
          setRestaurants(initialBatch);
          setHasMore(sortedList.length > batchSize);
        }
      } catch (error) {
        console.error('Failed to load nearest restaurants:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLoadMore = async () => {
    if (isFetchingRef.current || !hasMore || loadingMore || loading) return;
    isFetchingRef.current = true;
    setLoadingMore(true);

    try {
      await new Promise((r) => setTimeout(r, 400));
      const batchSize = getBatchLimit();
      const nextPage = page + 1;
      const nextBatch = allNearest.slice(0, nextPage * batchSize);
      setRestaurants(nextBatch);
      setPage(nextPage);
      setHasMore(nextBatch.length < allNearest.length);
    } catch (err) {
      console.error('Failed to load more nearest restaurants:', err);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  };

  if (!loading && restaurants.length === 0) return null;

  return (
    <section className="pt-8 mt-4 border-t border-[#F1F1F1]">
      <div className="flex items-center justify-between mb-[20px]">
        <div>
          <h2 className="text-[24px] font-[800] text-[#111827] tracking-tight font-poppins">
            Nearest Restaurants
          </h2>
          <div className="min-h-[22px] mt-1 flex items-center">
            {userLocation ? (
              <div className="flex items-center text-[#6B7280] text-[13px] font-[500] space-x-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>Based on your IP location: {userLocation}</span>
              </div>
            ) : (
              <div className="flex items-center text-[#9CA3AF] text-[13px] font-[500] space-x-1 animate-pulse">
                <MapPin className="w-3.5 h-3.5" />
                <span>Locating nearest...</span>
              </div>
            )}
          </div>
        </div>
        <button 
          onClick={() => navigate('/restaurants-list')}
          className="flex items-center space-x-1 text-[14px] font-[600] text-[#FF4B2B] hover:text-[#e03a00] transition-colors cursor-pointer group font-poppins self-start mt-2"
        >
          <span>View All</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      <RestaurantCarousel 
        restaurants={restaurants}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
      />
    </section>
  );
};
