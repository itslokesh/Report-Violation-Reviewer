import { BaseEntity } from './common';

export interface User extends BaseEntity {
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
  lastLoginAt?: Date;
}

export interface PoliceOfficer extends BaseEntity {
  id: string;
  badgeNumber: string;
  name: string;
  email: string;
  phone: string;
  role: 'OFFICER' | 'SUPERVISOR' | 'ADMIN';
  department: string;
  city: string;
  district: string;
  state: string;
  lastLoginAt?: Date;
}

export interface UserCreate {
  phoneNumber: string;
  name?: string;
  email?: string;
  registeredCity: string;
  registeredPincode: string;
  registeredDistrict: string;
  registeredState: string;
  isAnonymousMode?: boolean;
  notificationEnabled?: boolean;
  locationSharingEnabled?: boolean;
}

export interface UserUpdate {
  name?: string;
  email?: string;
  isAnonymousMode?: boolean;
  notificationEnabled?: boolean;
  locationSharingEnabled?: boolean;
  authorizedCities?: string[];
}

export interface PoliceOfficerCreate {
  badgeNumber: string;
  name: string;
  email: string;
  phone: string;
  role: 'OFFICER' | 'SUPERVISOR' | 'ADMIN';
  department: string;
  city: string;
  district: string;
  state: string;
}
