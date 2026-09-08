import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../common/Navbar';
import { Footer } from '../common/Footer';
import { CartDrawer } from '../cart/CartDrawer';
import { MobileNavBar } from '../common/MobileNavBar';

export const CustomerLayout = () => {
  const location = useLocation();
  const isCheckoutPage = location.pathname === '/checkout';
  const isCartPage = location.pathname === '/cart';
  const hideFooter = isCheckoutPage || isCartPage;

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-gray-900 flex flex-col antialiased selection:bg-orange-500/20 selection:text-orange-700 w-full overflow-x-clip">
      <Navbar />
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 pt-4 pb-[90px] md:pb-16 overflow-x-clip">
        <Outlet />
      </main>
      {!hideFooter && <Footer />}
      <MobileNavBar />
      <CartDrawer />
    </div>
  );
};

