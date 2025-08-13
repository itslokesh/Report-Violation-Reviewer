import { ViolationType } from './common';

export interface DashboardStats {
  totalReports: number;
  pendingReports: number;
  processedToday: number;
  approvedToday: number;
  rejectedToday: number;
  averageProcessingTime: number;
  topViolationTypes: ViolationTypeStats[];
  weeklyTrend: WeeklyTrendData[];
  monthlyTrend: MonthlyTrendData[];
  geographicStats: GeographicStats[];
  officerPerformance: OfficerPerformanceStats[];
}

export interface ViolationTypeStats {
  type: ViolationType;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface WeeklyTrendData {
  date: string;
  reports: number;
  approved: number;
  rejected: number;
  pending: number;
}

export interface MonthlyTrendData {
  month: string;
  reports: number;
  approved: number;
  rejected: number;
  revenue: number;
}

export interface GeographicStats {
  city: string;
  district: string;
  reports: number;
  approved: number;
  rejected: number;
  hotspots: HotspotLocation[];
}

export interface HotspotLocation {
  latitude: number;
  longitude: number;
  address: string;
  violationCount: number;
  violationTypes: ViolationType[];
}

export interface OfficerPerformanceStats {
  officerId: string;
  officerName: string;
  badgeNumber: string;
  reportsProcessed: number;
  averageProcessingTime: number;
  approvalRate: number;
  accuracyRate: number;
  challansIssued: number;
}

export interface AnalyticsFilter {
  dateRange?: {
    start: Date;
    end: Date;
  };
  city?: string[];
  district?: string[];
  violationType?: ViolationType[];
  officerId?: string[];
}
