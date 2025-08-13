import { User, PoliceOfficer } from '../models/user';
import { BaseApiService } from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User | PoliceOfficer;
  token: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// Abstract authentication service that can be implemented differently for web and Flutter
export abstract class BaseAuthService {
  protected apiService: BaseApiService;
  protected currentUser: User | PoliceOfficer | null = null;
  protected authToken: string | null = null;
  protected refreshToken: string | null = null;
  protected tokenExpiry: Date | null = null;

  constructor(apiService: BaseApiService) {
    this.apiService = apiService;
  }

  // Abstract methods for platform-specific storage
  protected abstract saveToken(token: string): Promise<void>;
  protected abstract getToken(): Promise<string | null>;
  protected abstract removeToken(): Promise<void>;
  protected abstract saveRefreshToken(token: string): Promise<void>;
  protected abstract getRefreshToken(): Promise<string | null>;
  protected abstract removeRefreshToken(): Promise<void>;
  protected abstract saveUser(user: User | PoliceOfficer): Promise<void>;
  protected abstract getUser(): Promise<User | PoliceOfficer | null>;
  protected abstract removeUser(): Promise<void>;

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await this.apiService.post<AuthResponse>('/auth/login', credentials);
      const authData = response.data!;
      
      await this.setAuthData(authData);
      return authData;
    } catch (error) {
      throw new Error('Login failed: ' + (error as Error).message);
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.authToken) {
        await this.apiService.post('/auth/logout');
      }
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      await this.clearAuthData();
    }
  }

  async refreshAuthToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await this.apiService.post<AuthResponse>('/auth/refresh', {
        refreshToken: this.refreshToken
      });
      
      const authData = response.data!;
      await this.setAuthData(authData);
      return authData.token;
    } catch (error) {
      await this.clearAuthData();
      throw new Error('Token refresh failed: ' + (error as Error).message);
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    if (!token) return false;

    // Check if token is expired
    if (this.tokenExpiry && new Date() > this.tokenExpiry) {
      try {
        await this.refreshAuthToken();
        return true;
      } catch (error) {
        await this.clearAuthData();
        return false;
      }
    }

    return true;
  }

  async getCurrentUser(): Promise<User | PoliceOfficer | null> {
    if (!this.currentUser) {
      this.currentUser = await this.getUser();
    }
    return this.currentUser;
  }

  async updateCurrentUser(user: User | PoliceOfficer): Promise<void> {
    this.currentUser = user;
    await this.saveUser(user);
  }

  private async setAuthData(authData: AuthResponse): Promise<void> {
    this.currentUser = authData.user;
    this.authToken = authData.token;
    this.refreshToken = authData.refreshToken;
    this.tokenExpiry = authData.expiresAt;

    await Promise.all([
      this.saveToken(authData.token),
      this.saveRefreshToken(authData.refreshToken),
      this.saveUser(authData.user)
    ]);

    this.apiService.setAuthToken(authData.token);
  }

  private async clearAuthData(): Promise<void> {
    this.currentUser = null;
    this.authToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;

    await Promise.all([
      this.removeToken(),
      this.removeRefreshToken(),
      this.removeUser()
    ]);

    this.apiService.removeAuthToken();
  }
}

// Token management utilities
export class TokenManager {
  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= expiryTime;
    } catch (error) {
      return true; // Consider expired if we can't parse
    }
  }

  static getTokenExpiry(token: string): Date | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000;
      return new Date(expiryTime);
    } catch (error) {
      return null;
    }
  }

  static decodeToken(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
      return null;
    }
  }
}
