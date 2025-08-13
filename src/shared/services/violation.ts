import { 
  ViolationReport, 
  ViolationReportCreate, 
  ViolationReportUpdate, 
  ViolationReportFilter 
} from '../models/violation';
import { BaseRepository } from './api';
import { SeverityLevel, ViolationType, ReportStatus } from '../models/common';

export class ViolationService extends BaseRepository<
  ViolationReport,
  ViolationReportCreate,
  ViolationReportUpdate,
  ViolationReportFilter
> {
  constructor(apiService: any) {
    super(apiService, '/violations');
  }

  // Business logic methods that can be shared between platforms
  async getPendingReports(params?: ViolationReportFilter): Promise<ViolationReport[]> {
    const response = await this.getAll({
      ...params,
      status: [ReportStatus.PENDING]
    });
    return response.data;
  }

  async getReportsBySeverity(severity: SeverityLevel, params?: ViolationReportFilter): Promise<ViolationReport[]> {
    const response = await this.getAll({
      ...params,
      severity: [severity]
    });
    return response.data;
  }

  async getReportsByViolationType(type: ViolationType, params?: ViolationReportFilter): Promise<ViolationReport[]> {
    const response = await this.getAll({
      ...params,
      violationType: [type]
    });
    return response.data;
  }

  async approveReport(reportId: number, reviewNotes?: string, challanNumber?: string): Promise<ViolationReport> {
    const updateData: ViolationReportUpdate = {
      status: ReportStatus.APPROVED,
      reviewNotes,
      challanIssued: !!challanNumber,
      challanNumber,
      reviewTimestamp: new Date()
    };
    return this.update(reportId, updateData);
  }

  async rejectReport(reportId: number, reviewNotes: string): Promise<ViolationReport> {
    const updateData: ViolationReportUpdate = {
      status: ReportStatus.REJECTED,
      reviewNotes,
      reviewTimestamp: new Date()
    };
    return this.update(reportId, updateData);
  }

  async markAsDuplicate(reportId: number, duplicateGroupId: string, confidenceScore: number): Promise<ViolationReport> {
    const updateData: ViolationReportUpdate = {
      status: ReportStatus.DUPLICATE,
      reviewNotes: `Marked as duplicate with confidence score: ${confidenceScore}%`,
      reviewTimestamp: new Date()
    };
    return this.update(reportId, updateData);
  }

  async assignToReviewer(reportId: number, reviewerId: string): Promise<ViolationReport> {
    const updateData: ViolationReportUpdate = {
      status: ReportStatus.UNDER_REVIEW,
      reviewerId,
      reviewTimestamp: new Date()
    };
    return this.update(reportId, updateData);
  }

  async getDuplicateReports(reportId: number): Promise<ViolationReport[]> {
    const response = await this.apiService.get<ViolationReport[]>(`${this.endpoint}/${reportId}/duplicates`);
    return response.data!;
  }

  async getReportsByLocation(latitude: number, longitude: number, radiusKm: number = 1): Promise<ViolationReport[]> {
    const response = await this.apiService.get<ViolationReport[]>(`${this.endpoint}/nearby`, {
      latitude,
      longitude,
      radius: radiusKm
    });
    return response.data!;
  }

  async getReportsByVehicle(vehicleNumber: string): Promise<ViolationReport[]> {
    const response = await this.getAll({
      searchTerm: vehicleNumber
    });
    return response.data.filter(report => 
      report.vehicleNumber?.toLowerCase().includes(vehicleNumber.toLowerCase())
    );
  }

  async getReportsByReporter(reporterId: string): Promise<ViolationReport[]> {
    const response = await this.getAll({
      reporterId
    });
    return response.data;
  }

  async getReportsByReviewer(reviewerId: string): Promise<ViolationReport[]> {
    const response = await this.getAll({
      reviewerId
    });
    return response.data;
  }

  async getProcessingStats(): Promise<{
    total: number;
    pending: number;
    underReview: number;
    approved: number;
    rejected: number;
    duplicate: number;
  }> {
    const response = await this.apiService.get<{
      total: number;
      pending: number;
      underReview: number;
      approved: number;
      rejected: number;
      duplicate: number;
    }>(`${this.endpoint}/stats`);
    return response.data!;
  }

  async getViolationTypeStats(): Promise<Array<{
    type: ViolationType;
    count: number;
    percentage: number;
  }>> {
    const response = await this.apiService.get<Array<{
      type: ViolationType;
      count: number;
      percentage: number;
    }>>(`${this.endpoint}/stats/violation-types`);
    return response.data!;
  }

  async getSeverityStats(): Promise<Array<{
    severity: SeverityLevel;
    count: number;
    percentage: number;
  }>> {
    const response = await this.apiService.get<Array<{
      severity: SeverityLevel;
      count: number;
      percentage: number;
    }>>(`${this.endpoint}/stats/severity`);
    return response.data!;
  }

  async exportReports(filter: ViolationReportFilter, format: 'csv' | 'json' | 'pdf' = 'csv'): Promise<string> {
    const response = await this.apiService.post<{ downloadUrl: string }>(`${this.endpoint}/export`, {
      filter,
      format
    });
    return response.data!.downloadUrl;
  }

  async bulkUpdateStatus(reportIds: number[], status: ReportStatus, reviewNotes?: string): Promise<void> {
    await this.apiService.post(`${this.endpoint}/bulk-update`, {
      reportIds,
      status,
      reviewNotes
    });
  }

  async getReportHistory(reportId: number): Promise<Array<{
    action: string;
    timestamp: Date;
    userId: string;
    userName: string;
    details: string;
  }>> {
    const response = await this.apiService.get<Array<{
      action: string;
      timestamp: Date;
      userId: string;
      userName: string;
      details: string;
    }>>(`${this.endpoint}/${reportId}/history`);
    return response.data!;
  }
}
