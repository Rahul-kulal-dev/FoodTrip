import { getCookie } from '../utils/cookieUtils';

const RAW_BASE = import.meta.env.VITE_API_BASE_URL;
const BASE = RAW_BASE ? RAW_BASE.replace(/\/+$/, '').replace(/\/api$/, '') : '';
const API_BASE_URL = BASE ? `${BASE}/api` : '/api';

const getAuthHeaders = () => {
  const token = getCookie('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const cleanErrorMessage = (rawMessage, defaultFallback = 'Something went wrong. Please try again.') => {
  if (!rawMessage || typeof rawMessage !== 'string') return defaultFallback;

  const lower = rawMessage.toLowerCase();

  if (
    lower.includes('ukf61bgjra1xys1se3lcejou027') ||
    lower.includes('user already exists') ||
    (lower.includes('duplicate') && (lower.includes('email') || lower.includes('foodtrip_users')))
  ) {
    return 'An account with this email already exists. Please log in instead.';
  }

  if (lower.includes('bad credentials') || lower.includes('invalid email or password')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }

  if (
    rawMessage.includes('org.springframework.') ||
    rawMessage.includes('java.sql.') ||
    rawMessage.includes('could not execute statement') ||
    rawMessage.includes('SQL [insert into') ||
    rawMessage.includes('constraint [')
  ) {
    return 'A database error occurred. If you already have an account, please try logging in.';
  }

  return rawMessage;
};

export const getFriendlyErrorMessage = (data, defaultMessage = 'API request failed') => {
  if (!data) return defaultMessage;

  if (typeof data === 'string') {
    return cleanErrorMessage(data, defaultMessage);
  }

  if (typeof data === 'object' && !data.message && !data.error) {
    const errorValues = Object.values(data).filter(v => typeof v === 'string');
    if (errorValues.length > 0) {
      return errorValues.join(', ');
    }
  }

  const rawMessage = data.message || data.error || data.detail || defaultMessage;
  return cleanErrorMessage(rawMessage, defaultMessage);
};

const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    let message = 'API request failed';
    if (response.status === 401) {
      message = 'Unauthorized access. Please log in.';
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    } else if (response.status === 403) {
      message = 'Access forbidden: You do not have permission for this resource.';
    }

    const error = new Error(getFriendlyErrorMessage(data, message));
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
};

export const authAPI = {
  login: async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },
  register: async (userData) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },
  getMe: async () => {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
  updateProfile: async (data) => {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
};

export const restaurantAPI = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE_URL}/restaurants${query ? `?${query}` : ''}`);
    return handleResponse(res);
  },
  getById: async (id) => {
    const res = await fetch(`${API_BASE_URL}/restaurants/${id}`);
    return handleResponse(res);
  },
  getMenu: async (id) => {
    const res = await fetch(`${API_BASE_URL}/restaurants/${id}/menu`);
    return handleResponse(res);
  },
  create: async (data) => {
    const res = await fetch(`${API_BASE_URL}/restaurants`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  updateProfile: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/restaurants/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  getMe: async () => {
    const res = await fetch(`${API_BASE_URL}/restaurants/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
  updateMe: async (data) => {
    const res = await fetch(`${API_BASE_URL}/restaurants/me`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  deleteMe: async () => {
    const res = await fetch(`${API_BASE_URL}/restaurants/me`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
  delete: async (id) => {
    const res = await fetch(`${API_BASE_URL}/restaurants/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
  getVerification: async () => {
    const res = await fetch(`${API_BASE_URL}/restaurants/verification`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
  submitVerification: async (data) => {
    const res = await fetch(`${API_BASE_URL}/restaurants/verification`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
};

export const dishAPI = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE_URL}/dishes${query ? `?${query}` : ''}`);
    return handleResponse(res);
  },
  getMyDishes: async () => {
    const res = await fetch(`${API_BASE_URL}/dishes/mine`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
  create: async (data) => {
    const res = await fetch(`${API_BASE_URL}/dishes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  update: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/dishes/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  delete: async (id) => {
    const res = await fetch(`${API_BASE_URL}/dishes/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};

export const checkoutAPI = {
  getCheckout: async () => {
    const res = await fetch(`${API_BASE_URL}/checkout`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};

export const orderAPI = {
  create: async (payload) => {
    const res = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE_URL}/orders${query ? `?${query}` : ''}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
  getMyRestaurantOrders: async () => {
    const res = await fetch(`${API_BASE_URL}/orders/mine/restaurant`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
  updateStatus: async (id, status) => {
    const res = await fetch(`${API_BASE_URL}/orders/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },
};

export const adminAPI = {
  getStats: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/stats`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
  getUsers: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
  updateUserStatus: async (id, status) => {
    const res = await fetch(`${API_BASE_URL}/admin/users/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },
  deleteUser: async (id) => {
    const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
  getRestaurants: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/restaurants`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
  updateRestaurantStatus: async (id, status) => {
    const res = await fetch(`${API_BASE_URL}/admin/restaurants/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },
  deleteRestaurant: async (id) => {
    const res = await fetch(`${API_BASE_URL}/admin/restaurants/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
  getDishes: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/dishes`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
  updateDishStatus: async (id, isAvailable) => {
    const res = await fetch(`${API_BASE_URL}/admin/dishes/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ isAvailable }),
    });
    return handleResponse(res);
  },
  deleteDish: async (id) => {
    const res = await fetch(`${API_BASE_URL}/admin/dishes/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
  getOrders: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/orders`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
  getPendingRestaurants: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/restaurant-verifications`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
  getRestaurantVerificationDetails: async (id) => {
    const res = await fetch(`${API_BASE_URL}/admin/restaurant-verifications/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
  approveRestaurantVerification: async (id) => {
    const res = await fetch(`${API_BASE_URL}/admin/restaurant-verifications/${id}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
  rejectRestaurantVerification: async (id, reason = '') => {
    const res = await fetch(`${API_BASE_URL}/admin/restaurant-verifications/${id}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    return handleResponse(res);
  },
};

export const cartAPI = {
  getCart: async () => {
    const res = await fetch(`${API_BASE_URL}/cart`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
  addItem: async (itemPayload, quantity = 1) => {
    const foodItemId = typeof itemPayload === 'object'
      ? (itemPayload.id || itemPayload.foodItemId || itemPayload._id)
      : itemPayload;
    const body = {
      foodItemId,
      quantity: typeof itemPayload === 'object' && itemPayload.quantity ? itemPayload.quantity : quantity,
    };

    const res = await fetch(`${API_BASE_URL}/cart/items`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },
  updateQuantity: async (foodItemId, updatePayload) => {
    const body = typeof updatePayload === 'number' ? { quantity: updatePayload } : updatePayload;
    const res = await fetch(`${API_BASE_URL}/cart/items/${foodItemId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },
  removeItem: async (foodItemId) => {
    const res = await fetch(`${API_BASE_URL}/cart/items/${foodItemId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
  clearCart: async () => {
    const res = await fetch(`${API_BASE_URL}/cart`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
  syncCart: async (items) => {
    const res = await fetch(`${API_BASE_URL}/cart/sync`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ items }),
    });
    return handleResponse(res);
  },
};

export const uploadAPI = {
  uploadFile: async (file, folder = 'uploads') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const token = getCookie('token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}/files/upload`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });
    return handleResponse(res);
  },
};

