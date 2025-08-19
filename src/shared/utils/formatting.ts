import { ViolationType } from '../models/common';

const VIOLATION_LABELS: Record<string, string> = {
  WRONG_SIDE_DRIVING: 'Wrong Side Driving',
  NO_PARKING_ZONE: 'No Parking Zone',
  SIGNAL_JUMPING: 'Signal Jumping',
  SPEED_VIOLATION: 'Speed Violation',
  HELMET_SEATBELT_VIOLATION: 'Helmet/Seatbelt Violation',
  MOBILE_PHONE_USAGE: 'Mobile Phone Usage',
  LANE_CUTTING: 'Lane Cutting',
  DRUNK_DRIVING_SUSPECTED: 'Drunk Driving (Suspected)',
  OTHERS: 'Others',
};

export function formatViolationType(value: string | ViolationType | undefined | null): string {
  if (!value) return '';
  const key = String(value).toUpperCase();
  if (VIOLATION_LABELS[key]) return VIOLATION_LABELS[key];
  // fallback: convert SNAKE_CASE to Title Case
  return key
    .toLowerCase()
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  DUPLICATE: 'Duplicate',
  RESOLVED: 'Resolved',
};

export function formatReportStatus(value: string | undefined | null): string {
  if (!value) return '';
  const key = String(value).toUpperCase();
  if (STATUS_LABELS[key]) return STATUS_LABELS[key];
  return key
    .toLowerCase()
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}


