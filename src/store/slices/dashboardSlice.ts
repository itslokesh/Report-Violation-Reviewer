import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { DashboardStats, AnalyticsFilter, WeeklyTrendData, MonthlyTrendData } from '../../shared/models/dashboard';
import { ViolationType } from '../../shared/models/common';
import { WebApiService } from '../../web/services/WebApiService';

// Async thunks
export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async (filter: AnalyticsFilter | undefined, thunkApi) => {
    try {
      const apiService = new WebApiService();
      const response = await apiService.get('/police/dashboard', filter);
      
      if (response.success && response.data) {
        // Pass through and normalize trend arrays if present
        const weeklyTrend: WeeklyTrendData[] = (response.data.weeklyTrend || []).map((t: any) => ({
          date: t.date,
          reports: t.reports ?? 0,
          approved: t.approved ?? 0,
          rejected: t.rejected ?? 0,
          pending: t.pending ?? 0,
        }));

        const monthlyTrend: MonthlyTrendData[] = (response.data.monthlyTrend || []).map((t: any) => ({
          month: t.month,
          reports: t.reports ?? 0,
          approved: t.approved ?? 0,
          rejected: t.rejected ?? 0,
          pending: t.pending ?? 0,
          revenue: t.revenue ?? 0,
        }));

        const stats: DashboardStats = {
          totalReports: response.data.totalReports || 0,
          pendingReports: response.data.pendingReports || 0,
          approvedReports: response.data.approvedReports || 0,
          rejectedReports: response.data.rejectedReports || 0,
          duplicateReports: response.data.duplicateReports || 0,
          processedToday: (response.data.approvedReports || 0) + (response.data.rejectedReports || 0),
          approvedToday: response.data.approvedReports || 0,
          rejectedToday: response.data.rejectedReports || 0,
          averageProcessingTime: response.data.averageProcessingTime ?? 1800,
          weeklyTrend,
          monthlyTrend,
          reportsByViolationType: response.data.reportsByViolationType || {},
          reportsByCity: response.data.reportsByCity || {},
          reportsByStatus: response.data.reportsByStatus || {}
        };
        return stats;
      } else {
        throw new Error(response.message || 'Failed to fetch dashboard stats');
      }
    } catch (error) {
      return thunkApi.rejectWithValue(`Failed to fetch dashboard stats: ${(error as Error).message}`);
    }
  }
);

export const fetchViolationTypeStats = createAsyncThunk(
  'dashboard/fetchViolationTypeStats',
  async (filter: AnalyticsFilter | undefined, thunkApi) => {
    try {
      const apiService = new WebApiService();
      const response = await apiService.get('/police/dashboard/violation-types', filter);
      
      if (response.success && response.data) {
        // Backend returns { violationType, count, percentage, trend?, previousPeriod? }
        // Map to { type, count, percentage, trend }
        const VIOLATION_CODE_TO_ENUM_VALUE: Record<string, ViolationType> = {
          WRONG_SIDE_DRIVING: ViolationType.WRONG_SIDE_DRIVING,
          NO_PARKING_ZONE: ViolationType.NO_PARKING_ZONE,
          SIGNAL_JUMPING: ViolationType.SIGNAL_JUMPING,
          SPEED_VIOLATION: ViolationType.SPEED_VIOLATION,
          HELMET_SEATBELT_VIOLATION: ViolationType.HELMET_SEATBELT_VIOLATION,
          MOBILE_PHONE_USAGE: ViolationType.MOBILE_PHONE_USAGE,
          LANE_CUTTING: ViolationType.LANE_CUTTING,
          DRUNK_DRIVING_SUSPECTED: ViolationType.DRUNK_DRIVING_SUSPECTED,
          OTHERS: ViolationType.OTHERS,
        };

        const mapped = (response.data as any[]).map(item => ({
          type: VIOLATION_CODE_TO_ENUM_VALUE[item.violationType] ?? ViolationType.OTHERS,
          count: item.count ?? 0,
          percentage: item.percentage ?? 0,
          trend: item.trend ?? 'stable',
        }));
        return mapped;
      } else {
        throw new Error(response.message || 'Failed to fetch violation type stats');
      }
    } catch (error) {
      return thunkApi.rejectWithValue(`Failed to fetch violation type stats: ${(error as Error).message}`);
    }
  }
);

export const fetchGeographicStats = createAsyncThunk(
  'dashboard/fetchGeographicStats',
  async (filter: AnalyticsFilter | undefined, thunkApi) => {
    try {
      const apiService = new WebApiService();
      const params = { ...(filter || {}), includeAllHotspots: true } as Record<string, any>;
      const response = await apiService.get('/police/dashboard/geographic', params);
      
      if (response.success && response.data) {
        // Normalize violationTypes to our ViolationType enum values if backend sends codes
        const CODE_TO_ENUM_VALUE: Record<string, ViolationType> = {
          WRONG_SIDE_DRIVING: ViolationType.WRONG_SIDE_DRIVING,
          NO_PARKING_ZONE: ViolationType.NO_PARKING_ZONE,
          SIGNAL_JUMPING: ViolationType.SIGNAL_JUMPING,
          SPEED_VIOLATION: ViolationType.SPEED_VIOLATION,
          HELMET_SEATBELT_VIOLATION: ViolationType.HELMET_SEATBELT_VIOLATION,
          MOBILE_PHONE_USAGE: ViolationType.MOBILE_PHONE_USAGE,
          LANE_CUTTING: ViolationType.LANE_CUTTING,
          DRUNK_DRIVING_SUSPECTED: ViolationType.DRUNK_DRIVING_SUSPECTED,
          OTHERS: ViolationType.OTHERS,
        };

        const normalizeHotspot = (h: any) => {
          const lat = Number(h.latitude ?? h.lat ?? h.latitute ?? h.y ?? 0);
          const lng = Number(h.longitude ?? h.lng ?? h.lon ?? h.x ?? 0);
          const address = h.address ?? h.location ?? h.name ?? h.label ?? 'Location';
          const violationCount = Number(h.violationCount ?? h.count ?? h.reports ?? 1);
          const violationTypes = (h.violationTypes || h.types || h.tags || [])
            .map((t: string) => CODE_TO_ENUM_VALUE[t] ?? t);
          return { latitude: lat, longitude: lng, address, violationCount, violationTypes };
        };

        const mapped = (response.data as any[]).map((geo) => ({
          city: geo.city ?? geo.name ?? geo.region ?? 'Area',
          district: geo.district ?? geo.subregion ?? '',
          reports: Number(geo.reports ?? geo.count ?? 0),
          approved: Number(geo.approved ?? 0),
          rejected: Number(geo.rejected ?? 0),
          hotspots: ((geo.hotspots ?? geo.points ?? geo.locations ?? []) as any[]).map(normalizeHotspot),
        }));
        return mapped;
      } else {
        throw new Error(response.message || 'Failed to fetch geographic stats');
      }
    } catch (error) {
      return thunkApi.rejectWithValue(`Failed to fetch geographic stats: ${(error as Error).message}`);
    }
  }
);

export const fetchOfficerPerformance = createAsyncThunk(
  'dashboard/fetchOfficerPerformance',
  async (filter: AnalyticsFilter | undefined, thunkApi) => {
    try {
      const apiService = new WebApiService();
      const response = await apiService.get('/police/dashboard/officer-performance', filter);
      
      if (response.success && response.data) {
        // Backend now includes: processed, approved, rejected, averageProcessingTime, challansIssued
        // Map to chart-friendly shape expected by OfficerPerformanceChart
        const mapped = (response.data as any[]).map(item => {
          const processed = item.processed ?? item.reportsProcessed ?? 0;
          const approved = item.approved ?? 0;
          const rejected = item.rejected ?? 0;
          const approvalRate = processed > 0 ? approved / processed : 0;
          const accuracyBase = approved + rejected;
          const accuracyRate = accuracyBase > 0 ? approved / accuracyBase : approvalRate;
          return {
            officerId: item.officerId ?? item.id ?? '',
            officerName: item.officerName ?? item.name ?? 'Officer',
            badgeNumber: item.badgeNumber ?? item.badge ?? '',
            reportsProcessed: processed,
            averageProcessingTime: item.averageProcessingTime ?? 0,
            approvalRate,
            accuracyRate,
            challansIssued: item.challansIssued ?? 0,
          };
        });
        return mapped;
      } else {
        throw new Error(response.message || 'Failed to fetch officer performance stats');
      }
    } catch (error) {
      return thunkApi.rejectWithValue(`Failed to fetch officer performance stats: ${(error as Error).message}`);
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
