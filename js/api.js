(() => {
  const AUTH_KEY = 'auth';
  const API_BASE = 'http://localhost:3333/api';

  const getAuth = () => {
    try {
      return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
    } catch (_) {
      return null;
    }
  };

  const setAuth = (authData) => {
    if (!authData) return;
    localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
  };

  const clearAuth = () => {
    localStorage.removeItem(AUTH_KEY);
  };

  const getAccessToken = () => getAuth()?.accessToken || '';

  const request = async (path, options = {}, retry = true) => {
    const auth = getAuth();
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (!options.skipAuth && auth?.accessToken) {
      headers.Authorization = `Bearer ${auth.accessToken}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers
    });

    if (response.status === 401 && retry && auth?.refreshToken && !options.skipAuth) {
      const refreshed = await refreshToken();
      if (refreshed) {
        return request(path, options, false);
      }
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data?.message || 'Erro de API';
      throw new Error(message);
    }

    return data;
  };

  const refreshToken = async () => {
    const auth = getAuth();
    if (!auth?.refreshToken) return false;

    try {
      const data = await request(
        '/auth/refresh',
        {
          method: 'POST',
          body: JSON.stringify({ refreshToken: auth.refreshToken }),
          skipAuth: true
        },
        false
      );

      setAuth({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken
      });
      return true;
    } catch (_) {
      clearAuth();
      return false;
    }
  };

  const login = async (email, password) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true
    });

    setAuth({
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken
    });

    return data.user;
  };

  const logout = () => {
    clearAuth();
    localStorage.removeItem('currentUser');
  };

  const getCurrentUser = () => getAuth()?.user || null;

  const getProducts = (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      query.set(key, String(value));
    });

    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request(`/products${suffix}`, { method: 'GET', skipAuth: true });
  };

  const listFavorites = () => request('/favorites', { method: 'GET' });
  const addFavorite = (productId) => request('/favorites', {
    method: 'POST',
    body: JSON.stringify({ productId })
  });
  const removeFavorite = (productId) => request(`/favorites/${encodeURIComponent(productId)}`, { method: 'DELETE' });

  const getCart = () => request('/cart', { method: 'GET' });
  const addCartItem = (payload) => request('/cart', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  const updateCartItem = (itemId, payload) => request(`/cart/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
  const removeCartItem = (itemId) => request(`/cart/${itemId}`, { method: 'DELETE' });
  const clearCart = () => request('/cart', { method: 'DELETE' });

  const createOrder = (payload = {}) => request('/orders', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  const me = () => request('/users/me', { method: 'GET' });
  const updateAvatar = (avatarUrl) => request('/users/me/avatar', {
    method: 'PATCH',
    body: JSON.stringify({ avatarUrl })
  });

  window.PetshopApi = {
    login,
    logout,
    me,
    updateAvatar,
    getProducts,
    listFavorites,
    addFavorite,
    removeFavorite,
    getCart,
    addCartItem,
    updateCartItem,
    removeCartItem,
    clearCart,
    createOrder,
    getCurrentUser,
    getAccessToken,
    getAuth,
    setAuth,
    clearAuth
  };
})();
