// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
    VERIFY_TOKEN: '/auth/verify-token',
  },

  // Violation Reports
  VIOLATIONS: {
    BASE: '/violations',
    PENDING: '/violations/pending',
    BY_STATUS: '/violations/by-status',
    BY_TYPE: '/violations/by-type',
    BY_LOCATION: '/violations/by-location',
    BY_VEHICLE: '/violations/by-vehicle',
    BY_REPORTER: '/violations/by-reporter',
    DUPLICATES: '/violations/duplicates',
    STATS: '/violations/stats',
    EXPORT: '/violations/export',
    BULK_UPDATE: '/violations/bulk-update',
    HISTORY: '/violations/history',
  },

  // Challans
  CHALLANS: {
    BASE: '/challans',
    BY_STATUS: '/challans/by-status',
    BY_VEHICLE: '/challans/by-vehicle',
    CALCULATE_FINE: '/challans/calculate-fine',
    GENERATE: '/challans/generate',
    EXPORT: '/challans/export',
  },

  // Vehicles
  VEHICLES: {
    BASE: '/vehicles',
    LOOKUP: '/vehicles/lookup',
    SEARCH: '/vehicles/search',
    HISTORY: '/vehicles/history',
    OWNER: '/vehicles/owner',
  },

  // Users
  USERS: {
    BASE: '/users',
    PROFILE: '/users/profile',
    OFFICERS: '/users/officers',
    DEPARTMENTS: '/users/departments',
    ROLES: '/users/roles',
    PERMISSIONS: '/users/permissions',
  },

  // Dashboard
  DASHBOARD: {
    STATS: '/dashboard/stats',
    VIOLATION_TYPES: '/dashboard/violation-types',
    GEOGRAPHIC: '/dashboard/geographic',
    OFFICER_PERFORMANCE: '/dashboard/officer-performance',
    TRENDS: '/dashboard/trends',
    HOTSPOTS: '/dashboard/hotspots',
  },

  // Analytics
  ANALYTICS: {
    BASE: '/analytics',
    REPORTS: '/analytics/reports',
    EXPORT: '/analytics/export',
    CUSTOM: '/analytics/custom',
  },

  // Files
  FILES: {
    UPLOAD: '/files/upload',
    DOWNLOAD: '/files/download',
    DELETE: '/files/delete',
  },

  // Notifications
  NOTIFICATIONS: {
    BASE: '/notifications',
    MARK_READ: '/notifications/mark-read',
    MARK_ALL_READ: '/notifications/mark-all-read',
    SETTINGS: '/notifications/settings',
  },

  // Settings
  SETTINGS: {
    BASE: '/settings',
    SYSTEM: '/settings/system',
    DEPARTMENTS: '/settings/departments',
    FINES: '/settings/fines',
    NOTIFICATIONS: '/settings/notifications',
  },
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

// API Error Codes
export const API_ERROR_CODES = {
  // Authentication errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  ACCESS_DENIED: 'ACCESS_DENIED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',

  // Resource errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_EXISTS: 'RESOURCE_EXISTS',
  RESOURCE_IN_USE: 'RESOURCE_IN_USE',

  // File errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

// API Configuration
export const API_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  UPLOAD_TIMEOUT: 60000, // 60 seconds
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'],
  RATE_LIMIT: {
    REQUESTS_PER_MINUTE: 100,
    REQUESTS_PER_HOUR: 1000,
  },
} as const;

// Request Headers
export const REQUEST_HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  AUTHORIZATION: 'Authorization',
  ACCEPT: 'Accept',
  USER_AGENT: 'User-Agent',
  X_REQUESTED_WITH: 'X-Requested-With',
  X_API_KEY: 'X-API-Key',
  X_CLIENT_VERSION: 'X-Client-Version',
} as const;

// Response Headers
export const RESPONSE_HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  CONTENT_LENGTH: 'Content-Length',
  CACHE_CONTROL: 'Cache-Control',
  ETAG: 'ETag',
  LAST_MODIFIED: 'Last-Modified',
  X_TOTAL_COUNT: 'X-Total-Count',
  X_PAGE_COUNT: 'X-Page-Count',
  X_CURRENT_PAGE: 'X-Current-Page',
  X_PER_PAGE: 'X-Per-Page',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

// Cache Keys
export const CACHE_KEYS = {
  USER_PROFILE: 'user_profile',
  VIOLATION_REPORTS: 'violation_reports',
  CHALLANS: 'challans',
  VEHICLES: 'vehicles',
  DASHBOARD_STATS: 'dashboard_stats',
  NOTIFICATIONS: 'notifications',
  SETTINGS: 'settings',
} as const;

// Cache TTL (Time To Live) in milliseconds
export const CACHE_TTL = {
  USER_PROFILE: 5 * 60 * 1000, // 5 minutes
  VIOLATION_REPORTS: 2 * 60 * 1000, // 2 minutes
  CHALLANS: 5 * 60 * 1000, // 5 minutes
  VEHICLES: 10 * 60 * 1000, // 10 minutes
  DASHBOARD_STATS: 1 * 60 * 1000, // 1 minute
  NOTIFICATIONS: 30 * 1000, // 30 seconds
  SETTINGS: 30 * 60 * 1000, // 30 minutes
} as const;
