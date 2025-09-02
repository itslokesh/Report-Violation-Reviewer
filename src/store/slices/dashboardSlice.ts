import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { DashboardStats, AnalyticsFilter, WeeklyTrendData, MonthlyTrendData } from '../../shared/models/dashboard';
import { ViolationType } from '../../shared/models/common';
import { WebApiService } from '../../web/services/WebApiService';

// Async thunks
export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async (filter: AnalyticsFilter | undefined, thunkApi) => {
    try {
      const apiService = new WebApiService();
      const state = (thunkApi.getState() as any).dashboard;
      const globalTimeRange = state.globalTimeRange;
      
      // Build parameters for the new overview endpoint
      let params: Record<string, any> = {};
      
      // Check if filter has dateRange (local time range from component)
      if (filter && filter.dateRange) {
        console.log('fetchDashboardStats: Using filter dateRange:', filter.dateRange);
        params.dateFrom = filter.dateRange.start.toISOString().split('T')[0];
        params.dateTo = filter.dateRange.end.toISOString().split('T')[0];
      } else if (globalTimeRange.isApplied) {
        // Use global time range if no local filter
        if (globalTimeRange.type === 'absolute') {
          params.dateFrom = globalTimeRange.startDate;
          params.dateTo = globalTimeRange.endDate;
        } else {
          // Convert relative range to days
          switch (globalTimeRange.relativeRange) {
            case '1d':
              params.days = 1;
              break;
            case '7d':
              params.days = 7;
              break;
            case '30d':
              params.days = 30;
              break;
            case '90d':
              params.days = 90;
              break;
            case '1y':
              params.days = 365;
              break;
            case 'ytd':
              params.dateFrom = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
              params.dateTo = new Date().toISOString().split('T')[0];
              break;
            case 'mtd':
              params.dateFrom = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
              params.dateTo = new Date().toISOString().split('T')[0];
              break;
            default:
              params.days = 30; // Default to 30 days
          }
        }
      } else {
        params.days = 30; // Default to 30 days
      }
      
             const response = await apiService.get('/police/dashboard/overview', params);
      
      if (response.success && response.data) {
        const data = response.data as any;
        const stats: DashboardStats = {
          totalReports: data.totalReports || 0,
          pendingReports: data.pendingReports || 0,
          processedToday: (data.processedToday || 0),
          approvedToday: data.approvedToday || 0,
          rejectedToday: data.rejectedToday || 0,
          averageProcessingTime: Math.max(0, data.averageProcessingTime ?? 1800),
          topViolationTypes: data.topViolationTypes || [],
          weeklyTrend: [], // Will be fetched separately
          monthlyTrend: [], // Will be fetched separately
          geographicStats: [],
          officerPerformance: []
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

// Helper function to build time range parameters
const buildTimeRangeParams = (timeRange: any) => {
  const params: Record<string, any> = {};
  
  if (timeRange.isApplied) {
    if (timeRange.type === 'absolute') {
      params.dateFrom = timeRange.startDate;
      params.dateTo = timeRange.endDate;
    } else {
      // Convert relative range to days
      switch (timeRange.relativeRange) {
        case '1d':
          params.days = 1;
          break;
        case '7d':
          params.days = 7;
          break;
        case '30d':
          params.days = 30;
          break;
        case '90d':
          params.days = 90;
          break;
        case '1y':
          params.days = 365;
          break;
        case 'ytd':
          params.dateFrom = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
          params.dateTo = new Date().toISOString().split('T')[0];
          break;
        case 'mtd':
          params.dateFrom = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
          params.dateTo = new Date().toISOString().split('T')[0];
          break;
        default:
          params.days = 30; // Default to 30 days
      }
    }
  } else {
    params.days = 30; // Default to 30 days
  }
  
  return params;
};

export const fetchWeeklyTrend = createAsyncThunk(
  'dashboard/fetchWeeklyTrend',
  async (timeRange: any, thunkApi) => {
    try {
      const apiService = new WebApiService();
      const state = (thunkApi.getState() as any).dashboard;
      const globalTimeRange = state.globalTimeRange;
      const localTimeRange = state.localTimeRange;
      
      // Use local time range if applied, otherwise use global time range
      const effectiveTimeRange = localTimeRange.isApplied ? localTimeRange : globalTimeRange;
      const params = buildTimeRangeParams(effectiveTimeRange);
      
             const response = await apiService.get('/police/dashboard/weekly-trend', params);
      
      if (response.success && response.data) {
        const weeklyTrend: WeeklyTrendData[] = (response.data as any[]).map((t: any) => ({
          date: t.date,
          reports: t.reports ?? 0,
          approved: t.approved ?? 0,
          rejected: t.rejected ?? 0,
          pending: t.pending ?? 0,
        }));
        return weeklyTrend;
      } else {
        throw new Error(response.message || 'Failed to fetch weekly trend');
      }
    } catch (error) {
      return thunkApi.rejectWithValue(`Failed to fetch weekly trend: ${(error as Error).message}`);
    }
  }
);

export const fetchMonthlyTrend = createAsyncThunk(
  'dashboard/fetchMonthlyTrend',
  async (timeRange: any, thunkApi) => {
    try {
      const apiService = new WebApiService();
      const state = (thunkApi.getState() as any).dashboard;
      const globalTimeRange = state.globalTimeRange;
      const localTimeRange = state.localTimeRange;
      
      // Use local time range if applied, otherwise use global time range
      const effectiveTimeRange = localTimeRange.isApplied ? localTimeRange : globalTimeRange;
      const params = buildTimeRangeParams(effectiveTimeRange);
      
             const response = await apiService.get('/police/dashboard/monthly-trend', params);
      
      if (response.success && response.data) {
        const monthlyTrend: MonthlyTrendData[] = (response.data as any[]).map((t: any) => ({
          month: t.month,
          reports: t.reports ?? 0,
          approved: t.approved ?? 0,
          rejected: t.rejected ?? 0,
          pending: t.pending ?? 0,
          revenue: t.revenue ?? 0,
        }));
        return monthlyTrend;
      } else {
        throw new Error(response.message || 'Failed to fetch monthly trend');
      }
    } catch (error) {
      return thunkApi.rejectWithValue(`Failed to fetch monthly trend: ${(error as Error).message}`);
    }
  }
);

export const fetchViolationTypeStats = createAsyncThunk(
  'dashboard/fetchViolationTypeStats',
  async (timeRange: any, thunkApi) => {
    try {
      const apiService = new WebApiService();
      const state = (thunkApi.getState() as any).dashboard;
      const globalTimeRange = state.globalTimeRange;
      const localTimeRange = state.localTimeRange;
      
      // Use local time range if applied, otherwise use global time range
      const effectiveTimeRange = localTimeRange.isApplied ? localTimeRange : globalTimeRange;
      const params = buildTimeRangeParams(effectiveTimeRange);
      
             const response = await apiService.get('/police/dashboard/violation-types-trend', params);
      
      if (response.success && response.data) {
        // Backend returns { violationType, count, percentage, trend?, previousPeriod? }
        // Map to { type, count, percentage, trend }
        const VIOLATION_CODE_TO_ENUM_VALUE: Record<string, ViolationType> = {
          // Exact matches
          WRONG_SIDE_DRIVING: ViolationType.WRONG_SIDE_DRIVING,
          NO_PARKING_ZONE: ViolationType.NO_PARKING_ZONE,
          SIGNAL_JUMPING: ViolationType.SIGNAL_JUMPING,
          SPEED_VIOLATION: ViolationType.SPEED_VIOLATION,
          HELMET_SEATBELT_VIOLATION: ViolationType.HELMET_SEATBELT_VIOLATION,
          MOBILE_PHONE_USAGE: ViolationType.MOBILE_PHONE_USAGE,
          LANE_CUTTING: ViolationType.LANE_CUTTING,
          DRUNK_DRIVING_SUSPECTED: ViolationType.DRUNK_DRIVING_SUSPECTED,
          OTHERS: ViolationType.OTHERS,
          
          // Common variations
          'WRONG_SIDE': ViolationType.WRONG_SIDE_DRIVING,
          'OPPOSITE_SIDE': ViolationType.WRONG_SIDE_DRIVING,
          'NO_PARKING': ViolationType.NO_PARKING_ZONE,
          'PARKING_VIOLATION': ViolationType.NO_PARKING_ZONE,
          'SIGNAL_VIOLATION': ViolationType.SIGNAL_JUMPING,
          'RED_LIGHT': ViolationType.SIGNAL_JUMPING,
          'TRAFFIC_SIGNAL': ViolationType.SIGNAL_JUMPING,
          'SPEEDING': ViolationType.SPEED_VIOLATION,
          'OVER_SPEED': ViolationType.SPEED_VIOLATION,
          'HELMET_VIOLATION': ViolationType.HELMET_SEATBELT_VIOLATION,
          'SEATBELT_VIOLATION': ViolationType.HELMET_SEATBELT_VIOLATION,
          'PHONE_USAGE': ViolationType.MOBILE_PHONE_USAGE,
          'MOBILE_USAGE': ViolationType.MOBILE_PHONE_USAGE,
          'LANE_VIOLATION': ViolationType.LANE_CUTTING,
          'DRUNK_DRIVING': ViolationType.DRUNK_DRIVING_SUSPECTED,
          'DUI': ViolationType.DRUNK_DRIVING_SUSPECTED,
        };

        
        
        // Helper function to find best match for violation type
        const findViolationTypeMatch = (violationType: string): ViolationType => {
          if (!violationType) return ViolationType.OTHERS;
          
          // First try exact match
          if (VIOLATION_CODE_TO_ENUM_VALUE[violationType]) {
            return VIOLATION_CODE_TO_ENUM_VALUE[violationType];
          }
          
          // Try case-insensitive match
          const upperType = violationType.toUpperCase();
          if (VIOLATION_CODE_TO_ENUM_VALUE[upperType]) {
            return VIOLATION_CODE_TO_ENUM_VALUE[upperType];
          }
          
          // Try partial matches
          const normalizedType = upperType.replace(/[^A-Z]/g, '');
          for (const [key, value] of Object.entries(VIOLATION_CODE_TO_ENUM_VALUE)) {
            if (normalizedType.includes(key.replace(/[^A-Z]/g, '')) || 
                key.replace(/[^A-Z]/g, '').includes(normalizedType)) {
              return value;
            }
          }
          
          return ViolationType.OTHERS;
        };
        
                 const mapped = (response.data as any[]).map(item => {
           const violationType = item.violationType;
           const mappedType = findViolationTypeMatch(violationType);
           
           // Convert violation type to human readable display name
           const getDisplayName = (type: string): string => {
             if (!type) return 'Unknown';
             
             // Convert from UPPER_CASE_WITH_UNDERSCORES to Title Case
             return type
               .toLowerCase()
               .split('_')
               .map(word => word.charAt(0).toUpperCase() + word.slice(1))
               .join(' ');
           };
           
           const displayName = getDisplayName(violationType);
           
           const result = {
             type: mappedType,
             displayName: displayName,
             count: item.total ?? 0, // Fixed: use item.total instead of item.count
             percentage: item.percentage ?? 0,
             trend: item.trend ?? 'stable',
           };
           
           return result;
         });
        
        
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
      const state = (thunkApi.getState() as any).dashboard;
      const globalTimeRange = state.globalTimeRange;
      
      // Build parameters for the geographic endpoint
      let params: Record<string, any> = {};
      
      // Check if filter has dateRange (local time range from component)
      if (filter && filter.dateRange) {
        console.log('fetchGeographicStats: Using filter dateRange:', filter.dateRange);
        params.dateFrom = filter.dateRange.start.toISOString().split('T')[0];
        params.dateTo = filter.dateRange.end.toISOString().split('T')[0];
      } else if (globalTimeRange.isApplied) {
        // Use global time range if no local filter
        if (globalTimeRange.type === 'absolute') {
          params.dateFrom = globalTimeRange.startDate;
          params.dateTo = globalTimeRange.endDate;
        } else {
          // Convert relative range to days
          switch (globalTimeRange.relativeRange) {
            case '1d':
              params.days = 1;
              break;
            case '7d':
              params.days = 7;
              break;
            case '30d':
              params.days = 30;
              break;
            case '90d':
              params.days = 90;
              break;
            case '1y':
              params.days = 365;
              break;
            case 'ytd':
              params.dateFrom = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
              params.dateTo = new Date().toISOString().split('T')[0];
              break;
            case 'mtd':
              params.dateFrom = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
              params.dateTo = new Date().toISOString().split('T')[0];
              break;
            default:
              params.days = 30; // Default to 30 days
          }
        }
      } else {
        params.days = 30; // Default to 30 days
      }
      
      console.log('fetchGeographicStats - Using geographic endpoint with params:', params);
      const response = await apiService.get('/police/dashboard/geographic', params);
      console.log('fetchGeographicStats - API response:', response);
      
      if (response.success && response.data) {
        const mapped = (response.data as any[]).map((geo) => ({
          city: geo.city ?? 'Unknown City',
          district: geo.district ?? 'Unknown District',
          reports: Number(geo.reports ?? 0),
          approved: Number(geo.approved ?? 0),
          rejected: Number(geo.rejected ?? 0),
          pending: Number(geo.pending ?? 0),
          hotspots: (geo.hotspots || []).map((hotspot: any) => ({
            latitude: Number(hotspot.latitude ?? 0),
            longitude: Number(hotspot.longitude ?? 0),
            address: hotspot.address ?? 'Unknown Location',
            violationCount: Number(hotspot.violationCount ?? 0),
            violationTypes: hotspot.violationTypes || [],
            statusCounts: {
              REJECTED: Number(hotspot.statusCounts?.REJECTED ?? 0),
              APPROVED: Number(hotspot.statusCounts?.APPROVED ?? 0),
              PENDING: Number(hotspot.statusCounts?.PENDING ?? 0)
            },
            district: hotspot.district ?? geo.district ?? 'Unknown District',
            isIndividual: Boolean(hotspot.isIndividual ?? false)
          })),
          individualViolations: (geo.individualViolations || []).map((violation: any) => ({
            latitude: Number(violation.latitude ?? 0),
            longitude: Number(violation.longitude ?? 0),
            address: violation.address ?? 'Unknown Location',
            violationType: violation.violationType ?? 'UNKNOWN',
            status: violation.status ?? 'PENDING',
            severity: violation.severity ?? 'MEDIUM',
            timestamp: violation.timestamp ?? new Date().toISOString(),
            district: violation.district ?? geo.district ?? 'Unknown District',
            isIndividual: Boolean(violation.isIndividual ?? true)
          })),
          totalHotspots: Number(geo.totalHotspots ?? 0),
          totalIndividualViolations: Number(geo.totalIndividualViolations ?? 0)
        }));
        
        console.log('fetchGeographicStats - Mapped data:', mapped);
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
            averageProcessingTime: Math.max(0, item.averageProcessingTime ?? 0),
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

export const fetchStatusDistribution = createAsyncThunk(
  'dashboard/fetchStatusDistribution',
  async (filter: AnalyticsFilter | undefined, thunkApi) => {
    try {
      const apiService = new WebApiService();
      const state = (thunkApi.getState() as any).dashboard;
      const globalTimeRange = state.globalTimeRange;
      
      // Build parameters for the status distribution endpoint
      let params: Record<string, any> = {};
      
      // Check if filter has dateRange (local time range from component)
      if (filter && filter.dateRange) {
        console.log('fetchStatusDistribution: Using filter dateRange:', filter.dateRange);
        params.dateFrom = filter.dateRange.start.toISOString().split('T')[0];
        params.dateTo = filter.dateRange.end.toISOString().split('T')[0];
      } else if (globalTimeRange.isApplied) {
        // Use global time range if no local filter
        if (globalTimeRange.type === 'absolute') {
          params.dateFrom = globalTimeRange.startDate;
          params.dateTo = globalTimeRange.endDate;
        } else {
          // Convert relative range to days
          switch (globalTimeRange.relativeRange) {
            case '1d':
              params.days = 1;
              break;
            case '7d':
              params.days = 7;
              break;
            case '30d':
              params.days = 30;
              break;
            case '90d':
              params.days = 90;
              break;
            case '1y':
              params.days = 365;
              break;
            case 'ytd':
              params.dateFrom = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
              params.dateTo = new Date().toISOString().split('T')[0];
              break;
            case 'mtd':
              params.dateFrom = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
              params.dateTo = new Date().toISOString().split('T')[0];
              break;
            default:
              params.days = 30; // Default to 30 days
          }
        }
      } else {
        params.days = 30; // Default to 30 days
      }
      
      console.log('fetchStatusDistribution - Using status distribution endpoint with params:', params);
      const response = await apiService.get('/police/dashboard/status-distribution', params);
      console.log('fetchStatusDistribution - API response:', response);
      
      if (response.success && response.data) {
        // The API returns an array of status objects, not a single stats object
        const statusData = response.data as any[];
        
        console.log('fetchStatusDistribution - Raw status data:', statusData);
        return statusData;
      } else {
        throw new Error(response.message || 'Failed to fetch status distribution');
      }
    } catch (error) {
      return thunkApi.rejectWithValue(`Failed to fetch status distribution: ${(error as Error).message}`);
    }
  }
);

// State interface
interface DashboardState {
  stats: DashboardStats | null;
  violationTypeStats: any[];
  geographicStats: any[];
  officerPerformance: any[];
  weeklyTrend: WeeklyTrendData[];
  monthlyTrend: MonthlyTrendData[];
  statusDistribution: any[] | null;
  statusDistributionLoading: boolean;
  filters: AnalyticsFilter | null;
  globalTimeRange: {
    type: 'absolute' | 'relative';
    startDate: string;
    endDate: string;
    relativeRange: string;
    isApplied: boolean;
  };
  localTimeRange: {
    type: 'absolute' | 'relative';
    startDate: string;
    endDate: string;
    relativeRange: string;
    isApplied: boolean;
  };
  isLoading: boolean;
  weeklyTrendLoading: boolean;
  violationTypeLoading: boolean;
  geographicStatsLoading: boolean;
  officerPerformanceLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

// Initial state
const initialState: DashboardState = {
  stats: null,
  violationTypeStats: [],
  geographicStats: [],
  officerPerformance: [],
  weeklyTrend: [],
  monthlyTrend: [],
  statusDistribution: [],
  statusDistributionLoading: false,
  filters: null,
  globalTimeRange: {
    type: 'relative',
    startDate: '',
    endDate: '',
    relativeRange: '30d',
    isApplied: true,
  },
  localTimeRange: {
    type: 'relative',
    startDate: '',
    endDate: '',
    relativeRange: '30d',
    isApplied: true,
  },
  isLoading: false,
  weeklyTrendLoading: false,
  violationTypeLoading: false,
  geographicStatsLoading: false,
  officerPerformanceLoading: false,
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
    setGlobalTimeRange: (state, action: PayloadAction<{
      type: 'absolute' | 'relative';
      startDate: string;
      endDate: string;
      relativeRange: string;
      isApplied: boolean;
    }>) => {
      state.globalTimeRange = action.payload;
    },
    clearGlobalTimeRange: (state) => {
      state.globalTimeRange = {
        type: 'relative',
        startDate: '',
        endDate: '',
        relativeRange: '30d',
        isApplied: true,
      };
    },
    setLocalTimeRange: (state, action: PayloadAction<{
      type: 'absolute' | 'relative';
      startDate: string;
      endDate: string;
      relativeRange: string;
      isApplied: boolean;
    }>) => {
      state.localTimeRange = action.payload;
    },
    clearLocalTimeRange: (state) => {
      state.localTimeRange = {
        type: 'relative',
        startDate: '',
        endDate: '',
        relativeRange: '30d',
        isApplied: true,
      };
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

    // Fetch weekly trend
    builder
      .addCase(fetchWeeklyTrend.pending, (state) => {
        state.weeklyTrendLoading = true;
        state.error = null;
      })
      .addCase(fetchWeeklyTrend.fulfilled, (state, action: PayloadAction<WeeklyTrendData[]>) => {
        state.weeklyTrendLoading = false;
        state.weeklyTrend = action.payload;
      })
      .addCase(fetchWeeklyTrend.rejected, (state, action) => {
        state.weeklyTrendLoading = false;
        state.error = action.payload as string;
      });

    // Fetch monthly trend
    builder
      .addCase(fetchMonthlyTrend.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMonthlyTrend.fulfilled, (state, action: PayloadAction<MonthlyTrendData[]>) => {
        state.isLoading = false;
        state.monthlyTrend = action.payload;
      })
      .addCase(fetchMonthlyTrend.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch violation type stats
    builder
      .addCase(fetchViolationTypeStats.pending, (state) => {
        state.violationTypeLoading = true;
        state.error = null;
      })
      .addCase(fetchViolationTypeStats.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.violationTypeLoading = false;
        state.violationTypeStats = action.payload;
      })
      .addCase(fetchViolationTypeStats.rejected, (state, action) => {
        state.violationTypeLoading = false;
        state.error = action.payload as string;
      });

    // Fetch geographic stats
    builder
      .addCase(fetchGeographicStats.pending, (state) => {
        state.geographicStatsLoading = true;
        state.error = null;
      })
      .addCase(fetchGeographicStats.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.geographicStatsLoading = false;
        state.geographicStats = action.payload;
      })
      .addCase(fetchGeographicStats.rejected, (state, action) => {
        state.geographicStatsLoading = false;
        state.error = action.payload as string;
      });

    // Fetch officer performance
    builder
      .addCase(fetchOfficerPerformance.pending, (state) => {
        state.officerPerformanceLoading = true;
        state.error = null;
      })
      .addCase(fetchOfficerPerformance.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.officerPerformanceLoading = false;
        state.officerPerformance = action.payload;
      })
      .addCase(fetchOfficerPerformance.rejected, (state, action) => {
        state.officerPerformanceLoading = false;
        state.error = action.payload as string;
      });

    // Fetch status distribution
    builder
      .addCase(fetchStatusDistribution.pending, (state) => {
        state.statusDistributionLoading = true;
        state.error = null;
      })
      .addCase(fetchStatusDistribution.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.statusDistributionLoading = false;
        state.statusDistribution = action.payload;
      })
      .addCase(fetchStatusDistribution.rejected, (state, action) => {
        state.statusDistributionLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const {
  clearError,
  setFilters,
  clearFilters,
  setGlobalTimeRange,
  clearGlobalTimeRange,
  setLocalTimeRange,
  clearLocalTimeRange,
  updateStatsOptimistically,
} = dashboardSlice.actions;

// Export selectors
export const selectDashboardStats = createSelector(
  [(state: { dashboard: DashboardState }) => state.dashboard.stats,
   (state: { dashboard: DashboardState }) => state.dashboard.isLoading,
   (state: { dashboard: DashboardState }) => state.dashboard.error],
  (stats, loading, error) => ({
    stats,
    loading,
    error
  })
);

export const selectWeeklyTrend = createSelector(
  [(state: { dashboard: DashboardState }) => state.dashboard.weeklyTrend,
   (state: { dashboard: DashboardState }) => state.dashboard.weeklyTrendLoading,
   (state: { dashboard: DashboardState }) => state.dashboard.error],
  (trend, loading, error) => ({
    trend,
    loading,
    error
  })
);

export const selectMonthlyTrend = createSelector(
  [(state: { dashboard: DashboardState }) => state.dashboard.monthlyTrend,
   (state: { dashboard: DashboardState }) => state.dashboard.isLoading,
   (state: { dashboard: DashboardState }) => state.dashboard.error],
  (trend, loading, error) => ({
    trend,
    loading,
    error
  })
);

export const selectViolationTypeStats = createSelector(
  [(state: { dashboard: DashboardState }) => state.dashboard.violationTypeStats,
   (state: { dashboard: DashboardState }) => state.dashboard.violationTypeLoading,
   (state: { dashboard: DashboardState }) => state.dashboard.error],
  (stats, loading, error) => ({
    stats,
    loading,
    error
  })
);

export const selectGeographicStats = createSelector(
  [(state: { dashboard: DashboardState }) => state.dashboard.geographicStats,
   (state: { dashboard: DashboardState }) => state.dashboard.geographicStatsLoading,
   (state: { dashboard: DashboardState }) => state.dashboard.error],
  (stats, loading, error) => ({
    stats,
    loading,
    error
  })
);

export const selectOfficerPerformance = createSelector(
  [(state: { dashboard: DashboardState }) => state.dashboard.officerPerformance,
   (state: { dashboard: DashboardState }) => state.dashboard.officerPerformanceLoading,
   (state: { dashboard: DashboardState }) => state.dashboard.error],
  (stats, loading, error) => ({
    stats,
    loading,
    error
  })
);

export const selectStatusDistribution = createSelector(
  [(state: { dashboard: DashboardState }) => state.dashboard.statusDistribution,
   (state: { dashboard: DashboardState }) => state.dashboard.statusDistributionLoading,
   (state: { dashboard: DashboardState }) => state.dashboard.error],
  (stats, loading, error) => ({
    stats,
    loading,
    error
  })
);

export const selectDashboardFilters = (state: { dashboard: DashboardState }) => 
  state.dashboard.filters;

export const selectDashboardLoading = (state: { dashboard: DashboardState }) => 
  state.dashboard.isLoading;

export const selectDashboardError = (state: { dashboard: DashboardState }) => 
  state.dashboard.error;

export const selectDashboardLastUpdated = (state: { dashboard: DashboardState }) => 
  state.dashboard.lastUpdated;

export const selectGlobalTimeRange = (state: { dashboard: DashboardState }) => 
  state.dashboard.globalTimeRange;

export const selectLocalTimeRange = (state: { dashboard: DashboardState }) => 
  state.dashboard.localTimeRange;

// Export reducer
export default dashboardSlice.reducer;
