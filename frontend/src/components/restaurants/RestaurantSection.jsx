import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { restaurantAPI } from '../../services/api';
import { RestaurantCarousel } from './RestaurantCarousel';
import { useNavigate } from 'react-router-dom';

export const RestaurantSection = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const isFetchingRef = useRef(false);

  const getBatchLimit = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 3;
    }
    return 6;
  };

  const fetchRestaurants = async (targetPage) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setError(null);

    const limit = getBatchLimit();

    try {
      if (targetPage === 1) setLoading(true);
      else setLoadingMore(true);

      const res = await restaurantAPI.getAll({
        page: targetPage,
        limit,
        sort: '-rating',
      });

      if (res && res.success && Array.isArray(res.data)) {
        if (targetPage > 1) {
          await new Promise((r) => setTimeout(r, 400));
        }
        const newItems = res.data;

        setRestaurants((prev) => {
          if (targetPage === 1) return newItems;
          const existingIds = new Set(prev.map((r) => r.id || r._id));
          const uniqueNew = newItems.filter((r) => !existingIds.has(r.id || r._id));
          return [...prev, ...uniqueNew];
        });

        const totalPages = res.totalPages || Math.ceil((res.total || 0) / limit);
        if (targetPage >= totalPages || newItems.length < limit) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to fetch popular restaurants:', err);
      if (targetPage === 1) {
        setError('Unable to load popular restaurants. Please try again.');
      } else {
        setHasMore(false);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchRestaurants(1);
  }, []);

  const handleLoadMore = () => {
    if (isFetchingRef.current || !hasMore || loadingMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchRestaurants(nextPage);
  };

  if (error && restaurants.length === 0 && !loading) {
    return (
      <section className="pt-8 mt-4 border-t border-[#F1F1F1]">
        <div className="flex items-center justify-between mb-[20px]">
          <h2 className="text-[24px] font-[800] text-[#111827] tracking-tight font-poppins">
            Popular Restaurants
          </h2>
        </div>
        <div className="p-6 bg-red-50/60 border border-red-200/80 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
          <p className="text-sm font-medium text-red-700">{error}</p>
          <button
            onClick={() => fetchRestaurants(1)}
            className="px-4 py-2 bg-[#FF4B2B] text-white text-xs font-semibold rounded-xl hover:bg-[#e03a00] transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  if (!loading && restaurants.length === 0) return null;

  return (
    <section className="pt-8 mt-4 border-t border-[#F1F1F1]">
      <div className="flex items-center justify-between mb-[20px]">
        <h2 className="text-[24px] font-[800] text-[#111827] tracking-tight font-poppins">
          Popular Restaurants
        </h2>
        <button 
          onClick={() => navigate('/restaurants-list')}
          className="flex items-center space-x-1 text-[14px] font-[600] text-[#FF4B2B] hover:text-[#e03a00] transition-colors cursor-pointer group font-poppins"
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
