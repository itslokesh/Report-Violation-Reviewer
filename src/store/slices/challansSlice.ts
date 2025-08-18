import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ChallanData, ChallanCreate, ChallanUpdate, ChallanFilter } from '../../shared/models/challan';
import { PaginatedResponse } from '../../shared/models/common';
import { WebApiService } from '../../web/services/WebApiService';

// Async thunks
export const fetchChallans = createAsyncThunk(
  'challans/fetchChallans',
  async (params?: ChallanFilter & { page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const apiService = new WebApiService();
      const response = await apiService.get('/police/challans', params);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch challans');
      }
    } catch (error) {
      return rejectWithValue(`Failed to fetch challans: ${(error as Error).message}`);
    }
  }
);

export const fetchChallanById = createAsyncThunk(
  'challans/fetchChallanById',
  async (id: number, { rejectWithValue }) => {
    try {
      const apiService = new WebApiService();
      const response = await apiService.get(`/police/challans/${id}`);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch challan');
      }
    } catch (error) {
      return rejectWithValue(`Failed to fetch challan: ${(error as Error).message}`);
    }
  }
);

export const createChallan = createAsyncThunk(
  'challans/createChallan',
  async (challanData: ChallanCreate, { rejectWithValue }) => {
    try {
      const apiService = new WebApiService();
      const response = await apiService.post('/police/challans', challanData);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create challan');
      }
    } catch (error) {
      return rejectWithValue(`Failed to create challan: ${(error as Error).message}`);
    }
  }
);

export const updateChallan = createAsyncThunk(
  'challans/updateChallan',
  async ({ id, updateData }: { id: number; updateData: ChallanUpdate }, { rejectWithValue }) => {
    try {
      const apiService = new WebApiService();
      const response = await apiService.put(`/police/challans/${id}`, updateData);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update challan');
      }
    } catch (error) {
      return rejectWithValue(`Failed to update challan: ${(error as Error).message}`);
    }
  }
);

// Note: Vehicle lookup and fine calculation APIs are not implemented for prototype
// These can be added later when needed

// State interface
interface ChallansState {
  entities: Record<number, ChallanData>;
  ids: number[];
  currentChallan: ChallanData | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: ChallanFilter | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  selectedChallans: number[];
  fineCalculation: any | null;
  vehicleInfo: any | null;
}

// Initial state
const initialState: ChallansState = {
  entities: {},
  ids: [],
  currentChallan: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  filters: null,
  isLoading: false,
  isUpdating: false,
  error: null,
  selectedChallans: [],
  fineCalculation: null,
  vehicleInfo: null,
};

// Helper function to normalize challans
const normalizeChallans = (challans: ChallanData[]) => {
  const entities: Record<number, ChallanData> = {};
  const ids: number[] = [];
  
  challans.forEach(challan => {
    entities[challan.id] = challan;
    ids.push(challan.id);
  });
  
  return { entities, ids };
};

// Challans slice
const challansSlice = createSlice({
  name: 'challans',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentChallan: (state) => {
      state.currentChallan = null;
    },
    setFilters: (state, action: PayloadAction<ChallanFilter>) => {
      state.filters = action.payload;
      state.pagination.page = 1;
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
      state.pagination.page = 1;
    },
    selectChallan: (state, action: PayloadAction<number>) => {
      const challanId = action.payload;
      if (!state.selectedChallans.includes(challanId)) {
        state.selectedChallans.push(challanId);
      }
    },
    deselectChallan: (state, action: PayloadAction<number>) => {
      const challanId = action.payload;
      state.selectedChallans = state.selectedChallans.filter(id => id !== challanId);
    },
    selectAllChallans: (state) => {
      state.selectedChallans = [...state.ids];
    },
    deselectAllChallans: (state) => {
      state.selectedChallans = [];
    },
    clearFineCalculation: (state) => {
      state.fineCalculation = null;
    },
    clearVehicleInfo: (state) => {
      state.vehicleInfo = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch challans
    builder
      .addCase(fetchChallans.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchChallans.fulfilled, (state, action: PayloadAction<PaginatedResponse<ChallanData>>) => {
        state.isLoading = false;
        const { entities, ids } = normalizeChallans(action.payload.data);
        state.entities = { ...state.entities, ...entities };
        state.ids = ids;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchChallans.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch challan by ID
    builder
      .addCase(fetchChallanById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchChallanById.fulfilled, (state, action: PayloadAction<ChallanData>) => {
        state.isLoading = false;
        state.currentChallan = action.payload;
        state.entities[action.payload.id] = action.payload;
      })
      .addCase(fetchChallanById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create challan
    builder
      .addCase(createChallan.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(createChallan.fulfilled, (state, action: PayloadAction<ChallanData>) => {
        state.isUpdating = false;
        state.entities[action.payload.id] = action.payload;
        state.ids.unshift(action.payload.id);
      })
      .addCase(createChallan.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });

    // Update challan
    builder
      .addCase(updateChallan.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateChallan.fulfilled, (state, action: PayloadAction<ChallanData>) => {
        state.isUpdating = false;
        state.entities[action.payload.id] = action.payload;
        if (state.currentChallan?.id === action.payload.id) {
          state.currentChallan = action.payload;
        }
      })
      .addCase(updateChallan.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });

    // Note: removed calculateFine and lookupVehicle handlers for prototype since thunks are not implemented
  },
});

// Export actions
export const {
  clearError,
  clearCurrentChallan,
  setFilters,
  clearFilters,
  setPage,
  setLimit,
  selectChallan,
  deselectChallan,
  selectAllChallans,
  deselectAllChallans,
  clearFineCalculation,
  clearVehicleInfo,
} = challansSlice.actions;

// Export selectors
export const selectChallans = (state: { challans: ChallansState }) => 
  state.challans.ids.map(id => state.challans.entities[id]);

export const selectChallanById = (state: { challans: ChallansState }, id: number) => 
  state.challans.entities[id];

export const selectCurrentChallan = (state: { challans: ChallansState }) => 
  state.challans.currentChallan;

export const selectChallansPagination = (state: { challans: ChallansState }) => 
  state.challans.pagination;

export const selectChallansFilters = (state: { challans: ChallansState }) => 
  state.challans.filters;

export const selectChallansLoading = (state: { challans: ChallansState }) => 
  state.challans.isLoading;

export const selectChallansUpdating = (state: { challans: ChallansState }) => 
  state.challans.isUpdating;

export const selectChallansError = (state: { challans: ChallansState }) => 
  state.challans.error;

export const selectSelectedChallans = (state: { challans: ChallansState }) => 
  state.challans.selectedChallans;

export const selectSelectedChallansData = (state: { challans: ChallansState }) => 
  state.challans.selectedChallans.map(id => state.challans.entities[id]);

export const selectFineCalculation = (state: { challans: ChallansState }) => 
  state.challans.fineCalculation;

export const selectVehicleInfo = (state: { challans: ChallansState }) => 
  state.challans.vehicleInfo;

// Export reducer
export default challansSlice.reducer;
