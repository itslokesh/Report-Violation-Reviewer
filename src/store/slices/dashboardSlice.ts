import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { DashboardStats, AnalyticsFilter } from '../../shared/models/dashboard';
import { WebApiService } from '../../web/services/WebApiService';

// Async thunks
export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async (filter?: AnalyticsFilter, { rejectWithValue }) => {
    try {
      const apiService = new WebApiService();
      const response = await apiService.get('/police/dashboard', filter);
      
      if (response.success && response.data) {
        // Transform backend response to match our DashboardStats interface
        const stats: DashboardStats = {
          totalReports: response.data.totalReports || 0,
          pendingReports: response.data.pendingReports || 0,
          approvedReports: response.data.approvedReports || 0,
          rejectedReports: response.data.rejectedReports || 0,
          duplicateReports: response.data.duplicateReports || 0,
          processedToday: (response.data.approvedReports || 0) + (response.data.rejectedReports || 0),
          approvedToday: response.data.approvedReports || 0,
          rejectedToday: response.data.rejectedReports || 0,
          averageProcessingTime: 1800, // Default 30 minutes
          weeklyTrend: [], // Will be populated separately
          monthlyTrend: [], // Will be populated separately
          reportsByViolationType: response.data.reportsByViolationType || {},
          reportsByCity: response.data.reportsByCity || {},
          reportsByStatus: response.data.reportsByStatus || {}
        };
        return stats;
      } else {
        throw new Error(response.message || 'Failed to fetch dashboard stats');
      }
    } catch (error) {
      return rejectWithValue(`Failed to fetch dashboard stats: ${(error as Error).message}`);
    }
  }
);

export const fetchViolationTypeStats = createAsyncThunk(
  'dashboard/fetchViolationTypeStats',
  async (filter?: AnalyticsFilter, { rejectWithValue }) => {
    try {
      const apiService = new WebApiService();
      const response = await apiService.get('/police/dashboard/violation-types', filter);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch violation type stats');
      }
    } catch (error) {
      return rejectWithValue(`Failed to fetch violation type stats: ${(error as Error).message}`);
    }
  }
);

export const fetchGeographicStats = createAsyncThunk(
  'dashboard/fetchGeographicStats',
  async (filter?: AnalyticsFilter, { rejectWithValue }) => {
    try {
      const apiService = new WebApiService();
      const response = await apiService.get('/police/dashboard/geographic', filter);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch geographic stats');
      }
    } catch (error) {
      return rejectWithValue(`Failed to fetch geographic stats: ${(error as Error).message}`);
    }
  }
);

export const fetchOfficerPerformance = createAsyncThunk(
  'dashboard/fetchOfficerPerformance',
  async (filter?: AnalyticsFilter, { rejectWithValue }) => {
    try {
      const apiService = new WebApiService();
      const response = await apiService.get('/police/dashboard/officer-performance', filter);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch officer performance stats');
      }
    } catch (error) {
      return rejectWithValue(`Failed to fetch officer performance stats: ${(error as Error).message}`);
    }
  }
);

// State interface
interface DashboardState {
  stats: DashboardStats | null;
  violationTypeStats: any[];
  geographicStats: any[];
  officerPerformance: any[];
  filters: AnalyticsFilter | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

// Initial state
const initialState: DashboardState = {
  stats: null,
  violationTypeStats: [],
  geographicStats: [],
  officerPerformance: [],
  filters: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Dashboard slice
const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<AnalyticsFilter>) => {
      state.filters = action.payload;
    },
    clearFilters: (state) => {
      state.filters = null;
    },
    updateStatsOptimistically: (state, action: PayloadAction<Partial<DashboardStats>>) => {
      if (state.stats) {
        state.stats = { ...state.stats, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch dashboard stats
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action: PayloadAction<DashboardStats>) => {
        state.isLoading = false;
        state.stats = action.payload;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch violation type stats
    builder
      .addCase(fetchViolationTypeStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchViolationTypeStats.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.isLoading = false;
        state.violationTypeStats = action.payload;
      })
      .addCase(fetchViolationTypeStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch geographic stats
    builder
      .addCase(fetchGeographicStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGeographicStats.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.isLoading = false;
        state.geographicStats = action.payload;
      })
      .addCase(fetchGeographicStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch officer performance
    builder
      .addCase(fetchOfficerPerformance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOfficerPerformance.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.isLoading = false;
        state.officerPerformance = action.payload;
      })
      .addCase(fetchOfficerPerformance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const {
  clearError,
  setFilters,
  clearFilters,
  updateStatsOptimistically,
} = dashboardSlice.actions;

// Export selectors
export const selectDashboardStats = (state: { dashboard: DashboardState }) => ({
  stats: state.dashboard.stats,
  loading: state.dashboard.isLoading,
  error: state.dashboard.error
});

export const selectViolationTypeStats = (state: { dashboard: DashboardState }) => ({
  stats: state.dashboard.violationTypeStats,
  loading: state.dashboard.isLoading,
  error: state.dashboard.error
});

export const selectGeographicStats = (state: { dashboard: DashboardState }) => ({
  stats: state.dashboard.geographicStats,
  loading: state.dashboard.isLoading,
  error: state.dashboard.error
});

export const selectOfficerPerformance = (state: { dashboard: DashboardState }) => ({
  stats: state.dashboard.officerPerformance,
  loading: state.dashboard.isLoading,
  error: state.dashboard.error
});

export const selectDashboardFilters = (state: { dashboard: DashboardState }) => 
  state.dashboard.filters;

export const selectDashboardLoading = (state: { dashboard: DashboardState }) => 
  state.dashboard.isLoading;

export const selectDashboardError = (state: { dashboard: DashboardState }) => 
  state.dashboard.error;

export const selectDashboardLastUpdated = (state: { dashboard: DashboardState }) => 
  state.dashboard.lastUpdated;

// Export reducer
export default dashboardSlice.reducer;
