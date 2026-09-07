import React from 'react';

export const PanelLoading = ({ message = 'Loading...', fullPage = true }) => {
  if (!fullPage) {
    return (
      <div className="text-center py-12 text-[#6B7280] text-[14px] font-[500] flex flex-col items-center">
        <div className="w-8 h-8 border-[3px] border-[#FF4B2B] border-t-transparent rounded-full animate-spin mb-3" />
        <span className="font-poppins">{message}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh] py-16 font-poppins text-center select-none">
      <div className="w-8 h-8 sm:w-9 sm:h-9 border-[3px] border-[#FF4B2B] border-t-transparent rounded-full animate-spin mb-3.5" />
      <p className="text-[14px] font-[500] text-[#6B7280] tracking-tight">{message}</p>
    </div>
  );
};

export default PanelLoading;
