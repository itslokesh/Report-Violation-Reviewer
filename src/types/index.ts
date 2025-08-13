// Core data types based on Android app structure

export enum ViolationType {
  WRONG_SIDE_DRIVING = "Wrong Side Driving",
  NO_PARKING_ZONE = "No Parking Zone",
  SIGNAL_JUMPING = "Signal Jumping",
  SPEED_VIOLATION = "Speed Violation",
  HELMET_SEATBELT_VIOLATION = "Helmet/Seatbelt Violation",
  MOBILE_PHONE_USAGE = "Mobile Phone Usage",
  LANE_CUTTING = "Lane Cutting",
  DRUNK_DRIVING_SUSPECTED = "Drunk Driving (Suspected)",
  OTHERS = "Others"
}

export enum SeverityLevel {
  MINOR = "MINOR",
  MAJOR = "MAJOR",
  CRITICAL = "CRITICAL"
}

export enum VehicleType {
  TWO_WHEELER = "TWO_WHEELER",
  FOUR_WHEELER = "FOUR_WHEELER",
  COMMERCIAL_VEHICLE = "COMMERCIAL_VEHICLE",
  HEAVY_VEHICLE = "HEAVY_VEHICLE",
  AUTO_RICKSHAW = "AUTO_RICKSHAW",
  BUS = "BUS",
  TRUCK = "TRUCK",
  OTHERS = "OTHERS"
}

export enum ReportStatus {
  PENDING = "PENDING",
  UNDER_REVIEW = "UNDER_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  DUPLICATE = "DUPLICATE"
}

export enum UserRole {
  OFFICER = "OFFICER",
  SUPERVISOR = "SUPERVISOR",
  ADMIN = "ADMIN"
}

export interface ViolationReport {
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
  latitude: number;
  longitude: number;
  address: string;
  pincode: string;
  city: string;
  district: string;
  state: string;
  
  // Vehicle Information
  vehicleNumber?: string;
  vehicleType?: VehicleType;
  vehicleColor?: string;
  
  // Media Information
  photoUri?: string;
  videoUri?: string;
  mediaMetadata?: string;
  
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
  createdAt: Date;
  updatedAt: Date;
  isAnonymous: boolean;
}

export interface User {
  id: string;
  phoneNumber: string;
  name?: string;
  email?: string;
  
  // Location & Jurisdiction
  registeredCity: string;
  registeredPincode: string;
  registeredDistrict: string;
  registeredState: string;
  
  // Verification Status
  isPhoneVerified: boolean;
  isIdentityVerified: boolean;
  aadhaarNumber?: string;
  panNumber?: string;
  
  // Reward System
  totalPoints: number;
  pointsEarned: number;
  pointsRedeemed: number;
  reportsSubmitted: number;
  reportsApproved: number;
  accuracyRate: number;
  
  // Settings
  isAnonymousMode: boolean;
  notificationEnabled: boolean;
  locationSharingEnabled: boolean;
  
  // Multi-city Access
  authorizedCities: string[];
  isGuestUser: boolean;
  guestExpiryDate?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}

export interface PoliceOfficer {
  id: string;
  badgeNumber: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  department: string;
  city: string;
  district: string;
  state: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface VehicleInfo {
  number: string;
  type: VehicleType;
  color: string;
  brand: string;
  model: string;
  year: number;
  ownerName: string;
  ownerPhone: string;
  ownerAddress: string;
  registrationDate: Date;
  insuranceExpiry: Date;
  pollutionExpiry: Date;
  previousViolations: number;
  totalFines: number;
}

export interface ChallanData {
  challanNumber: string;
  violationReportId: number;
  vehicleNumber: string;
  ownerName: string;
  ownerAddress: string;
  violationType: ViolationType;
  violationDate: Date;
  location: string;
  fineAmount: number;
  issuedBy: string;
  issuedAt: Date;
  dueDate: Date;
  status: 'ISSUED' | 'PAID' | 'OVERDUE' | 'CANCELLED';
}

export interface DashboardStats {
  totalReports: number;
  pendingReports: number;
  processedToday: number;
  approvedToday: number;
  rejectedToday: number;
  averageProcessingTime: number;
  topViolationTypes: Array<{
    type: ViolationType;
    count: number;
  }>;
  weeklyTrend: Array<{
    date: string;
    reports: number;
    approved: number;
  }>;
}

export interface FilterOptions {
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
}
