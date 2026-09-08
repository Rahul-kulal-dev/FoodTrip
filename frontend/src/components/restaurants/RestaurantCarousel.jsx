import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { RestaurantCard } from './RestaurantCard';

export const RestaurantCardSkeleton = () => (
  <div className="w-full relative rounded-[20px] md:rounded-[24px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)] bg-white font-poppins border border-gray-100/90 select-none">
    <div className="flex md:hidden flex-row items-center gap-2.5 min-[380px]:gap-3 p-2.5 min-[380px]:p-3 h-[142px] min-[380px]:h-[150px] sm:h-[158px] w-full min-w-0">
      <div className="relative w-[105px] min-[380px]:w-[120px] sm:w-[130px] h-full rounded-[14px] min-[380px]:rounded-[16px] sm:rounded-[18px] overflow-hidden bg-gradient-to-r from-gray-100 via-gray-200/70 to-gray-100 shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer pointer-events-none" />
        <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-md px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs border border-white/60 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-300 animate-pulse" />
          <span className="w-8 h-2 rounded bg-gray-200 animate-pulse" />
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between min-w-0 h-full py-0.5 overflow-hidden">
        <div>
          <div className="flex items-center gap-2 overflow-hidden min-w-0">
            <div className="w-8 h-8 min-[380px]:w-9 min-[380px]:h-9 rounded-full bg-gradient-to-br from-orange-100 to-gray-200 shrink-0 animate-pulse border border-[#FF4B2B]/10" />

            <div className="flex flex-col min-w-0 flex-1 gap-1.5">
              <div className="h-[14px] bg-gray-200 rounded-md w-3/4 max-w-[130px] animate-pulse" />
              <div className="h-[10px] bg-gray-100 rounded-md w-1/2 max-w-[90px] animate-pulse" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-2 text-[10.5px] min-[380px]:text-[11px] text-gray-500 whitespace-nowrap overflow-hidden">
            <div className="h-[18px] w-14 bg-amber-50 rounded-md animate-pulse" />
            <span className="text-gray-300">•</span>
            <div className="h-[14px] w-14 bg-gray-100 rounded animate-pulse" />
            <span className="text-gray-300">•</span>
            <div className="h-[14px] w-10 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>

        <div className="flex items-center gap-1 mt-1 pt-1.5 border-t border-gray-100 overflow-hidden whitespace-nowrap">
          <div className="h-[19px] w-14 bg-gray-50 rounded-full border border-gray-100 animate-pulse shrink-0" />
          <div className="h-[19px] w-12 bg-gray-50 rounded-full border border-gray-100 animate-pulse shrink-0" />
          <div className="h-[19px] w-16 bg-gray-50 rounded-full border border-gray-100 animate-pulse shrink-0" />
        </div>
      </div>
    </div>

    <div className="hidden md:flex flex-col">
      <div className="h-[200px] md:h-[240px] w-full bg-gradient-to-r from-gray-100 via-gray-200/80 to-gray-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer pointer-events-none" />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-orange-300 animate-pulse" />
          <span className="w-12 h-2.5 rounded-full bg-gray-200 animate-pulse" />
        </div>
      </div>

      <div className="bg-white relative -mt-4 md:-mt-6 p-4 md:p-5 flex-1 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-orange-100 to-gray-200 shrink-0 animate-pulse" />
            <div className="flex flex-col gap-2 flex-1 min-w-0 pr-2">
              <div className="h-4 bg-gray-200 rounded-md w-3/4 max-w-[150px] animate-pulse" />
              <div className="h-3 bg-gray-100 rounded-md w-1/2 max-w-[100px] animate-pulse" />
            </div>
          </div>
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-gray-100 shrink-0 ml-3 animate-pulse" />
        </div>

        <div className="flex items-center gap-2 md:gap-3 mt-4 text-[10px] md:text-[12px]">
          <div className="h-3 w-14 bg-gray-200 rounded animate-pulse" />
          <span className="text-gray-300">•</span>
          <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
          <span className="text-gray-300">•</span>
          <div className="h-3 w-12 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);

export const RestaurantCarousel = ({
  restaurants = [],
  loading = false,
  loadingMore = false,
  hasMore = false,
  onLoadMore,
}) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const getCardStep = useCallback(() => {
    if (!scrollRef.current) return 0;
    const firstCard = scrollRef.current.querySelector('.carousel-card-item');
    if (firstCard) {
      const rect = firstCard.getBoundingClientRect();
      return rect.width + 16;
    }
    return (scrollRef.current.clientWidth - 32) / 3 + 16;
  }, []);

  const updateScrollBounds = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 6);
    const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 6;
    setCanScrollRight(!isAtEnd);
  }, []);

  const scrollLeft = () => {
    if (!scrollRef.current) return;
    const step = getCardStep();
    if (step <= 0) return;

    const currentScroll = scrollRef.current.scrollLeft;
    const targetScroll = Math.max(0, currentScroll - step);
    scrollRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
  };

  const scrollRight = () => {
    if (!scrollRef.current) return;
    const step = getCardStep();
    if (step <= 0) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const remainingScroll = scrollWidth - (scrollLeft + clientWidth);

    if (remainingScroll <= step + 12 && hasMore && onLoadMore && !loadingMore && !loading) {
      onLoadMore();
    }

    if (loadingMore && remainingScroll <= 6) {
      return;
    }

    const targetScroll = Math.min(scrollLeft + step, scrollWidth - clientWidth);
    scrollRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
  };

  useEffect(() => {
    updateScrollBounds();
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      updateScrollBounds();
      if (!scrollRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const remainingScroll = scrollWidth - (scrollLeft + clientWidth);
      if (remainingScroll <= 12 && hasMore && onLoadMore && !loadingMore && !loading) {
        onLoadMore();
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateScrollBounds);
    const timer = setTimeout(updateScrollBounds, 250);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateScrollBounds);
      clearTimeout(timer);
    };
  }, [restaurants, hasMore, loadingMore, loading, onLoadMore, updateScrollBounds]);

  const handleMobileLoadMore = (e) => {
    if (e) e.preventDefault();
    if (loadingMore || loading || !hasMore) return;
    if (onLoadMore) {
      onLoadMore();
    }
  };

  return (
    <div className="w-full relative">
      <div className="hidden md:block relative group">
        <button
          type="button"
          onClick={scrollLeft}
          disabled={!canScrollLeft || loading}
          aria-label="Previous card"
          className={`absolute -left-3.5 sm:-left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/95 hover:bg-white border border-gray-200/90 rounded-full flex items-center justify-center shadow-md text-gray-700 hover:text-[#FF4B2B] hover:border-[#FF4B2B] transition-all duration-200 cursor-pointer disabled:opacity-0 disabled:pointer-events-none ${
            canScrollLeft && !loading ? 'opacity-100 hover:scale-105' : 'opacity-0 pointer-events-none'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div
          ref={scrollRef}
          className="flex overflow-x-auto gap-4 scroll-smooth snap-x snap-mandatory scrollbar-hide py-2"
          style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
        >
          {loading ? (
            [0, 1, 2].map((sIdx) => (
              <div
                key={`initial-skel-d-${sIdx}`}
                className="carousel-card-item shrink-0 snap-start w-[calc((100%-32px)/3)]"
                style={{ width: 'calc((100% - 32px) / 3)' }}
              >
                <RestaurantCardSkeleton />
              </div>
            ))
          ) : (
            <>
              {restaurants.map((restaurant, idx) => (
                <div
                  key={restaurant._id || restaurant.id || `rest-${idx}`}
                  className="carousel-card-item shrink-0 snap-start w-[calc((100%-32px)/3)] animate-fade-in"
                  style={{ width: 'calc((100% - 32px) / 3)' }}
                >
                  <RestaurantCard restaurant={restaurant} />
                </div>
              ))}

              {hasMore && (
                <div
                  key="incoming-card-skeleton"
                  className="carousel-card-item shrink-0 snap-start w-[calc((100%-32px)/3)]"
                  style={{ width: 'calc((100% - 32px) / 3)' }}
                >
                  <RestaurantCardSkeleton />
                </div>
              )}
            </>
          )}
        </div>

        <button
          type="button"
          onClick={scrollRight}
          disabled={!canScrollRight || loading || (loadingMore && !canScrollRight)}
          aria-label="Next card"
          className={`absolute -right-3.5 sm:-right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/95 hover:bg-white border border-gray-200/90 rounded-full flex items-center justify-center shadow-md text-gray-700 hover:text-[#FF4B2B] hover:border-[#FF4B2B] transition-all duration-200 cursor-pointer disabled:opacity-0 disabled:pointer-events-none ${
            canScrollRight && !loading ? 'opacity-100 hover:scale-105' : 'opacity-0 pointer-events-none'
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="md:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
          {loading ? (
            [0, 1, 2].map((sIdx) => (
              <div key={`init-skel-m-${sIdx}`} className="w-full">
                <RestaurantCardSkeleton />
              </div>
            ))
          ) : (
            <>
              {restaurants.map((restaurant, idx) => (
                <div
                  key={restaurant._id || restaurant.id || `rest-m-${idx}`}
                  className="w-full animate-fade-in"
                >
                  <RestaurantCard restaurant={restaurant} />
                </div>
              ))}

              {loadingMore && (
                <>
                  {[0, 1, 2].map((sIdx) => (
                    <div
                      key={`incoming-skel-batch-${sIdx}`}
                      className="w-full animate-fade-in"
                    >
                      <RestaurantCardSkeleton />
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>

        {hasMore && !loading && (
          <div className="flex justify-center mt-6">
            <button
              type="button"
              onClick={handleMobileLoadMore}
              disabled={loadingMore}
              className="px-8 py-2.5 bg-white border border-[#FF4B2B] text-[#FF4B2B] hover:bg-[#FF4B2B] hover:text-white rounded-[10px] font-poppins font-[600] text-[14px] transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2 shadow-xs active:scale-98"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#FF4B2B]" />
                  <span>Loading...</span>
                </>
              ) : (
                <span>Load More</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
