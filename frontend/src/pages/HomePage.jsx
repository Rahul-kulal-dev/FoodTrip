import React from 'react';
import { HeroBanner } from '../components/hero/HeroBanner';
import { CuisineSection } from '../components/cuisines/CuisineSection';
import { RestaurantSection } from '../components/restaurants/RestaurantSection';
import { NearestRestaurantsSection } from '../components/restaurants/NearestRestaurantsSection';
import { NewRestaurantsSection } from '../components/restaurants/TopRatedRestaurantsSection';

export const HomePage = () => {
  return (
    <div className="w-full space-y-[24px]">
      <HeroBanner />

      <CuisineSection />

      <RestaurantSection />

      <NearestRestaurantsSection />

      <NewRestaurantsSection />
    </div>
  );
};
