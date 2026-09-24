import React from 'react';
import { Link } from 'react-router-dom';

const FoodTripLogoIcon = () => (
  <img src="/FoodTrip.png" alt="FoodTrip Logo" className="w-10 h-10 object-contain" />
);

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100 py-8 mt-auto">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <Link to="/" className="flex items-center space-x-2.5 cursor-pointer">
          <FoodTripLogoIcon />
          <span className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Food<span className="text-[#FF4B2B]">Trip.</span>
          </span>
        </Link>

        <div className="flex items-center space-x-6 sm:space-x-8 text-sm font-semibold text-gray-600">
          <a href="#about" className="hover:text-gray-900 transition-colors">
            About
          </a>
          <a href="#contact" className="hover:text-gray-900 transition-colors">
            Contact
          </a>
          <a href="#privacy" className="hover:text-gray-900 transition-colors">
            Privacy Policy
          </a>
          <a href="#terms" className="hover:text-gray-900 transition-colors">
            Terms of Service
          </a>
        </div>
      </div>
    </footer>
  );
};
