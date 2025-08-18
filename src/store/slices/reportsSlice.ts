import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ViolationReport, ViolationReportFilter, ViolationReportUpdate } from '../../shared/models/violation';
import { PaginatedResponse } from '../../shared/models/common';
import { WebApiService } from '../../web/services/WebApiService';

// Async thunks
export const fetchReports = createAsyncThunk(
  'reports/fetchReports',
  async (params?: ViolationReportFilter & { page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }, { rejectWithValue }) => {
    try {
      const apiService = new WebApiService();
      // Normalize filter params to backend expectations
      const queryParams: Record<string, any> = { ...(params || {}) };
      if (queryParams && Array.isArray((queryParams as any).violationType)) {
        const selected = (queryParams as any).violationType as string[];
        if (selected.length <= 1) {
          // Backward-compatible single type
          (queryParams as any).violationType = selected[0] ?? undefined;
          delete (queryParams as any).violationTypes;
          if (selected.length === 0) delete (queryParams as any).violationType;
        } else {
          // Multiple: send as violationTypes and include mode=any
          delete (queryParams as any).violationType;
          (queryParams as any).violationTypes = selected;
          if (!(queryParams as any).violationTypeMode) {
            (queryParams as any).violationTypeMode = 'any';
          }
        }
      }

      if (queryParams && Array.isArray((queryParams as any).status)) {
        const selectedStatuses = (queryParams as any).status as string[];
        if (selectedStatuses.length <= 1) {
          // Single status for backward compatibility
          (queryParams as any).status = selectedStatuses[0] ?? undefined;
          delete (queryParams as any).statuses;
          if (selectedStatuses.length === 0) delete (queryParams as any).status;
        } else {
          // Multiple statuses: send as statuses[]=... and rely on default union (any)
          delete (queryParams as any).status;
          (queryParams as any).statuses = selectedStatuses;
          // Optional: (queryParams as any).statusMode = 'any'; // backend defaults to any
        }
      }

      const response = await apiService.get('/police/reports', queryParams);
      
      if (response.success && response.data) {
        // Backend shape: { reports: ViolationReport[], pagination: { page, limit, total, pages } }
        const backendData: any = response.data;
        const paginated = {
          data: backendData.reports ?? [],
          total: backendData.pagination?.total ?? (backendData.reports?.length ?? 0),
          page: backendData.pagination?.page ?? (params?.page ?? 1),
          limit: backendData.pagination?.limit ?? (params?.limit ?? 20),
          totalPages: backendData.pagination?.pages ?? 1,
        } as PaginatedResponse<ViolationReport>;
        return paginated;
      } else {
        throw new Error(response.message || 'Failed to fetch reports');
      }
    } catch (error) {
      return rejectWithValue(`Failed to fetch reports: ${(error as Error).message}`);
    }
  }
);

export const fetchReportById = createAsyncThunk(
  'reports/fetchReportById',
  async (id: number, { rejectWithValue }) => {
    try {
      const apiService = new WebApiService();
      const response = await apiService.get(`/police/reports/${id}`);
      
      if (response.success && response.data) {
        return response.data.report;
      } else {
        throw new Error(response.message || 'Failed to fetch report');
      }
    } catch (error) {
      return rejectWithValue(`Failed to fetch report: ${(error as Error).message}`);
    }
  }
);

export const updateReport = createAsyncThunk(
  'reports/updateReport',
  async ({ id, updateData }: { id: number; updateData: ViolationReportUpdate }, { rejectWithValue }) => {
    try {
      const apiService = new WebApiService();
      const response = await apiService.put(`/police/reports/${id}`, updateData);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update report');
      }
    } catch (error) {
      return rejectWithValue(`Failed to update report: ${(error as Error).message}`);
    }
  }
);

export const approveReport = createAsyncThunk(
  'reports/approveReport',
  async ({ id, reviewNotes, challanNumber }: { id: number; reviewNotes?: string; challanNumber?: string }, { rejectWithValue }) => {
    try {
      const apiService = new WebApiService();
      const response = await apiService.put(`/police/reports/${id}/status`, {
        status: 'APPROVED',
        reviewNotes,
        challanIssued: true,
        challanNumber
      });
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to approve report');
      }
    } catch (error) {
      return rejectWithValue(`Failed to approve report: ${(error as Error).message}`);
    }
  }
);

export const rejectReport = createAsyncThunk(
  'reports/rejectReport',
  async ({ id, reviewNotes }: { id: number; reviewNotes: string }, { rejectWithValue }) => {
    try {
      const apiService = new WebApiService();
      const response = await apiService.put(`/police/reports/${id}/status`, {
        status: 'REJECTED',
        reviewNotes
      });
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to reject report');
      }
    } catch (error) {
      return rejectWithValue(`Failed to reject report: ${(error as Error).message}`);
    }
  }
);

export const markAsDuplicate = createAsyncThunk(
  'reports/markAsDuplicate',
  async ({ id, duplicateGroupId, confidenceScore }: { id: number; duplicateGroupId: string; confidenceScore: number }, { rejectWithValue }) => {
    try {
      const apiService = new WebApiService();
      const response = await apiService.put(`/police/reports/${id}/status`, {
        status: 'DUPLICATE',
        duplicateGroupId,
        confidenceScore
      });
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to mark report as duplicate');
      }
    } catch (error) {
      return rejectWithValue(`Failed to mark report as duplicate: ${(error as Error).message}`);
    }
  }
);

export const fetchPendingReports = createAsyncThunk(
  'reports/fetchPendingReports',
  async (params?: ViolationReportFilter, { rejectWithValue }) => {
    try {
      const apiService = new WebApiService();
      const response = await apiService.get('/police/reports', { ...params, status: 'PENDING' });
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch pending reports');
      }
    } catch (error) {
      return rejectWithValue(`Failed to fetch pending reports: ${(error as Error).message}`);
    }
  }
);

// Note: Bulk update functionality removed as it's not a valid use case

// State interface
interface ReportsState {
  entities: Record<number, ViolationReport>;
  ids: number[];
  currentReport: ViolationReport | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
  filters: ViolationReportFilter | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  // selectedReports: number[]; // Removed as bulk operations are not needed
}

// Initial state
const initialState: ReportsState = {
  entities: {},
  ids: [],
  currentReport: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    sortBy: 'timestamp',
    sortOrder: 'desc',
  },
  filters: null,
  isLoading: false,
  isUpdating: false,
  error: null,
  // selectedReports: [], // Removed as bulk operations are not needed
};

// Helper function to normalize reports
const normalizeReports = (reports: ViolationReport[]) => {
  const entities: Record<number, ViolationReport> = {};
  const ids: number[] = [];
  
  reports.forEach(report => {
    entities[report.id] = report;
    ids.push(report.id);
  });
  
  return { entities, ids };
};

// Reports slice
const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentReport: (state) => {
      state.currentReport = null;
    },
    setFilters: (state, action: PayloadAction<ViolationReportFilter>) => {
      state.filters = action.payload;
      state.pagination.page = 1; // Reset to first page when filters change
    },
    clearFilters: (state) => {
      state.filters = null;
      state.pagination.page = 1;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    setLimit: (state, action: PayloadAction<number>) => {
      state.pagination.limit = action.payload;
      state.pagination.page = 1; // Reset to first page when limit changes
    },
    setSort: (state, action: PayloadAction<{ sortBy: string; sortOrder: 'asc' | 'desc' }>) => {
      state.pagination.sortBy = action.payload.sortBy;
      state.pagination.sortOrder = action.payload.sortOrder;
      state.pagination.page = 1; // Reset page when sort changes
    },
    // Note: Bulk selection functionality removed as bulk operations are not needed
    updateReportOptimistically: (state, action: PayloadAction<{ id: number; updates: Partial<ViolationReport> }>) => {
      const { id, updates } = action.payload;
      if (state.entities[id]) {
        state.entities[id] = { ...state.entities[id], ...updates };
      }
      if (state.currentReport?.id === id) {
        state.currentReport = { ...state.currentReport, ...updates };
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch reports
    builder
      .addCase(fetchReports.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReports.fulfilled, (state, action: PayloadAction<PaginatedResponse<ViolationReport>>) => {
        state.isLoading = false;
        const { entities, ids } = normalizeReports(action.payload.data);
        state.entities = { ...state.entities, ...entities };
        state.ids = ids;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
          sortBy: state.pagination.sortBy,
          sortOrder: state.pagination.sortOrder,
        };
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch report by ID
    builder
      .addCase(fetchReportById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReportById.fulfilled, (state, action: PayloadAction<ViolationReport>) => {
        state.isLoading = false;
        state.currentReport = action.payload;
        state.entities[action.payload.id] = action.payload;
      })
      .addCase(fetchReportById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update report
    builder
      .addCase(updateReport.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateReport.fulfilled, (state, action: PayloadAction<ViolationReport>) => {
        state.isUpdating = false;
        state.entities[action.payload.id] = action.payload;
        if (state.currentReport?.id === action.payload.id) {
          state.currentReport = action.payload;
        }
      })
      .addCase(updateReport.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });

    // Approve report
    builder
      .addCase(approveReport.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(approveReport.fulfilled, (state, action: PayloadAction<ViolationReport>) => {
        state.isUpdating = false;
        state.entities[action.payload.id] = action.payload;
        if (state.currentReport?.id === action.payload.id) {
          state.currentReport = action.payload;
        }
      })
      .addCase(approveReport.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });

    // Reject report
    builder
      .addCase(rejectReport.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(rejectReport.fulfilled, (state, action: PayloadAction<ViolationReport>) => {
        state.isUpdating = false;
        state.entities[action.payload.id] = action.payload;
        if (state.currentReport?.id === action.payload.id) {
          state.currentReport = action.payload;
        }
      })
      .addCase(rejectReport.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });

    // Mark as duplicate
    builder
      .addCase(markAsDuplicate.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(markAsDuplicate.fulfilled, (state, action: PayloadAction<ViolationReport>) => {
        state.isUpdating = false;
        state.entities[action.payload.id] = action.payload;
        if (state.currentReport?.id === action.payload.id) {
          state.currentReport = action.payload;
        }
      })
      .addCase(markAsDuplicate.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });

    // Note: Bulk update reducers removed as bulk operations are not needed
  },
});

// Export actions
export const {
  clearError,
  clearCurrentReport,
  setFilters,
  clearFilters,
  setPage,
  setLimit,
  setSort,
  updateReportOptimistically,
} = reportsSlice.actions;

// Export selectors
export const selectReports = (state: { reports: ReportsState }) => 
  state.reports.ids.map(id => state.reports.entities[id]);

export const selectReportById = (state: { reports: ReportsState }, id: number) => 
  state.reports.entities[id];

export const selectCurrentReport = (state: { reports: ReportsState }) => 
  state.reports.currentReport;

export const selectReportsPagination = (state: { reports: ReportsState }) => 
  state.reports.pagination;

export const selectReportsFilters = (state: { reports: ReportsState }) => 
  state.reports.filters;

export const selectReportsLoading = (state: { reports: ReportsState }) => 
  state.reports.isLoading;

export const selectReportsUpdating = (state: { reports: ReportsState }) => 
  state.reports.isUpdating;

export const selectReportsError = (state: { reports: ReportsState }) => 
  state.reports.error;

// Note: Bulk selection selectors removed as bulk operations are not needed

// Export reducer
export default reportsSlice.reducer;
