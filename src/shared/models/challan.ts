import { BaseEntity, ChallanStatus, ViolationType } from './common';

export interface ChallanData extends BaseEntity {
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
  status: ChallanStatus;
  paymentDate?: Date;
  paymentMethod?: string;
  transactionId?: string;
}

export interface ChallanCreate {
  violationReportId: number;
  vehicleNumber: string;
  ownerName: string;
  ownerAddress: string;
  violationType: ViolationType;
  violationDate: Date;
  location: string;
  fineAmount: number;
  issuedBy: string;
  dueDate: Date;
}

export interface ChallanUpdate {
  status?: ChallanStatus;
  paymentDate?: Date;
  paymentMethod?: string;
  transactionId?: string;
}

export interface ChallanFilter {
  status?: ChallanStatus[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  vehicleNumber?: string;
  issuedBy?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface FineCalculation {
  baseAmount: number;
  lateFee?: number;
  additionalPenalty?: number;
  totalAmount: number;
  breakdown: {
    description: string;
    amount: number;
  }[];
}
