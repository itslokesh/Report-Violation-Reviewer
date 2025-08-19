import { BaseAuthService, AuthResponse, LoginCredentials } from '../../shared/services/auth';
import { User, PoliceOfficer } from '../../shared/models/user';
import { WebApiService } from './WebApiService';
import { STORAGE_KEYS } from '../../shared/constants/app';

export class WebAuthService extends BaseAuthService {
  constructor(apiService: WebApiService) {
    super(apiService);
  }

  protected async saveToken(token: string): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.authToken, token);
  }

  protected async getToken(): Promise<string | null> {
    return localStorage.getItem(STORAGE_KEYS.authToken);
  }

  protected async removeToken(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.authToken);
  }

  protected async saveRefreshToken(token: string): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.refreshToken, token);
  }

  protected async getRefreshToken(): Promise<string | null> {
    return localStorage.getItem(STORAGE_KEYS.refreshToken);
  }

  protected async removeRefreshToken(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
  }

  protected async saveUser(user: User | PoliceOfficer): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
  }

  protected async getUser(): Promise<User | PoliceOfficer | null> {
    const userData = localStorage.getItem(STORAGE_KEYS.currentUser);
    if (!userData) return null;
    
    try {
      const user = JSON.parse(userData);
      // Convert date strings back to Date objects
      if (user.createdAt) user.createdAt = new Date(user.createdAt);
      if (user.updatedAt) user.updatedAt = new Date(user.updatedAt);
      if (user.lastLoginAt) user.lastLoginAt = new Date(user.lastLoginAt);
      if (user.guestExpiryDate) user.guestExpiryDate = new Date(user.guestExpiryDate);
      
      return user;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  protected async removeUser(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.currentUser);
  }

  // Web-specific methods
  async initializeAuth(): Promise<void> {
    const token = await this.getToken();
    if (token) {
      this.apiService.setAuthToken(token);
      
      // Check if token is expired and try to refresh
      const user = await this.getUser();
      if (user) {
        this.currentUser = user;
      }
    }
  }

  async clearAllData(): Promise<void> {
    // Base method is private; emulate by clearing pieces
    await Promise.all([
      this.removeToken(),
      this.removeRefreshToken(),
      this.removeUser(),
    ]);
    this.apiService.removeAuthToken();
    // Clear other app data if needed
    localStorage.removeItem(STORAGE_KEYS.userPreferences);
    localStorage.removeItem(STORAGE_KEYS.offlineData);
    localStorage.removeItem(STORAGE_KEYS.lastSync);
  }

  async saveUserPreferences(preferences: Record<string, any>): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.userPreferences, JSON.stringify(preferences));
  }

  async getUserPreferences(): Promise<Record<string, any> | null> {
    const preferences = localStorage.getItem(STORAGE_KEYS.userPreferences);
    return preferences ? JSON.parse(preferences) : null;
  }

  async saveOfflineData(key: string, data: any): Promise<void> {
    const offlineData = await this.getOfflineData();
    offlineData[key] = {
      data,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.offlineData, JSON.stringify(offlineData));
  }

  async getOfflineData(): Promise<Record<string, any>> {
    const offlineData = localStorage.getItem(STORAGE_KEYS.offlineData);
    return offlineData ? JSON.parse(offlineData) : {};
  }

  async clearOfflineData(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.offlineData);
  }

  async setLastSync(timestamp: Date): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.lastSync, timestamp.toISOString());
  }

  async getLastSync(): Promise<Date | null> {
    const lastSync = localStorage.getItem(STORAGE_KEYS.lastSync);
    return lastSync ? new Date(lastSync) : null;
  }

  // Session management
  async startSessionTimeout(timeoutMinutes: number): Promise<void> {
    const timeoutMs = timeoutMinutes * 60 * 1000;
    setTimeout(() => {
      this.logout();
    }, timeoutMs);
  }

  async resetSessionTimeout(timeoutMinutes: number): Promise<void> {
    // Clear existing timeout and start new one
    this.startSessionTimeout(timeoutMinutes);
  }

  // Browser storage event handling
  async setupStorageListener(): Promise<void> {
    // Listen for storage changes (e.g., from other tabs)
    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEYS.authToken && !event.newValue) {
        // Token was removed in another tab, logout here too
        this.logout();
      }
    });
  }

  // Real login method using backend API
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await this.apiService.post<AuthResponse>('/auth/police/login', credentials);
      
      if (response.success && response.data) {
        // Transform backend response to match our AuthResponse interface
        const authResponse: AuthResponse = {
          user: response.data.user,
          token: (response.data as any).accessToken || response.data.token,
          refreshToken: (response.data as any).refreshToken || '',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        };

        // Base method is private; set token/header and persist via exposed methods
        await Promise.all([
          this.saveToken(authResponse.token),
          this.saveRefreshToken(authResponse.refreshToken),
          this.saveUser(authResponse.user),
        ]);
        this.apiService.setAuthToken(authResponse.token);
        return authResponse;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      throw new Error(`Login failed: ${(error as Error).message}`);
    }
  }
}
