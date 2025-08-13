// Validation utility functions shared between web and Flutter apps

export class ValidationUtils {
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format (Indian format)
   */
  static isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^(\+91[\-\s]?)?[789]\d{9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validate vehicle number format (Indian format)
   */
  static isValidVehicleNumber(vehicleNumber: string): boolean {
    const vehicleRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/;
    return vehicleRegex.test(vehicleNumber.toUpperCase());
  }

  /**
   * Validate Aadhaar number format
   */
  static isValidAadhaar(aadhaar: string): boolean {
    const aadhaarRegex = /^[0-9]{12}$/;
    return aadhaarRegex.test(aadhaar.replace(/\s/g, ''));
  }

  /**
   * Validate PAN number format
   */
  static isValidPAN(pan: string): boolean {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan.toUpperCase());
  }

  /**
   * Validate pincode format (Indian format)
   */
  static isValidPincode(pincode: string): boolean {
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    return pincodeRegex.test(pincode);
  }

  /**
   * Validate password strength
   */
  static isStrongPassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate latitude value
   */
  static isValidLatitude(latitude: number): boolean {
    return latitude >= -90 && latitude <= 90;
  }

  /**
   * Validate longitude value
   */
  static isValidLongitude(longitude: number): boolean {
    return longitude >= -180 && longitude <= 180;
  }

  /**
   * Validate file size
   */
  static isValidFileSize(fileSize: number, maxSizeMB: number): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return fileSize <= maxSizeBytes;
  }

  /**
   * Validate file type
   */
  static isValidFileType(fileName: string, allowedTypes: string[]): boolean {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return extension ? allowedTypes.includes(extension) : false;
  }

  /**
   * Validate required field
   */
  static isRequired(value: any): boolean {
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== null && value !== undefined;
  }

  /**
   * Validate string length
   */
  static isValidLength(value: string, minLength: number, maxLength: number): boolean {
    return value.length >= minLength && value.length <= maxLength;
  }

  /**
   * Validate numeric range
   */
  static isInRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }

  /**
   * Validate URL format
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate date is not in the future
   */
  static isNotFutureDate(date: Date): boolean {
    return date <= new Date();
  }

  /**
   * Validate date is not too old (e.g., not more than 100 years ago)
   */
  static isNotTooOld(date: Date, maxYears: number = 100): boolean {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() - maxYears);
    return date >= maxDate;
  }

  /**
   * Validate coordinates are within India bounds
   */
  static isWithinIndiaBounds(latitude: number, longitude: number): boolean {
    // Approximate bounds of India
    const indiaBounds = {
      north: 37.6,
      south: 6.5,
      east: 97.4,
      west: 68.1
    };
    
    return latitude >= indiaBounds.south && 
           latitude <= indiaBounds.north && 
           longitude >= indiaBounds.west && 
           longitude <= indiaBounds.east;
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/[&]/g, '&amp;') // Escape ampersand
      .replace(/["]/g, '&quot;') // Escape quotes
      .replace(/[']/g, '&#x27;'); // Escape apostrophe
  }

  /**
   * Validate challan number format
   */
  static isValidChallanNumber(challanNumber: string): boolean {
    const challanRegex = /^[A-Z]{2}[0-9]{4}[A-Z]{2}[0-9]{6}$/;
    return challanRegex.test(challanNumber.toUpperCase());
  }
}
