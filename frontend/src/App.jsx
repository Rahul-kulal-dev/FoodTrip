import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';

import { CustomerLayout } from './components/layout/CustomerLayout';

import { HomePage } from './pages/HomePage';
import { SignUpPage } from './pages/SignUpPage';
import { SignInPage } from './pages/SignInPage';
import { RestaurantListPage } from './pages/RestaurantListPage';
import { RestaurantDetailsPage } from './pages/RestaurantDetailsPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrdersPage } from './pages/OrdersPage';
import { CustomerProfilePage } from './pages/CustomerProfilePage';
import { RestaurantRegisterPage } from './pages/RestaurantRegisterPage';

import { AdminApp, AdminDashboard } from './pages/admin/AdminApp';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminRestaurantsPage } from './pages/admin/AdminRestaurantsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminPendingVerificationPage } from './pages/admin/AdminPendingVerificationPage';
import { AdminFoodItemsPage } from './pages/admin/AdminFoodItemsPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminProfilePage } from './pages/admin/AdminProfilePage';

import { RestaurantApp, RestaurantDashboard, RestaurantOrdersPage, RestaurantMenuPage, RestaurantProfilePage, RestaurantVerificationPage } from './pages/restaurant/RestaurantApp';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
          <BrowserRouter>
          <Routes>
            <Route path="/login" element={<SignInPage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/register" element={<SignUpPage />} />
            <Route path="/restaurant-register" element={<RestaurantRegisterPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin-login" element={<AdminLoginPage />} />

            <Route element={<CustomerLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/restaurants-list" element={<RestaurantListPage />} />
              <Route path="/restaurant-details" element={<RestaurantDetailsPage />} />
              <Route path="/restaurant/:id" element={<RestaurantDetailsPage />} />
              <Route path="/cart" element={<CartPage />} />

              <Route path="/checkout" element={<ProtectedRoute allowedRoles={['Customer', 'CUSTOMER', 'ROLE_USER']}><CheckoutPage /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute allowedRoles={['Customer', 'CUSTOMER', 'ROLE_USER']}><OrdersPage /></ProtectedRoute>} />
              <Route path="/track-order" element={<ProtectedRoute allowedRoles={['Customer', 'CUSTOMER', 'ROLE_USER']}><OrdersPage /></ProtectedRoute>} />
              <Route path="/orders/track" element={<ProtectedRoute allowedRoles={['Customer', 'CUSTOMER', 'ROLE_USER']}><OrdersPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute allowedRoles={['Customer', 'CUSTOMER', 'ROLE_USER']}><CustomerProfilePage /></ProtectedRoute>} />
            </Route>

            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'ROLE_ADMIN']}>
                <AdminApp />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="pending-verification" element={<AdminPendingVerificationPage />} />
              <Route path="restaurants" element={<AdminRestaurantsPage />} />
              <Route path="food-items" element={<AdminFoodItemsPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="profile" element={<AdminProfilePage />} />
            </Route>

            <Route path="/restaurant-panel" element={
              <ProtectedRoute allowedRoles={['Restaurant', 'RESTAURANT', 'ROLE_RESTAURANT']}>
                <RestaurantApp />
              </ProtectedRoute>
            }>
              <Route index element={<RestaurantDashboard />} />
              <Route path="verification" element={<RestaurantVerificationPage />} />
              <Route path="orders" element={<RestaurantOrdersPage />} />
              <Route path="menu" element={<RestaurantMenuPage />} />
              <Route path="profile" element={<RestaurantProfilePage />} />
            </Route>

          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
