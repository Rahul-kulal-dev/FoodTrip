import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { DEFAULT_IMAGES } from '../constants/imageConstants';
import { RestaurantCard } from '../components/restaurants/RestaurantCard';
import { RestaurantCardSkeleton } from '../components/restaurants/RestaurantCarousel';
import { restaurantAPI } from '../services/api';

const cuisineChips = [
  'All',
  'Indian',
  'Chinese',
  'Italian',
  'Mexican',
  'Japanese',
  'South Indian',
  'North Indian',
];

export const RestaurantListPage = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialQuery = searchParams.get('q') || '';
  const initialCuisine = location.state?.cuisine || 'All';

  const [restaurantsList, setRestaurantsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchInput, setSearchInput] = useState(initialQuery);
  const [appliedSearchQuery, setAppliedSearchQuery] = useState(initialQuery);
  const [selectedCuisineChip, setSelectedCuisineChip] = useState(initialCuisine);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('Relevance');

  useEffect(() => {
    const q = new URLSearchParams(location.search).get('q') || '';
    setSearchInput(q);
    setAppliedSearchQuery(q);
    setPage(1);
  }, [location.search]);

  const [page, setPage] = useState(1);
  const limit = 12;
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 8,
    total: 0,
    totalPages: 1,
  });

  const [selectedCuisines, setSelectedCuisines] = useState(initialCuisine !== 'All' ? [initialCuisine] : []);

  const formatRestaurantForCard = (r) => {
    const isActuallyOpen = r.isOpen === true || r.isOpen === 1 || r.isOpen === 'true';
    const isActuallyOpenNow = r.isOpenNow !== undefined 
      ? (r.isOpenNow === true || r.isOpenNow === 1 || r.isOpenNow === 'true')
      : isActuallyOpen;

    return {
      id: r.id || r._id,
      name: r.name,
      cuisines: Array.isArray(r.cuisines) ? r.cuisines : (Array.isArray(r.cuisine) ? r.cuisine : (typeof r.cuisine === 'string' ? r.cuisine.split(', ') : ['Multi-Cuisine'])),
      cuisine: r.cuisine,
      rating: r.rating || 4.5,
      reviews: r.ratingCount || r.reviews || '500+',
      isOpen: isActuallyOpen,
      isOpenNow: isActuallyOpenNow,
      logoImage: r.logoImage || r.logo || DEFAULT_IMAGES.RESTAURANT_LOGO,
      coverImage: r.coverImage || r.bannerImage || r.image || DEFAULT_IMAGES.RESTAURANT_BANNER,
      logo: r.logoImage || r.logo || DEFAULT_IMAGES.RESTAURANT_LOGO,
      logoUrl: r.logoUrl || '',
      image: r.coverImage || r.bannerImage || r.image || DEFAULT_IMAGES.RESTAURANT_BANNER,
      bannerImage: r.coverImage || r.bannerImage || DEFAULT_IMAGES.RESTAURANT_BANNER,
      location: r.location || r.address || 'Bengaluru',
      description: r.description || '',
    };
  };

  const fetchRestaurants = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = {
        page,
        limit,
      };

      if (appliedSearchQuery.trim()) {
        params.search = appliedSearchQuery.trim();
      }

      if (selectedCuisineChip !== 'All') {
        params.cuisine = selectedCuisineChip;
      } else if (selectedCuisines.length > 0) {
        params.cuisine = selectedCuisines[0];
      }

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (sortBy === 'Rating High→Low') params.sort = '-rating';
      else if (sortBy === 'Rating Low→High') params.sort = 'rating';

      const response = await restaurantAPI.getAll(params);

      const items = Array.isArray(response) ? response : (response.data || []);
      let formattedItems = items.map(formatRestaurantForCard);

      if (statusFilter === 'open') {
        formattedItems = formattedItems.filter((r) => r.isOpen && r.isOpenNow);
      } else if (statusFilter === 'closed') {
        formattedItems = formattedItems.filter((r) => !r.isOpen || !r.isOpenNow);
      }

      setRestaurantsList(formattedItems);

      if (response && response.totalPages !== undefined) {
        setPagination({
          page: response.page || page,
          limit: response.limit || limit,
          total: response.total || formattedItems.length,
          totalPages: response.totalPages || 1,
        });
      } else {
        setPagination({
          page: 1,
          limit,
          total: formattedItems.length,
          totalPages: 1,
        });
      }
    } catch (err) {
      console.error('Fetch restaurants error:', err);
      setError(err.message || 'Failed to load restaurants. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [
    page,
    limit,
    appliedSearchQuery,
    selectedCuisineChip,
    statusFilter,
    sortBy,
    selectedCuisines,
  ]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setAppliedSearchQuery(searchInput);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setAppliedSearchQuery('');
    setPage(1);
  };

  const handleClearAll = () => {
    setSearchInput('');
    setAppliedSearchQuery('');
    setSelectedCuisineChip('All');
    setStatusFilter('all');
    setSelectedCuisines([]);
    setPage(1);
    setSortBy('Relevance');
  };

  return (
    <div className="w-full max-w-full mx-auto py-2 sm:py-6 space-y-4 sm:space-y-6 relative overflow-x-clip">

      <div className="hidden sm:block absolute top-0 right-0 w-[500px] h-[500px] bg-[#FF5200]/5 rounded-full blur-[100px] pointer-events-none -z-10 translate-x-1/3 -translate-y-1/4"></div>
      <div className="hidden sm:block absolute top-10 right-[20%] w-[300px] h-[300px] bg-orange-200/20 rounded-full blur-[80px] pointer-events-none -z-10"></div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 relative z-10">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Restaurants
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
            Discover active top-rated restaurants near you
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl self-start sm:self-auto max-w-full overflow-x-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'open', label: 'Open Now' },
            { id: 'closed', label: 'Closed' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => {
                setStatusFilter(st.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === st.id
                  ? 'bg-white text-[#FF5200] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full">
        <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center">
          <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search restaurants, cuisines..."
            className="w-full pl-10 sm:pl-11 pr-24 sm:pr-32 py-3 sm:py-3.5 bg-white border border-gray-200/90 rounded-2xl text-xs sm:text-base text-gray-900 placeholder-gray-400 shadow-xs focus:outline-none focus:border-[#FF5200] focus:ring-1 focus:ring-[#FF5200] transition-all"
          />
          <div className="absolute right-1.5 sm:right-2 flex items-center gap-1 sm:gap-1.5">
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="p-1 sm:p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                title="Clear search"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}
            <button
              type="submit"
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#FF5200] hover:bg-[#E04800] text-white text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs hover:shadow active:scale-95 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 hidden sm:inline" />
              <span>Search</span>
            </button>
          </div>
        </form>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full min-w-0">

        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1 w-full min-w-0">
          {cuisineChips.map((chip) => {
            const isSelected = selectedCuisineChip === chip;
            return (
              <button
                key={chip}
                onClick={() => {
                  setSelectedCuisineChip(chip);
                  setSelectedCuisines(chip === 'All' ? [] : [chip]);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-[#FF5200] text-white border border-[#FF5200]'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-orange-50'
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-2 shrink-0 self-end sm:self-auto">
          <div className="flex items-center space-x-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-xl text-xs sm:text-sm">
            <span className="text-gray-500 font-medium whitespace-nowrap">Sort by</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="bg-transparent font-bold text-gray-900 focus:outline-none cursor-pointer pr-1"
            >
              <option value="Relevance">Relevance</option>
              <option value="Rating High→Low">Rating High→Low</option>
              <option value="Rating Low→High">Rating Low→High</option>
            </select>
          </div>
        </div>

      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between text-red-700 text-sm font-medium">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchRestaurants}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      <div className="space-y-6 w-full">

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-5 w-full">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="w-full">
                  <RestaurantCardSkeleton />
                </div>
              ))}
            </div>
          ) : restaurantsList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-5 w-full">
              {restaurantsList.map((res) => (
                <RestaurantCard key={res.id} restaurant={res} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl py-8 px-4 text-center border border-gray-100 shadow-xs flex flex-col items-center justify-center gap-3">
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900">No restaurants found</h3>
              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center px-5 py-2.5 bg-[#FF5200] text-white font-bold text-xs rounded-xl shadow-xs hover:bg-[#E04800] transition-colors cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {!isLoading && pagination.totalPages > 1 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs mt-6">
              <div className="text-xs sm:text-sm font-semibold text-gray-600 text-center sm:text-left">
                Page <span className="font-bold text-gray-900">{pagination.page}</span> of{' '}
                <span className="font-bold text-gray-900">{pagination.totalPages}</span> ({pagination.total} total active restaurants)
              </div>

              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => {
                    setPage((prev) => Math.max(prev - 1, 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold border border-gray-200 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center space-x-1 cursor-pointer transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar max-w-[180px] sm:max-w-none">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setPage(p);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-xs font-bold flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                        page === p
                          ? 'bg-[#FF5200] text-white shadow-xs'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={page >= pagination.totalPages}
                  onClick={() => {
                    setPage((prev) => Math.min(prev + 1, pagination.totalPages));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold border border-gray-200 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center space-x-1 cursor-pointer transition-all"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
    </div>
  );
};
