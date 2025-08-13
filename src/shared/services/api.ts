import { ApiResponse, PaginationParams, PaginatedResponse } from '../models/common';

// Abstract base class for API communication
// This can be implemented differently for web (fetch/axios) and Flutter (dio/http)
export abstract class BaseApiService {
  protected baseUrl: string;
  protected headers: Record<string, string>;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  protected setAuthToken(token: string): void {
    this.headers['Authorization'] = `Bearer ${token}`;
  }

  protected removeAuthToken(): void {
    delete this.headers['Authorization'];
  }

  // Abstract methods to be implemented by platform-specific classes
  protected abstract get<T>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>>;
  protected abstract post<T>(url: string, data?: any): Promise<ApiResponse<T>>;
  protected abstract put<T>(url: string, data?: any): Promise<ApiResponse<T>>;
  protected abstract delete<T>(url: string): Promise<ApiResponse<T>>;
  protected abstract upload<T>(url: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>>;
}

// Generic repository pattern for CRUD operations
export abstract class BaseRepository<T, CreateDto, UpdateDto, FilterDto> {
  protected apiService: BaseApiService;
  protected endpoint: string;

  constructor(apiService: BaseApiService, endpoint: string) {
    this.apiService = apiService;
    this.endpoint = endpoint;
  }

  async getAll(params?: PaginationParams & FilterDto): Promise<PaginatedResponse<T>> {
    const response = await this.apiService.get<PaginatedResponse<T>>(this.endpoint, params);
    return response.data!;
  }

  async getById(id: string | number): Promise<T> {
    const response = await this.apiService.get<T>(`${this.endpoint}/${id}`);
    return response.data!;
  }

  async create(data: CreateDto): Promise<T> {
    const response = await this.apiService.post<T>(this.endpoint, data);
    return response.data!;
  }

  async update(id: string | number, data: UpdateDto): Promise<T> {
    const response = await this.apiService.put<T>(`${this.endpoint}/${id}`, data);
    return response.data!;
  }

  async delete(id: string | number): Promise<void> {
    await this.apiService.delete(`${this.endpoint}/${id}`);
  }

  async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<string> {
    const response = await this.apiService.upload<{ url: string }>(`${this.endpoint}/upload`, file, onProgress);
    return response.data!.url;
  }
}

// Error handling utilities
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

// Response interceptor for common error handling
export function handleApiResponse<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new ApiError(
      response.error || 'An error occurred',
      response.code || 500,
      response.code?.toString()
    );
  }
  return response.data!;
}
