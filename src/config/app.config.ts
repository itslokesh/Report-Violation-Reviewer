export const APP_CONFIG = {
  // Application Info
  name: import.meta.env.VITE_APP_NAME || 'Traffic Police Admin',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  environment: import.meta.env.VITE_APP_ENV || 'development',

  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
    timeout: 30000,
    retries: 3,
  },

  // Feature Flags
  features: {
    mockData: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true',
    debugMode: import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true',
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  },

  // Map Configuration
  map: {
    apiKey: import.meta.env.VITE_MAP_API_KEY,
    tileUrl: import.meta.env.VITE_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    defaultCenter: { lat: 20.5937, lng: 78.9629 }, // India center
    defaultZoom: 5,
  },

  // Pagination
  pagination: {
    defaultPageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
  },

  // Authentication
  auth: {
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    refreshThreshold: 5 * 60 * 1000, // 5 minutes
  },

  // Development
  dev: {
    port: import.meta.env.VITE_DEV_PORT || 3001,
    host: import.meta.env.VITE_DEV_HOST || 'localhost',
  },
} as const;

export type AppConfig = typeof APP_CONFIG;
