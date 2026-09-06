import React from 'react';
import { useNavigate } from 'react-router-dom';

export const CuisineCard = ({ cuisine }) => {
  const navigate = useNavigate();

  return (
    <div 
      className="flex flex-col items-center justify-start cursor-pointer group w-full h-full transition-all duration-300"
      onClick={() => navigate('/restaurants-list', { state: { cuisine: cuisine.name } })}
    >
      <div className={`w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] md:w-[135px] md:h-[135px] rounded-full overflow-hidden mb-3 shadow-[0_6px_16px_rgba(0,0,0,0.06)] relative flex items-center justify-center p-2.5 sm:p-3 md:p-4 transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.12)] ${cuisine.bgColor}`}>
        <img 
          src={cuisine.image} 
          alt={cuisine.name} 
          className="w-full h-full object-cover rounded-full transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <span className="text-[12px] sm:text-[14px] font-[700] text-[#0B132A] text-center leading-tight transition-colors duration-300 group-hover:text-[#FF5A1F]">
        {cuisine.name}
      </span>
    </div>
  );
};
