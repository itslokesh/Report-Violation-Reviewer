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
  pending: number;
  hotspots: HotspotLocation[];
  individualViolations: IndividualViolation[];
  totalHotspots: number;
  totalIndividualViolations: number;
}

export interface HotspotLocation {
  latitude: number;
  longitude: number;
  address: string;
  violationCount: number;
  violationTypes: string[];
  statusCounts: {
    REJECTED: number;
    APPROVED: number;
    PENDING: number;
  };
  district: string;
  isIndividual: boolean;
}

export interface IndividualViolation {
  latitude: number;
  longitude: number;
  address: string;
  violationType: string;
  status: string;
  severity: string;
  timestamp: string;
  district: string;
  isIndividual: boolean;
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
