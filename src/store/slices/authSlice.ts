import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, PoliceOfficer } from '../../shared/models/user';
import { LoginCredentials, AuthResponse } from '../../shared/services/auth';
import { WebAuthService } from '../../web/services/WebAuthService';
import { WebApiService } from '../../web/services/WebApiService';

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const apiService = new WebApiService();
      const authService = new WebAuthService(apiService);
      const response = await authService.login(credentials);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const apiService = new WebApiService();
      const authService = new WebAuthService(apiService);
      await authService.logout();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const apiService = new WebApiService();
      const authService = new WebAuthService(apiService);
      const token = await authService.refreshAuthToken();
      return token;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const apiService = new WebApiService();
      const authService = new WebAuthService(apiService);
      const isAuthenticated = await authService.isAuthenticated();
      if (isAuthenticated) {
        const user = await authService.getCurrentUser();
        return user;
      }
      return null;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// State interface
interface AuthState {
  user: User | PoliceOfficer | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastActivity: number | null;
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  lastActivity: null,
};

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<User | PoliceOfficer>) => {
      state.user = action.payload;
    },
    updateLastActivity: (state) => {
      state.lastActivity = Date.now();
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.lastActivity = Date.now();
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Logout
    builder
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.lastActivity = null;
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Refresh token
    builder
      .addCase(refreshToken.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(refreshToken.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.token = action.payload;
        state.lastActivity = Date.now();
        state.error = null;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        // If refresh fails, logout the user
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.lastActivity = null;
      });

    // Check auth
    builder
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action: PayloadAction<User | PoliceOfficer | null>) => {
        state.isLoading = false;
        if (action.payload) {
          state.isAuthenticated = true;
          state.user = action.payload;
          state.lastActivity = Date.now();
        } else {
          state.isAuthenticated = false;
          state.user = null;
          state.token = null;
          state.lastActivity = null;
        }
        state.error = null;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.lastActivity = null;
      });
  },
});

// Export actions
export const { clearError, updateUser, updateLastActivity, setLoading } = authSlice.actions;

// Export selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectIsLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectUserRole = (state: { auth: AuthState }) => {
  const user = state.auth.user;
  if (user && 'role' in user) {
    return (user as PoliceOfficer).role;
  }
  return null;
};

// Export reducer
export default authSlice.reducer;
