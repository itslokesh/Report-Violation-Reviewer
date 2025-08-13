import { BaseEntity, VehicleType } from './common';

export interface VehicleInfo extends BaseEntity {
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

export interface VehicleLookup {
  number: string;
  type?: VehicleType;
  color?: string;
}

export interface VehicleSearchResult {
  vehicles: VehicleInfo[];
  total: number;
  hasMore: boolean;
}
