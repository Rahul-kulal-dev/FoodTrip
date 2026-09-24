import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

export const HeroBanner = () => {
  const { searchQuery, setSearchQuery } = useCart();
  const navigate = useNavigate();

  const slidesCount = 3;
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 50;

  const nextSlide = () => {
    if (currentIndex >= slidesCount + 1) return;
    if (!isTransitioning) setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  };

  const prevSlide = () => {
    if (currentIndex <= 0) return;
    if (!isTransitioning) setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
  };

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused, currentIndex, isTransitioning]);

  useEffect(() => {
    if (!isTransitioning) {
      const timer = setTimeout(() => {
        setIsTransitioning(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);

  const handleTransitionEnd = () => {
    if (currentIndex === 0) {
      setIsTransitioning(false);
      setCurrentIndex(slidesCount);
    } else if (currentIndex === slidesCount + 1) {
      setIsTransitioning(false);
      setCurrentIndex(1);
    }
  };

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      nextSlide();
    }
    if (isRightSwipe) {
      prevSlide();
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/restaurants-list?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/restaurants-list');
    }
  };

  const renderSearchBar = (className) => (
    <form onSubmit={handleSearch} className={`flex items-center bg-white rounded-full p-1 md:p-2 shadow-[0_8px_30px_rgb(0,0,0,0.08)] w-full max-w-[480px] md:max-w-[580px] h-[48px] md:h-[70px] mx-auto md:mx-0 z-20 ${className}`}>
      <Search className="text-gray-400 w-4.5 h-4.5 md:w-5 md:h-5 ml-2 md:ml-4 flex-shrink-0" />

      <div className="flex-1 flex items-center h-full pl-2 md:pl-3 pr-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search food or restaurants..."
          className="w-full h-full bg-transparent text-[13.5px] md:text-[16px] text-gray-800 placeholder-[#6B7280] focus:outline-none"
        />
      </div>

      <button type="submit" className="h-full bg-[#FB501A] hover:bg-[#E04412] text-white font-[600] px-4.5 md:px-8 text-[13.5px] md:text-[16px] rounded-full transition-all shrink-0 ml-1 flex items-center gap-1.5 md:gap-2 shadow-sm hover:shadow-md cursor-pointer">
        <span className="md:hidden">Search</span>
        <span className="hidden md:inline">Find Food</span>
        <svg className="w-4 h-4 hidden md:inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
      </button>
    </form>
  );

  const slideData = [
    {
      id: 0,
      bg: "bg-[#f85c24ff] md:bg-gradient-to-r md:from-[#FEEDDB] md:via-[#FEEDDB] md:to-[#FFD5BF]",
      webp: "/circlePlat1.webp",
      img: "/circlePlat1.png",
      imgAlt: "Delicious Salmon Dish",
      imgClass: "scale-[1.0] sm:scale-[1.05] translate-x-1 sm:translate-x-1.5 drop-shadow-[0_20px_30px_rgba(0,0,0,0.25)] relative z-20",
      imgDesktopClass: "scale-[1.24] lg:scale-[1.38] xl:scale-[1.45] origin-center -translate-x-5 lg:-translate-x-7 xl:-translate-x-8 drop-shadow-[0_35px_50px_rgba(0,0,0,0.25)] relative z-20",
      title: (
        <div className="flex flex-col relative z-20 items-center md:items-start">
          <span className="text-[#FFE270] md:text-[#374151] font-[700] md:font-[700] tracking-[0.2em] sm:tracking-[0.22em] text-[9.5px] min-[360px]:text-[10.5px] md:text-[13px] uppercase mb-2 md:mb-4 w-full flex items-center justify-center md:justify-start whitespace-nowrap">
            GOOD FOOD <span className="text-white md:text-[#FB501A] mx-2 text-[13px] md:text-[14px] leading-none">•</span> GREAT PLACES <span className="text-white md:text-[#FB501A] mx-2 text-[13px] md:text-[14px] leading-none">•</span> HAPPY YOU
          </span>
          <h1 className="text-white md:text-[#0B1521] text-[29px] sm:text-[38px] md:text-[72px] lg:text-[80px] xl:text-[84px] font-extrabold tracking-[-0.02em] leading-[1.08] mb-2.5 md:mb-6">
            Order your{' '}
            <br className="hidden md:block" />
            <span className="relative inline-block text-white md:text-[#FB501A] mt-0.5 md:mt-2 ml-1 sm:ml-1.5 md:ml-0 mr-1.5 md:mr-0">
              favourite
              <svg className="absolute -bottom-1.5 md:-bottom-3 left-0 w-full h-[7px] md:h-[12px] opacity-90" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0,8 Q50,0 100,8" fill="none" className="stroke-[#FFE270] md:stroke-[#FB501A]" strokeWidth="4" strokeLinecap="round" />
              </svg>

            </span>{' '}
            <br className="hidden md:block" />
            <span className="relative inline-block text-white md:text-[#0B1521] mt-0.5 md:mt-2">
              food here
            </span>
          </h1>
        </div>
      ),
      desc: <p className="text-white/95 md:text-[#4B5563] text-[13px] sm:text-[14px] md:text-[18px] font-medium leading-snug md:leading-relaxed max-w-[500px] mb-3 md:mb-10 px-3 md:px-0 mx-auto md:mx-0 relative z-20">Choose from a diverse menu featuring a delectable array of dishes crafted with the finest ingredients.</p>,
      circles: false,
      decorations: (
        <>
          <svg className="hidden md:block absolute top-[-10%] right-[-5%] w-full md:w-[65%] h-[120%] pointer-events-none opacity-95 z-0" viewBox="0 0 500 500" preserveAspectRatio="xMidYMid slice">
            <path d="M350,-50 C500,0 550,200 450,400 C350,600 150,500 50,350 C-50,200 200,-100 350,-50 Z" fill="#FF6428" />
          </svg>

          <div className="absolute top-[10%] right-[44%] lg:right-[40%] animate-[bounce_4s_infinite] drop-shadow-xl z-30 hidden md:block">
            <div className="w-7 h-7 bg-[#E3352F] rounded-full border-2 border-[#ff7878] shadow-[inset_0_-3px_6px_rgba(0,0,0,0.3)]">
              <div className="w-2 h-2 bg-white/60 rounded-full ml-1 mt-1 blur-[1px]"></div>
            </div>
          </div>

          <div className="absolute top-[16%] right-[14%] lg:right-[11%] animate-[bounce_4.5s_infinite_reverse] drop-shadow-xl z-30 hidden md:block">
            <div className="w-6 h-6 bg-[#E3352F] rounded-full border border-[#ff7878] shadow-[inset_0_-2px_4px_rgba(0,0,0,0.3)]">
              <div className="w-1.5 h-1.5 bg-white/60 rounded-full ml-1 mt-0.5 blur-[1px]"></div>
            </div>
          </div>
        </>
      )
    },
    {
      id: 1,
      bg: "bg-[#EAC963] md:bg-gradient-to-r md:from-[#FFF4B8] md:via-[#FFF4B8] md:to-[#FDE8A2]",
      webp: "/circlePlat2.webp",
      img: "/circlePlat2.png",
      imgAlt: "Delicious Pasta",
      imgClass: "scale-[1.0] -translate-x-1 sm:-translate-x-1.5 drop-shadow-[0_20px_30px_rgba(0,0,0,0.25)] relative z-20",
      imgDesktopClass: "scale-[1.24] lg:scale-[1.38] xl:scale-[1.45] origin-center -translate-x-5 lg:-translate-x-7 xl:-translate-x-8 drop-shadow-[0_35px_50px_rgba(0,0,0,0.25)] relative z-20",
      title: (
        <div className="flex flex-col relative z-20 items-center md:items-start">
          <span className="text-[#374151] font-[700] tracking-[0.2em] sm:tracking-[0.22em] text-[9.5px] min-[360px]:text-[10.5px] md:text-[13px] uppercase mb-2 md:mb-4 w-full flex items-center justify-center md:justify-start whitespace-nowrap">
            GOOD FOOD <span className="text-[#FB501A] mx-2 text-[13px] md:text-[14px] leading-none">•</span> GREAT PLACES <span className="text-[#FB501A] mx-2 text-[13px] md:text-[14px] leading-none">•</span> HAPPY YOU
          </span>
          <h1 className="text-[#0B1521] text-[29px] sm:text-[38px] md:text-[62px] lg:text-[72px] xl:text-[78px] font-extrabold tracking-[-0.02em] leading-[1.08] mb-2.5 md:mb-6">
            <span className="md:whitespace-nowrap">Explore cuisines</span>{' '}
            <br className="hidden md:block" />
            <span className="md:whitespace-nowrap">from around</span>{' '}
            <br className="hidden md:block" />
            <span className="md:whitespace-nowrap">
              the{' '}
              <span className="relative inline-block text-[#FB501A] mt-0.5 md:mt-2">
                world
                <svg className="absolute -bottom-1.5 md:-bottom-3 left-0 w-full h-[7px] md:h-[12px] opacity-90" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0,8 Q50,0 100,8" fill="none" stroke="#FB501A" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
            </span>
          </h1>
        </div>
      ),
      desc: <p className="text-[#4B5563] text-[13px] sm:text-[14px] md:text-[17px] font-medium leading-snug md:leading-relaxed max-w-[460px] lg:max-w-[500px] mb-3 md:mb-8 px-3 md:px-0 mx-auto md:mx-0 relative z-20">Discover new tastes, popular restaurants, and amazing dishes all in one place.</p>,
      circles: false,
      decorations: (
        <>
          <svg className="hidden md:block absolute top-[-10%] right-[-5%] w-full md:w-[65%] h-[120%] pointer-events-none opacity-90 z-0" viewBox="0 0 500 500" preserveAspectRatio="xMidYMid slice">
            <path d="M350,-50 C500,0 550,200 450,400 C350,600 150,500 50,350 C-50,200 200,-100 350,-50 Z" fill="#F3CE5D" />
          </svg>
        </>
      )
    },
    {
      id: 2,
      bg: "bg-[#C5E8C2] md:bg-gradient-to-r md:from-[#EEF8EE] md:via-[#EEF8EE] md:to-[#D7F0D8]",
      webp: "/circlePlat3.webp",
      img: "/circlePlat3.png",
      imgAlt: "Fresh and Healthy Salad",
      imgClass: "scale-[1.0] -translate-x-3 sm:-translate-x-4 drop-shadow-[0_20px_35px_rgba(0,0,0,0.18)] relative z-20",
      imgDesktopClass: "scale-[1.20] lg:scale-[1.35] xl:scale-[1.42] origin-center -translate-x-6 lg:-translate-x-8 xl:-translate-x-10 drop-shadow-[0_35px_50px_rgba(0,0,0,0.22)] relative z-20",
      title: (
        <div className="flex flex-col relative z-20 items-center md:items-start">
          <span className="text-[#234D2E] font-[800] tracking-[0.15em] sm:tracking-[0.2em] md:tracking-[0.25em] text-[9px] min-[360px]:text-[10px] md:text-[12px] uppercase mb-2 md:mb-4 w-full flex items-center justify-center md:justify-start whitespace-nowrap">
            WHOLESOME <span className="text-[#3E7B49] mx-1.5 sm:mx-2 text-[11px] md:text-[14px] leading-none">•</span> DELICIOUS <span className="text-[#3E7B49] mx-1.5 sm:mx-2 text-[11px] md:text-[14px] leading-none">•</span> NUTRITIOUS
          </span>
          <h1 className="text-[#0F1D13] text-[29px] sm:text-[38px] md:text-[72px] lg:text-[80px] xl:text-[84px] font-extrabold tracking-[-0.02em] leading-[1.08] mb-2.5 md:mb-6">
            Fresh and{' '}
            <br className="hidden md:block" />
            <span className="relative inline-block text-[#16A34A] mr-1.5 md:mr-3.5 mt-0.5 md:mt-2">
              Healthy
              <svg className="absolute -bottom-1.5 md:-bottom-2.5 left-0 w-full h-[7px] md:h-[12px] opacity-90" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0,8 Q50,0 100,8" fill="none" stroke="#22C55E" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </span>{' '}
            <span className="relative inline-block text-[#0F1D13] mt-0.5 md:mt-2">
              Meals
            </span>
          </h1>
        </div>
      ),
      desc: (
        <p className="text-[#3D5A42] text-[13px] sm:text-[14px] md:text-[18px] font-medium leading-snug md:leading-relaxed max-w-[500px] mb-3 md:mb-7 px-3 md:px-0 mx-auto md:mx-0 relative z-20">
          Wholesome ingredients, delicious flavours, made for a better you.
        </p>
      ),
      circles: false,
      decorations: (
        <>
          <svg className="hidden md:block absolute top-[-10%] right-[-5%] w-full md:w-[65%] h-[120%] pointer-events-none opacity-85 z-0" viewBox="0 0 500 500" preserveAspectRatio="xMidYMid slice">
            <path d="M350,-50 C500,0 550,200 450,400 C350,600 150,500 50,350 C-50,200 200,-100 350,-50 Z" fill="#C5E8C2" />
          </svg>
          <svg className="absolute bottom-[-15%] left-[-10%] hidden md:block w-[45%] h-[60%] pointer-events-none opacity-40 z-0" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
            <path d="M200,0 C300,0 400,100 350,250 C300,400 100,450 50,300 C0,150 100,0 200,0 Z" fill="#D7F1D4" />
          </svg>

          <div className="absolute top-[14%] left-[6%] w-2 h-2 rounded-full bg-emerald-600/15 blur-[0.5px]"></div>
          <div className="absolute top-[32%] left-[45%] w-2.5 h-2.5 rounded-full bg-emerald-700/10 blur-[0.5px]"></div>
          <div className="absolute bottom-[25%] left-[10%] w-2 h-2 rounded-full bg-emerald-600/15 blur-[0.5px]"></div>
          <div className="absolute top-[48%] left-[4%] w-3 h-3 rounded-full bg-emerald-500/10 blur-[1px]"></div>
          <div className="absolute bottom-[12%] left-[28%] w-1.5 h-1.5 rounded-full bg-emerald-700/15 blur-[0.5px]"></div>
        </>
      )
    }
  ];

  const renderSlide = (slide, key) => (
    <div key={key} className={`w-full shrink-0 relative ${slide.bg} flex flex-col md:flex-row p-3 sm:p-4 md:p-0 overflow-hidden`}>
      {slide.circles && (
        <>
          <div className="absolute top-[-20%] left-[-10%] w-[300px] h-[300px] md:w-[600px] md:h-[600px] rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-[-20%] right-[10%] w-[250px] h-[250px] md:w-[500px] md:h-[500px] rounded-full bg-black/10 blur-3xl pointer-events-none"></div>
        </>
      )}
      {slide.decorations && slide.decorations}

      <div className="flex flex-col md:flex-col w-full md:w-[55%] items-center md:items-start justify-center relative z-40 md:p-6 md:pl-12 lg:pl-20 md:py-10 md:h-full gap-2 sm:gap-3.5 md:gap-0 flex-1">

        <div className="w-full flex md:hidden items-center justify-center text-center z-10 mt-2 sm:mt-4 md:mt-0 h-[190px] sm:h-[220px]">
          <picture className="h-full flex items-center justify-center">
            {slide.webp && <source srcSet={slide.webp} type="image/webp" />}
            <img
              src={slide.img}
              alt={slide.imgAlt}
              className={`mx-auto block w-auto h-full max-w-[265px] sm:max-w-[305px] max-h-[190px] sm:max-h-[220px] object-contain drop-shadow-[0_28px_30px_rgba(0,0,0,0.62)] ${slide.imgClass}`}
            />
          </picture>
        </div>

        <div className="w-full md:w-full flex flex-col justify-center text-center md:text-left">
          {slide.title}
          {slide.desc}
          {renderSearchBar("hidden md:flex")}
        </div>
      </div>

      <div className="hidden md:flex w-[50%] lg:w-[45%] relative h-full items-center justify-center lg:justify-end lg:pr-4 z-10">
        <picture className="w-full h-full flex items-center justify-center">
          {slide.webp && <source srcSet={slide.webp} type="image/webp" />}
          <img
            src={slide.img}
            alt={slide.imgAlt}
            className={`w-full h-full object-contain drop-shadow-[0_45px_45px_rgba(0,0,0,0.75)] ${slide.imgDesktopClass}`}
          />
        </picture>
      </div>

      <div className="flex md:hidden w-full relative z-20 mt-auto pb-5 px-3">
        {renderSearchBar("w-full")}
      </div>
    </div>
  );

  const slidesToRender = [
    renderSlide(slideData[2], "clone-last"),
    renderSlide(slideData[1], "slide-0"),
    renderSlide(slideData[0], "slide-1"),
    renderSlide(slideData[2], "slide-2"),
    renderSlide(slideData[1], "clone-first"),
  ];

  const handleDotClick = (index) => {
    if (!isTransitioning) setIsTransitioning(true);
    setCurrentIndex(index + 1);
  };

  return (
    <div className="w-full max-w-[97%] sm:max-w-full mx-auto mb-6 md:mb-8 px-0">
      <section
        className="relative w-full h-auto md:h-[600px] lg:h-[650px] rounded-[16px] md:rounded-[18px] overflow-hidden shadow-lg font-system"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={`flex h-full w-full items-stretch ${isTransitioning ? 'transition-transform duration-500 ease-in-out' : ''}`}
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          onTransitionEnd={handleTransitionEnd}
        >
          {slidesToRender}
        </div>

        <button
          onClick={prevSlide}
          className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md z-30 transition-colors opacity-0 md:opacity-100 group-hover:opacity-100 focus:opacity-100 hidden md:flex"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6 text-gray-800" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md z-30 transition-colors opacity-0 md:opacity-100 group-hover:opacity-100 focus:opacity-100 hidden md:flex"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6 text-gray-800" />
        </button>

        <div className="absolute bottom-2.5 md:bottom-6 left-1/2 -translate-x-1/2 flex items-center space-x-1.5 md:space-x-2 z-30">
          {[0, 1, 2].map((index) => {
            const isActive =
              currentIndex === index + 1 ||
              (currentIndex === 0 && index === 2) ||
              (currentIndex === slidesCount + 1 && index === 0);

            return (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-all duration-300 cursor-pointer ${isActive
                  ? 'bg-[#FB501A] w-6 md:w-8'
                  : 'bg-white hover:bg-gray-100'
                  }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            );
          })}
        </div>

      </section>
    </div>
  );
};
