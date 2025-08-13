// Application constants shared between web and Flutter apps

export const APP_CONFIG = {
  name: 'Traffic Police Admin',
  version: '1.0.0',
  description: 'Comprehensive traffic violation review system',
  author: 'Traffic Police Department',
  supportEmail: 'support@trafficpolice.gov.in',
  website: 'https://trafficpolice.gov.in',
} as const;

export const ENVIRONMENT = {
  development: 'development',
  staging: 'staging',
  production: 'production',
} as const;

export const STORAGE_KEYS = {
  authToken: 'auth_token',
  refreshToken: 'refresh_token',
  currentUser: 'current_user',
  userPreferences: 'user_preferences',
  offlineData: 'offline_data',
  lastSync: 'last_sync',
} as const;

export const SESSION_CONFIG = {
  tokenExpiryMinutes: 60,
  refreshTokenExpiryDays: 30,
  sessionTimeoutMinutes: 30,
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 15,
} as const;

export const FILE_CONFIG = {
  maxImageSizeMB: 10,
  maxVideoSizeMB: 50,
  allowedImageTypes: ['jpg', 'jpeg', 'png', 'webp'],
  allowedVideoTypes: ['mp4', 'mov', 'avi'],
  maxFileUploads: 5,
} as const;

export const LOCATION_CONFIG = {
  defaultRadiusKm: 1,
  maxRadiusKm: 10,
  gpsAccuracyMeters: 3,
  locationUpdateIntervalMs: 5000,
} as const;

export const NOTIFICATION_CONFIG = {
  maxNotifications: 100,
  notificationExpiryDays: 30,
  pushNotificationEnabled: true,
  emailNotificationEnabled: true,
  smsNotificationEnabled: false,
} as const;

export const PAGINATION_CONFIG = {
  defaultPageSize: 20,
  maxPageSize: 100,
  pageSizeOptions: [10, 20, 50, 100],
} as const;

export const CACHE_CONFIG = {
  userDataExpiryMinutes: 60,
  violationDataExpiryMinutes: 30,
  vehicleDataExpiryMinutes: 120,
  offlineDataExpiryDays: 7,
} as const;

export const SECURITY_CONFIG = {
  passwordMinLength: 8,
  passwordMaxLength: 128,
  sessionInactivityTimeoutMinutes: 30,
  maxFailedLoginAttempts: 5,
  accountLockoutDurationMinutes: 15,
  requireTwoFactorAuth: false,
} as const;

export const FEATURE_FLAGS = {
  enableOfflineMode: true,
  enablePushNotifications: true,
  enableBiometricAuth: false,
  enableDarkMode: true,
  enableMultiLanguage: false,
  enableAdvancedAnalytics: true,
  enableBulkOperations: true,
  enableExportFeatures: true,
} as const;
