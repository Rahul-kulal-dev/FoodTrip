import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, loading, isTokenValid } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF5200]"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isTokenValid()) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const currentRole = (role || '').toUpperCase();
    const isAllowed = allowedRoles.some((r) => {
      const targetRole = r.toUpperCase();
      if (targetRole === currentRole) return true;
      const isCustomerRole = (roleStr) => roleStr === 'CUSTOMER' || roleStr === 'ROLE_CUSTOMER' || roleStr === 'ROLE_USER';
      if (isCustomerRole(targetRole) && isCustomerRole(currentRole)) {
        return true;
      }
      return false;
    });

    if (!isAllowed) {
      if (currentRole === 'ROLE_ADMIN' || currentRole === 'ADMIN') {
        return <Navigate to="/admin" replace />;
      }
      if (currentRole === 'ROLE_RESTAURANT' || currentRole === 'RESTAURANT') {
        return <Navigate to="/restaurant-panel" replace />;
      }

      return <Navigate to="/login" replace />;
    }
  }

  return children ? children : <Outlet />;
};
