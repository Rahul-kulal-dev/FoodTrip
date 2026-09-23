import React, { createContext, useContext, useState, useEffect } from 'react';
import { restaurantAPI, adminAPI, authAPI } from '../services/api';
import { getCookie, setCookie, removeCookie } from '../utils/cookieUtils';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

const defaultRestaurants = [];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState(defaultRestaurants);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await restaurantAPI.getAll();
        const data = res?.data || res;
        if (Array.isArray(data) && data.length > 0) {
          setRestaurants(data);
        }
      } catch (err) {
        console.warn('Backend restaurant fetch error, using local fallback state:', err);
      }
    };

    fetchRestaurants();
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setRole(null);
      setToken(null);
      removeCookie('token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      localStorage.removeItem('savedAddresses');
      localStorage.removeItem('localCart');
      localStorage.removeItem('cart');
    };

    let storedToken = getCookie('token');
    if (!storedToken && typeof localStorage !== 'undefined' && localStorage.getItem('token')) {
      storedToken = localStorage.getItem('token');
      setCookie('token', storedToken, 7);
      localStorage.removeItem('token');
    }

    const storedUser = localStorage.getItem('user');
    const storedRole = localStorage.getItem('role');

    if (storedToken && storedUser && storedRole) {
      let isStoredTokenValid = true;
      if (storedToken !== 'mock-jwt-token') {
        try {
          const payload = JSON.parse(atob(storedToken.split('.')[1]));
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            isStoredTokenValid = false;
          }
        } catch {
          isStoredTokenValid = false;
        }
      }

      if (isStoredTokenValid) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setRole(storedRole);

        authAPI.getMe()
          .then((freshUser) => {
            if (freshUser && (freshUser.id || freshUser._id || freshUser.email)) {
              setUser(freshUser);
              localStorage.setItem('user', JSON.stringify(freshUser));
            }
          })
          .catch((err) => {
            console.warn('Could not fetch fresh user data:', err);
            if (err?.status === 401 || err?.status === 403) {
              handleUnauthorized();
            }
          });
      } else {
        handleUnauthorized();
      }
    }
    setLoading(false);

    if (typeof window !== 'undefined') {
      window.addEventListener('auth:unauthorized', handleUnauthorized);
      return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }
  }, []);

  const login = (userData, userRole, jwtToken) => {
    const activeToken = jwtToken || 'mock-jwt-token';
    setUser(userData);
    setRole(userRole);
    setToken(activeToken);

    setCookie('token', activeToken, 7);
    localStorage.removeItem('token');
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('role', userRole);
  };

  const updateUser = (updatedUserData) => {
    const newUser = { ...user, ...updatedUserData };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    setToken(null);

    removeCookie('token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('savedAddresses');
    localStorage.removeItem('localCart');
    localStorage.removeItem('cart');
    sessionStorage.clear();

    window.location.replace('/login');
  };

  const registerRestaurant = async (restaurantData, ownerData) => {
    try {
      const authRes = await authAPI.register({
        name: ownerData.name,
        email: ownerData.email,
        password: ownerData.password,
        confirmPassword: ownerData.confirmPassword,
        phone: ownerData.phone || '+91 98765 00000',
        role: 'Restaurant'
      });

      login(authRes.user, 'Restaurant', authRes.token);

      const restaurantId = authRes.user.restaurantId;
      const apiResult = await restaurantAPI.updateProfile(restaurantId, {
        name: restaurantData.name,
        cuisine: restaurantData.cuisine || 'INDIAN',
        location: restaurantData.location || 'Bengaluru',
        address: restaurantData.location || 'Bengaluru',
        licenseNo: restaurantData.licenseNo,
        description: restaurantData.description,
        minOrder: restaurantData.minOrder,
        prepTime: restaurantData.prepTime,
        status: 'Pending'
      });

      setRestaurants(prev => [apiResult, ...prev]);
      return apiResult;
    } catch (e) {
      console.error('Backend restaurant registration failed:', e);
      throw e;
    }
  };

  const updateRestaurantStatus = async (id, newStatus) => {
    try {
      const targetId = String(id);
      const res = await adminAPI.updateRestaurantStatus(targetId, newStatus);
      const updatedItem = res?.data || res;
      setRestaurants((prev) =>
        prev.map((r) =>
          String(r.id) === targetId || String(r._id) === targetId || String(r.restaurantId) === targetId
            ? { ...r, ...updatedItem, status: newStatus }
            : r
        )
      );
      return { success: true, data: updatedItem };
    } catch (err) {
      console.error('API updateStatus error:', err);
      throw err;
    }
  };

  const deleteRestaurant = async (id) => {
    try {
      await restaurantAPI.delete(id);
      setRestaurants(prev => prev.filter(r => String(r.id) !== String(id) && String(r._id) !== String(id)));
    } catch (err) {
      console.error('API delete error:', err);
      throw err;
    }
  };

  const addRestaurant = async (data) => {
    try {
      const created = await restaurantAPI.create(data);
      setRestaurants(prev => [created, ...prev]);
    } catch (e) {
      console.error('Failed to create restaurant:', e);
      throw e;
    }
  };

  const getCurrentUserRestaurant = () => {
    if (!user) return null;
    return restaurants.find(r => 
      (user.restaurantId && (String(r.id) === String(user.restaurantId) || String(r._id) === String(user.restaurantId))) || 
      (user.email && (r.email === user.email || r.ownerEmail === user.email)) ||
      (user.name && r.owner === user.name)
    ) || null;
  };

  const isTokenValid = () => {
    if (!token) return false;
    if (token === 'mock-jwt-token') return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return false;
      }
      return true;
    } catch {
      return true;
    }
  };

  const value = {
    user,
    role,
    token,
    login,
    logout,
    isAuthenticated: Boolean(token && isTokenValid()),
    loading,
    restaurants,
    registerRestaurant,
    updateRestaurantStatus,
    deleteRestaurant,
    addRestaurant,
    getCurrentUserRestaurant,
    updateUser,
    isTokenValid
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

