// Common enums and interfaces shared between web and Flutter apps

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

export enum ChallanStatus {
  ISSUED = "ISSUED",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
  CANCELLED = "CANCELLED"
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  pincode: string;
  city: string;
  district: string;
  state: string;
}

export interface MediaInfo {
  photoUri?: string;
  videoUri?: string;
  mediaMetadata?: string;
  fileSize?: number;
  resolution?: string;
  duration?: number; // for videos
}

export interface BaseEntity {
  id: string | number;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: number;
}
