import { BaseEntity, Location, MediaInfo, ReportStatus, SeverityLevel, ViolationType, VehicleType } from './common';

export interface ViolationReport extends BaseEntity {
  id: number;
  reporterId: string;
  reporterPhone: string;
  reporterCity: string;
  reporterPincode: string;
  
  // Violation Details
  violationType: ViolationType;
  severity: SeverityLevel;
  description?: string;
  timestamp: Date;
  
  // Location Information
  location: Location;
  
  // Vehicle Information
  vehicleNumber?: string;
  vehicleType?: VehicleType;
  vehicleColor?: string;
  
  // Media Information
  media: MediaInfo;
  
  // Status & Processing
  status: ReportStatus;
  isDuplicate: boolean;
  duplicateGroupId?: string;
  confidenceScore?: number;
  
  // Review Information
  reviewerId?: string;
  reviewTimestamp?: Date;
  reviewNotes?: string;
  challanIssued: boolean;
  challanNumber?: string;
  
  // Reward Information
  pointsAwarded: number;
  isFirstReporter: boolean;
  
  // Metadata
  isAnonymous: boolean;
}

export interface ViolationReportCreate {
  reporterId: string;
  reporterPhone: string;
  reporterCity: string;
  reporterPincode: string;
  violationType: ViolationType;
  severity: SeverityLevel;
  description?: string;
  timestamp: Date;
  location: Location;
  vehicleNumber?: string;
  vehicleType?: VehicleType;
  vehicleColor?: string;
  media: MediaInfo;
  isAnonymous: boolean;
}

export interface ViolationReportUpdate {
  status?: ReportStatus;
  reviewNotes?: string;
  challanIssued?: boolean;
  challanNumber?: string;
  reviewerId?: string;
  reviewTimestamp?: Date;
}

export interface ViolationReportFilter {
  status?: ReportStatus[];
  violationType?: ViolationType[];
  severity?: SeverityLevel[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  city?: string[];
  vehicleType?: VehicleType[];
  searchTerm?: string;
  reporterId?: string;
  reviewerId?: string;
}
