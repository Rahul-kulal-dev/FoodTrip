
export const CDN_BASE_URL = 'https://d1do212giwnd6s.cloudfront.net';

export const DEFAULT_IMAGES = {
  RESTAURANT_BANNER: `${CDN_BASE_URL}/defaults/default-restaurant-banner.webp`,
  FOOD_ITEM: `${CDN_BASE_URL}/defaults/default-food-item.webp`,
  RESTAURANT_LOGO: `${CDN_BASE_URL}/defaults/default-restaurant-logo.webp`,
  USER_AVATAR: `${CDN_BASE_URL}/defaults/default-user-avatar.webp`,
};

export const getImageUrl = (imagePath, fallback = DEFAULT_IMAGES.FOOD_ITEM) => {
  if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
    return fallback;
  }
  const trimmed = imagePath.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `${CDN_BASE_URL}/${trimmed.startsWith('/') ? trimmed.slice(1) : trimmed}`;
};

export const getFoodItemFallbackImage = (name = '', category = '') => {
  const n = (name || '').toLowerCase();
  const c = (category || '').toLowerCase();

  if (n.includes('paneer') || n.includes('tikka')) {
    return 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=400&q=80';
  }
  if (n.includes('naan') || n.includes('roti') || n.includes('bread') || c.includes('bread')) {
    return 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=400&q=80';
  }
  if (n.includes('butter chicken') || n.includes('chicken') || n.includes('mutton') || n.includes('curry')) {
    return 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=400&q=80';
  }
  if (n.includes('biryani') || n.includes('rice') || n.includes('pulao')) {
    return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80';
  }
  if (n.includes('pizza')) {
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80';
  }
  if (n.includes('burger')) {
    return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80';
  }
  if (n.includes('sushi') || n.includes('roll') || c.includes('sushi')) {
    return 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=400&q=80';
  }
  if (n.includes('pasta')) {
    return 'https://images.unsplash.com/photo-1621996346565-e3d5d6281699?auto=format&fit=crop&w=400&q=80';
  }
  if (n.includes('dosa') || n.includes('idli')) {
    return 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=400&q=80';
  }
  if (n.includes('soda') || n.includes('lime') || n.includes('shake') || n.includes('drink') || n.includes('juice') || c.includes('beverage')) {
    return 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80';
  }
  if (n.includes('ice cream') || n.includes('dessert') || n.includes('cake') || c.includes('dessert')) {
    return 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=400&q=80';
  }
  return DEFAULT_IMAGES.FOOD_ITEM;
};
