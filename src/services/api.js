/**
 * Centralized API Client for FARM-SATHI
 * Connects React frontend directly to FastAPI Python backend.
 */

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
const V1 = '/api/v1';

/**
 * Universal fetch wrapper handling headers, JWT auth token, and errors
 */
async function apiRequest(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;
  const headers = { ...options.headers };

  // Attach JWT Bearer token if present
  const token = localStorage.getItem('farmer_token');
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Set default JSON content-type unless sending FormData (e.g. image upload)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Check for HTTP 204 No Content
    if (response.status === 204) {
      return null;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.detail || data?.message || `Server request failed with status ${response.status}`;
      const error = new Error(errorMsg);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.status) throw error;
    // Network or connection failure
    const networkError = new Error(`Cannot connect to Farm Saathi backend at ${API_BASE_URL}. Please ensure the backend is running.`);
    networkError.isNetworkError = true;
    throw networkError;
  }
}

export const api = {
  // Health & Server Status
  checkHealth: () => apiRequest('/health'),

  // Authentication & Profile
  auth: {
    register: async (userData) => {
      const result = await apiRequest(`${V1}/auth/register`, {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      if (result?.access_token) {
        localStorage.setItem('farmer_token', result.access_token);
        localStorage.setItem('farmer_name', userData.name || '');
      }
      return result;
    },

    login: async (phoneNumber, password) => {
      const result = await apiRequest(`${V1}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ phone_number: phoneNumber, password }),
      });
      if (result?.access_token) {
        localStorage.setItem('farmer_token', result.access_token);
        localStorage.setItem('farmer_name', result.farmer_name || '');
      }
      return result;
    },

    getProfile: () => apiRequest(`${V1}/auth/me`),

    logout: () => {
      localStorage.removeItem('farmer_token');
      localStorage.removeItem('farmer_name');
    },

    isAuthenticated: () => Boolean(localStorage.getItem('farmer_token')),
  },

  // Farm & Crop Management
  farms: {
    list: () => apiRequest(`${V1}/farms`),
    get: (farmId) => apiRequest(`${V1}/farms/${farmId}`),
    create: (farmData) =>
      apiRequest(`${V1}/farms`, {
        method: 'POST',
        body: JSON.stringify(farmData),
      }),
    update: (farmId, farmData) =>
      apiRequest(`${V1}/farms/${farmId}`, {
        method: 'PUT',
        body: JSON.stringify(farmData),
      }),
    addCrop: (farmId, cropData) =>
      apiRequest(`${V1}/farms/${farmId}/crops`, {
        method: 'POST',
        body: JSON.stringify(cropData),
      }),
  },

  // AI Assistant (Gemini with Agronomic safety rules)
  ai: {
    ask: (question, cropContext = null, language = 'en') =>
      apiRequest(`${V1}/ai/ask`, {
        method: 'POST',
        body: JSON.stringify({
          question,
          crop_context: cropContext,
          language,
        }),
      }),
  },

  // Weather Intelligence (Open-Meteo)
  weather: {
    getByCoordinates: (latitude = 28.6139, longitude = 77.209) =>
      apiRequest(`${V1}/weather?latitude=${latitude}&longitude=${longitude}`),
    getForFarm: (farmId) => apiRequest(`${V1}/weather/${farmId}`),
  },

  // Crop Doctor (Disease Diagnosis with Expert Safeguards)
  cropDoctor: {
    detect: (file, cropName = 'Tomato') => {
      const formData = new FormData();
      formData.append('file', file);
      if (cropName) {
        formData.append('crop_name', cropName);
      }
      return apiRequest(`${V1}/crop/detect`, {
        method: 'POST',
        body: formData,
      });
    },
    getHistory: () => apiRequest(`${V1}/crop/history`),
  },

  // Smart Irrigation (FAO-56 Rule Engine)
  irrigation: {
    recommend: ({ cropName = 'Wheat', soilType = 'Loamy', growthStage = 'Vegetative', acres = 1.0, pumpHP = 5.0, farmId = null, recentRainMm = 0 } = {}) =>
      apiRequest(`${V1}/irrigation/recommend`, {
        method: 'POST',
        body: JSON.stringify({
          crop_name: cropName,
          soil_type: soilType,
          growth_stage: growthStage,
          land_size_acres: Number(acres),
          pump_hp: Number(pumpHP),
          pump_capacity_hp: Number(pumpHP),
          farm_id: farmId ? Number(farmId) : null,
          recent_rain_mm: Number(recentRainMm || 0),
        }),
      }),
  },

  // Mandi & Market Prices (APMC)
  market: {
    getPrices: (commodity = null, state = null, district = null) => {
      const params = new URLSearchParams();
      if (commodity) params.append('commodity', commodity);
      if (state) params.append('state', state);
      if (district) params.append('district', district);
      const query = params.toString();
      return apiRequest(`${V1}/market/prices${query ? `?${query}` : ''}`);
    },

    compare: (commodity, state = null, district = null) =>
      apiRequest(`${V1}/market/compare`, {
        method: 'POST',
        body: JSON.stringify({ commodity, state, district }),
      }),
  },

  // Government Schemes
  schemes: {
    list: (category = null, search = null) => {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (search) params.append('search', search);
      const query = params.toString();
      return apiRequest(`${V1}/schemes${query ? `?${query}` : ''}`);
    },

    get: (schemeId) => apiRequest(`${V1}/schemes/${schemeId}`),
  },

  // Farm Tasks & Calendar
  tasks: {
    list: (isCompleted = null) => {
      const query = isCompleted !== null ? `?is_completed=${isCompleted}` : '';
      return apiRequest(`${V1}/tasks${query}`);
    },

    create: (taskData) =>
      apiRequest(`${V1}/tasks`, {
        method: 'POST',
        body: JSON.stringify(taskData),
      }),

    update: (taskId, updates) =>
      apiRequest(`${V1}/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),

    delete: (taskId) =>
      apiRequest(`${V1}/tasks/${taskId}`, {
        method: 'DELETE',
      }),
  },

  // Profit & Budget Estimator
  profit: {
    calculate: (profitData) =>
      apiRequest(`${V1}/calculator/profit`, {
        method: 'POST',
        body: JSON.stringify(profitData),
      }),
  },
};

export default api;
