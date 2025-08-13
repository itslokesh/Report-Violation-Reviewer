import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, PoliceOfficer } from '../shared/models/user';
import { LoginCredentials, AuthResponse } from '../shared/services/auth';
import { WebAuthService } from '../web/services/WebAuthService';

// Context state interface
interface AuthState {
  user: User | PoliceOfficer | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastActivity: number | null;
}

// Context actions
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: AuthResponse }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_UPDATE_USER'; payload: User | PoliceOfficer }
  | { type: 'AUTH_CLEAR_ERROR' }
  | { type: 'AUTH_UPDATE_ACTIVITY' };

// Context interface
interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (user: User | PoliceOfficer) => void;
  clearError: () => void;
  updateActivity: () => void;
  initializeAuth: () => Promise<void>;
}

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  lastActivity: null,
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        lastActivity: Date.now(),
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        lastActivity: null,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        lastActivity: null,
      };
    case 'AUTH_UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    case 'AUTH_CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'AUTH_UPDATE_ACTIVITY':
      return {
        ...state,
        lastActivity: Date.now(),
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider props interface
interface AuthProviderProps {
  children: ReactNode;
  authService: WebAuthService;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children, authService }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authService.login(credentials);
      dispatch({ type: 'AUTH_SUCCESS', payload: response });
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE', payload: (error as Error).message });
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
      dispatch({ type: 'AUTH_LOGOUT' });
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  // Refresh token function
  const refreshToken = async (): Promise<void> => {
    try {
      const token = await authService.refreshAuthToken();
      // Update the auth service with new token
      authService.setAuthToken(token);
      dispatch({ type: 'AUTH_UPDATE_ACTIVITY' });
    } catch (error) {
      console.error('Token refresh failed:', error);
      dispatch({ type: 'AUTH_FAILURE', payload: 'Token refresh failed' });
    }
  };

  // Check authentication status
  const checkAuth = async (): Promise<void> => {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      if (isAuthenticated) {
        const user = await authService.getCurrentUser();
        if (user) {
          dispatch({ type: 'AUTH_SUCCESS', payload: { user, token: '', refreshToken: '', expiresAt: new Date() } });
        } else {
          dispatch({ type: 'AUTH_FAILURE', payload: 'User not found' });
        }
      } else {
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE', payload: (error as Error).message });
    }
  };

  // Update user function
  const updateUser = (user: User | PoliceOfficer): void => {
    dispatch({ type: 'AUTH_UPDATE_USER', payload: user });
  };

  // Clear error function
  const clearError = (): void => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' });
  };

  // Update activity function
  const updateActivity = (): void => {
    dispatch({ type: 'AUTH_UPDATE_ACTIVITY' });
  };

  // Initialize authentication
  const initializeAuth = async (): Promise<void> => {
    try {
      await authService.initializeAuth();
      await checkAuth();
    } catch (error) {
      console.error('Auth initialization failed:', error);
      dispatch({ type: 'AUTH_FAILURE', payload: 'Authentication initialization failed' });
    }
  };

  // Set up activity tracking
  useEffect(() => {
    const handleActivity = () => {
      updateActivity();
    };

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Set up session timeout
    const sessionTimeout = 30 * 60 * 1000; // 30 minutes
    let timeoutId: NodeJS.Timeout;

    const resetTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (state.isAuthenticated) {
          logout();
        }
      }, sessionTimeout);
    };

    if (state.isAuthenticated) {
      resetTimeout();
    }

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearTimeout(timeoutId);
    };
  }, [state.isAuthenticated]);

  // Set up token refresh interval
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const refreshInterval = 15 * 60 * 1000; // 15 minutes
    const intervalId = setInterval(() => {
      refreshToken();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [state.isAuthenticated]);

  // Context value
  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    refreshToken,
    checkAuth,
    updateUser,
    clearError,
    updateActivity,
    initializeAuth,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export context for testing
export { AuthContext };
