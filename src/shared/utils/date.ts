// Date utility functions shared between web and Flutter apps

export class DateUtils {
  /**
   * Format date to human readable string
   */
  static formatDate(date: Date, format: 'short' | 'long' | 'relative' = 'short'): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (format === 'relative') {
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
      if (diffInHours < 24) return `${diffInHours} hours ago`;
      if (diffInDays < 7) return `${diffInDays} days ago`;
    }

    if (format === 'short') {
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }

    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get time difference between two dates
   */
  static getTimeDifference(startDate: Date, endDate: Date): {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } {
    const diffInMs = endDate.getTime() - startDate.getTime();
    const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffInMs % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
  }

  /**
   * Check if date is today
   */
  static isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  /**
   * Check if date is yesterday
   */
  static isYesterday(date: Date): boolean {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
  }

  /**
   * Get start of day
   */
  static getStartOfDay(date: Date): Date {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    return startOfDay;
  }

  /**
   * Get end of day
   */
  static getEndOfDay(date: Date): Date {
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay;
  }

  /**
   * Get start of week
   */
  static getStartOfWeek(date: Date): Date {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  }

  /**
   * Get start of month
   */
  static getStartOfMonth(date: Date): Date {
    const startOfMonth = new Date(date);
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    return startOfMonth;
  }

  /**
   * Add days to date
   */
  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Subtract days from date
   */
  static subtractDays(date: Date, days: number): Date {
    return this.addDays(date, -days);
  }

  /**
   * Check if date is within range
   */
  static isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
    return date >= startDate && date <= endDate;
  }

  /**
   * Get age from birth date
   */
  static getAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Format duration in milliseconds to human readable string
   */
  static formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
}

// Helper function to parse date from various field names and formats
const parseItemDate = (item: any): Date | null => {
  console.log('Parsing date for item:', item);
  
  // Check for date field (weekly trends)
  if (item.date) {
    const date = new Date(item.date);
    console.log('Found date field:', item.date, 'parsed as:', date);
    return date;
  }
  // Check for month field (monthly trends)
  else if (item.month) {
    // Handle month format like "2024-01" or "January 2024"
    const monthStr = item.month;
    let date: Date;
    if (monthStr.includes('-')) {
      // Format: "2024-01"
      date = new Date(monthStr + '-01');
    } else {
      // Format: "January 2024" or similar
      date = new Date(monthStr);
    }
    console.log('Found month field:', item.month, 'parsed as:', date);
    return date;
  }
  // Check for other common date fields
  else if (item.createdAt) {
    const date = new Date(item.createdAt);
    console.log('Found createdAt field:', item.createdAt, 'parsed as:', date);
    return date;
  }
  else if (item.timestamp) {
    const date = new Date(item.timestamp);
    console.log('Found timestamp field:', item.timestamp, 'parsed as:', date);
    return date;
  }
  else if (item.week) {
    // Handle week format
    const date = new Date(item.week);
    console.log('Found week field:', item.week, 'parsed as:', date);
    return date;
  }
  
  console.log('No date field found in item');
  return null;
};

// Global time range filter utility
export const filterDataByGlobalTimeRange = (
  data: any[],
  globalTimeRange: {
    type: 'absolute' | 'relative';
    startDate: string;
    endDate: string;
    relativeRange: string;
    isApplied: boolean;
  }
) => {
  if (!data || data.length === 0 || !globalTimeRange.isApplied) {
    return data;
  }

  const now = new Date();
  let startDateFilter: Date;
  let endDateFilter: Date = now;

  if (globalTimeRange.type === 'absolute') {
    if (!globalTimeRange.startDate || !globalTimeRange.endDate) return data;
    startDateFilter = new Date(globalTimeRange.startDate);
    endDateFilter = new Date(globalTimeRange.endDate);
  } else {
    // Relative time range
    switch (globalTimeRange.relativeRange) {
      case '1d':
        startDateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDateFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDateFilter = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'ytd':
        startDateFilter = new Date(now.getFullYear(), 0, 1);
        break;
      case 'mtd':
        startDateFilter = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        return data;
    }
  }

  return data.filter((item: any) => {
    const itemDate = parseItemDate(item);
    
    // If we couldn't parse a date, include the item (don't filter it out)
    if (!itemDate || isNaN(itemDate.getTime())) {
      return true;
    }
    
    return itemDate >= startDateFilter && itemDate <= endDateFilter;
  });
};

// Local time range filter utility
export const filterDataByLocalTimeRange = (
  data: any[],
  localTimeRange: {
    type: 'absolute' | 'relative';
    startDate: string;
    endDate: string;
    relativeRange: string;
    isApplied: boolean;
  }
) => {
  if (!data || data.length === 0 || !localTimeRange.isApplied) {
    return data;
  }

  const now = new Date();
  let startDateFilter: Date;
  let endDateFilter: Date = now;

  if (localTimeRange.type === 'absolute') {
    if (!localTimeRange.startDate || !localTimeRange.endDate) return data;
    startDateFilter = new Date(localTimeRange.startDate);
    endDateFilter = new Date(localTimeRange.endDate);
  } else {
    // Relative time range
    switch (localTimeRange.relativeRange) {
      case '1d':
        startDateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDateFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDateFilter = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'ytd':
        startDateFilter = new Date(now.getFullYear(), 0, 1);
        break;
      case 'mtd':
        startDateFilter = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        return data;
    }
  }

  return data.filter((item: any) => {
    const itemDate = parseItemDate(item);
    
    // If we couldn't parse a date, include the item (don't filter it out)
    if (!itemDate || isNaN(itemDate.getTime())) {
      return true;
    }
    
    return itemDate >= startDateFilter && itemDate <= endDateFilter;
  });
};
