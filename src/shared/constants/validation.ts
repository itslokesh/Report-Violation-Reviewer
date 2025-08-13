// Validation rules
export const VALIDATION_RULES = {
  // Email validation
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MIN_LENGTH: 5,
    MAX_LENGTH: 254,
  },

  // Password validation
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  },

  // Phone number validation (Indian format)
  PHONE: {
    PATTERN: /^(\+91[\-\s]?)?[789]\d{9}$/,
    MIN_LENGTH: 10,
    MAX_LENGTH: 15,
  },

  // Vehicle number validation (Indian format)
  VEHICLE_NUMBER: {
    PATTERN: /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/,
    MIN_LENGTH: 10,
    MAX_LENGTH: 12,
  },

  // Aadhaar number validation
  AADHAAR: {
    PATTERN: /^[0-9]{12}$/,
    LENGTH: 12,
  },

  // PAN number validation
  PAN: {
    PATTERN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    LENGTH: 10,
  },

  // Pincode validation (Indian format)
  PINCODE: {
    PATTERN: /^[1-9][0-9]{5}$/,
    LENGTH: 6,
  },

  // Name validation
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z\s]+$/,
  },

  // Address validation
  ADDRESS: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 500,
  },

  // Description validation
  DESCRIPTION: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 1000,
  },

  // Review notes validation
  REVIEW_NOTES: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 500,
  },

  // Challan number validation
  CHALLAN_NUMBER: {
    PATTERN: /^[A-Z]{2}[0-9]{4}[A-Z]{2}[0-9]{6}$/,
    LENGTH: 14,
  },

  // Fine amount validation
  FINE_AMOUNT: {
    MIN: 100,
    MAX: 100000,
  },

  // Latitude validation
  LATITUDE: {
    MIN: -90,
    MAX: 90,
  },

  // Longitude validation
  LONGITUDE: {
    MIN: -180,
    MAX: 180,
  },

  // File size validation (in bytes)
  FILE_SIZE: {
    IMAGE_MAX: 10 * 1024 * 1024, // 10MB
    VIDEO_MAX: 50 * 1024 * 1024, // 50MB
    DOCUMENT_MAX: 5 * 1024 * 1024, // 5MB
  },

  // File type validation
  FILE_TYPES: {
    IMAGES: ['image/jpeg', 'image/png', 'image/webp'],
    VIDEOS: ['video/mp4', 'video/mov', 'video/avi'],
    DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
} as const;

// Error messages
export const VALIDATION_MESSAGES = {
  // Common messages
  REQUIRED: 'This field is required',
  INVALID_FORMAT: 'Invalid format',
  TOO_SHORT: 'Too short',
  TOO_LONG: 'Too long',
  INVALID_VALUE: 'Invalid value',

  // Email messages
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_INVALID: 'Please enter a valid email address',
  EMAIL_TOO_SHORT: 'Email must be at least 5 characters',
  EMAIL_TOO_LONG: 'Email must be less than 254 characters',

  // Password messages
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters',
  PASSWORD_TOO_LONG: 'Password must be less than 128 characters',
  PASSWORD_WEAK: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  PASSWORD_MISMATCH: 'Passwords do not match',

  // Phone messages
  PHONE_REQUIRED: 'Phone number is required',
  PHONE_INVALID: 'Please enter a valid phone number',
  PHONE_TOO_SHORT: 'Phone number must be at least 10 digits',
  PHONE_TOO_LONG: 'Phone number must be less than 15 digits',

  // Vehicle number messages
  VEHICLE_NUMBER_REQUIRED: 'Vehicle number is required',
  VEHICLE_NUMBER_INVALID: 'Please enter a valid vehicle number (e.g., TN01AB1234)',
  VEHICLE_NUMBER_TOO_SHORT: 'Vehicle number must be at least 10 characters',
  VEHICLE_NUMBER_TOO_LONG: 'Vehicle number must be less than 12 characters',

  // Aadhaar messages
  AADHAAR_REQUIRED: 'Aadhaar number is required',
  AADHAAR_INVALID: 'Please enter a valid 12-digit Aadhaar number',
  AADHAAR_WRONG_LENGTH: 'Aadhaar number must be exactly 12 digits',

  // PAN messages
  PAN_REQUIRED: 'PAN number is required',
  PAN_INVALID: 'Please enter a valid PAN number (e.g., ABCDE1234F)',
  PAN_WRONG_LENGTH: 'PAN number must be exactly 10 characters',

  // Pincode messages
  PINCODE_REQUIRED: 'Pincode is required',
  PINCODE_INVALID: 'Please enter a valid 6-digit pincode',
  PINCODE_WRONG_LENGTH: 'Pincode must be exactly 6 digits',

  // Name messages
  NAME_REQUIRED: 'Name is required',
  NAME_TOO_SHORT: 'Name must be at least 2 characters',
  NAME_TOO_LONG: 'Name must be less than 50 characters',
  NAME_INVALID: 'Name can only contain letters and spaces',

  // Address messages
  ADDRESS_REQUIRED: 'Address is required',
  ADDRESS_TOO_SHORT: 'Address must be at least 10 characters',
  ADDRESS_TOO_LONG: 'Address must be less than 500 characters',

  // Description messages
  DESCRIPTION_REQUIRED: 'Description is required',
  DESCRIPTION_TOO_SHORT: 'Description must be at least 10 characters',
  DESCRIPTION_TOO_LONG: 'Description must be less than 1000 characters',

  // Review notes messages
  REVIEW_NOTES_REQUIRED: 'Review notes are required',
  REVIEW_NOTES_TOO_SHORT: 'Review notes must be at least 10 characters',
  REVIEW_NOTES_TOO_LONG: 'Review notes must be less than 500 characters',

  // Challan number messages
  CHALLAN_NUMBER_REQUIRED: 'Challan number is required',
  CHALLAN_NUMBER_INVALID: 'Please enter a valid challan number',
  CHALLAN_NUMBER_WRONG_LENGTH: 'Challan number must be exactly 14 characters',

  // Fine amount messages
  FINE_AMOUNT_REQUIRED: 'Fine amount is required',
  FINE_AMOUNT_TOO_LOW: 'Fine amount must be at least ₹100',
  FINE_AMOUNT_TOO_HIGH: 'Fine amount must be less than ₹100,000',
  FINE_AMOUNT_INVALID: 'Please enter a valid amount',

  // Location messages
  LATITUDE_REQUIRED: 'Latitude is required',
  LATITUDE_INVALID: 'Latitude must be between -90 and 90',
  LONGITUDE_REQUIRED: 'Longitude is required',
  LONGITUDE_INVALID: 'Longitude must be between -180 and 180',

  // File messages
  FILE_REQUIRED: 'File is required',
  FILE_TOO_LARGE: 'File size is too large',
  FILE_TYPE_INVALID: 'File type is not supported',
  FILE_UPLOAD_FAILED: 'File upload failed',

  // Date messages
  DATE_REQUIRED: 'Date is required',
  DATE_INVALID: 'Please enter a valid date',
  DATE_FUTURE: 'Date cannot be in the future',
  DATE_TOO_OLD: 'Date is too old',

  // Time messages
  TIME_REQUIRED: 'Time is required',
  TIME_INVALID: 'Please enter a valid time',

  // Number messages
  NUMBER_REQUIRED: 'Number is required',
  NUMBER_INVALID: 'Please enter a valid number',
  NUMBER_TOO_LOW: 'Number is too low',
  NUMBER_TOO_HIGH: 'Number is too high',

  // URL messages
  URL_REQUIRED: 'URL is required',
  URL_INVALID: 'Please enter a valid URL',

  // Custom validation messages
  DUPLICATE_ENTRY: 'This entry already exists',
  INVALID_SELECTION: 'Please select a valid option',
  AGREEMENT_REQUIRED: 'You must agree to the terms and conditions',
  CAPTCHA_REQUIRED: 'Please complete the captcha',
} as const;

// Validation functions
export const VALIDATION_FUNCTIONS = {
  // Email validation
  isValidEmail: (email: string): boolean => {
    return VALIDATION_RULES.EMAIL.PATTERN.test(email);
  },

  // Password validation
  isStrongPassword: (password: string): boolean => {
    return VALIDATION_RULES.PASSWORD.PATTERN.test(password);
  },

  // Phone validation
  isValidPhone: (phone: string): boolean => {
    return VALIDATION_RULES.PHONE.PATTERN.test(phone);
  },

  // Vehicle number validation
  isValidVehicleNumber: (vehicleNumber: string): boolean => {
    return VALIDATION_RULES.VEHICLE_NUMBER.PATTERN.test(vehicleNumber.toUpperCase());
  },

  // Aadhaar validation
  isValidAadhaar: (aadhaar: string): boolean => {
    return VALIDATION_RULES.AADHAAR.PATTERN.test(aadhaar.replace(/\s/g, ''));
  },

  // PAN validation
  isValidPAN: (pan: string): boolean => {
    return VALIDATION_RULES.PAN.PATTERN.test(pan.toUpperCase());
  },

  // Pincode validation
  isValidPincode: (pincode: string): boolean => {
    return VALIDATION_RULES.PINCODE.PATTERN.test(pincode);
  },

  // Name validation
  isValidName: (name: string): boolean => {
    return VALIDATION_RULES.NAME.PATTERN.test(name);
  },

  // Challan number validation
  isValidChallanNumber: (challanNumber: string): boolean => {
    return VALIDATION_RULES.CHALLAN_NUMBER.PATTERN.test(challanNumber.toUpperCase());
  },

  // Latitude validation
  isValidLatitude: (latitude: number): boolean => {
    return latitude >= VALIDATION_RULES.LATITUDE.MIN && latitude <= VALIDATION_RULES.LATITUDE.MAX;
  },

  // Longitude validation
  isValidLongitude: (longitude: number): boolean => {
    return longitude >= VALIDATION_RULES.LONGITUDE.MIN && longitude <= VALIDATION_RULES.LONGITUDE.MAX;
  },

  // File size validation
  isValidFileSize: (fileSize: number, maxSize: number): boolean => {
    return fileSize <= maxSize;
  },

  // File type validation
  isValidFileType: (fileType: string, allowedTypes: string[]): boolean => {
    return allowedTypes.includes(fileType);
  },

  // Date validation
  isValidDate: (date: Date): boolean => {
    return date instanceof Date && !isNaN(date.getTime());
  },

  // Future date validation
  isNotFutureDate: (date: Date): boolean => {
    return date <= new Date();
  },

  // Required field validation
  isRequired: (value: any): boolean => {
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== null && value !== undefined;
  },

  // Length validation
  isValidLength: (value: string, minLength: number, maxLength: number): boolean => {
    return value.length >= minLength && value.length <= maxLength;
  },

  // Range validation
  isInRange: (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max;
  },
} as const;
