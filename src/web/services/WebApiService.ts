import { BaseApiService, ApiError, NetworkError } from '../../shared/services/api';
import { APP_CONFIG } from '../../config/app.config';
import { ApiResponse } from '../../shared/models/common';

export class WebApiService extends BaseApiService {
  constructor(baseUrl: string = APP_CONFIG.api.baseUrl) {
    super(baseUrl);
  }

  public async get<T>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    try {
      const queryString = params ? this.buildQueryString(params) : '';
      const fullUrl = `${this.baseUrl}${url}${queryString}`;
      
      console.log('WebApiService.get - URL:', fullUrl);
      console.log('WebApiService.get - Params:', params);
      console.log('WebApiService.get - Query string:', queryString);
      console.log('WebApiService.get - Full URL with params:', fullUrl);
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: this.headers,
        credentials: 'include',
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      throw new NetworkError(`Network error: ${(error as Error).message}`);
    }
  }

  public async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${url}`, {
        method: 'POST',
        headers: this.headers,
        body: data ? JSON.stringify(data) : undefined,
        credentials: 'include',
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      throw new NetworkError(`Network error: ${(error as Error).message}`);
    }
  }

  public async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${url}`, {
        method: 'PUT',
        headers: this.headers,
        body: data ? JSON.stringify(data) : undefined,
        credentials: 'include',
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      throw new NetworkError(`Network error: ${(error as Error).message}`);
    }
  }

  public async delete<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${url}`, {
        method: 'DELETE',
        headers: this.headers,
        credentials: 'include',
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      throw new NetworkError(`Network error: ${(error as Error).message}`);
    }
  }

  public async upload<T>(url: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });

        xhr.addEventListener('load', async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (error) {
              reject(new ApiError('Invalid response format', xhr.status));
            }
          } else {
            reject(new ApiError(xhr.statusText, xhr.status));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new NetworkError('Upload failed'));
        });

        xhr.open('POST', `${this.baseUrl}${url}`);
        
        // Set headers except Content-Type (let browser set it for FormData)
        Object.entries(this.headers).forEach(([key, value]) => {
          if (key.toLowerCase() !== 'content-type') {
            xhr.setRequestHeader(key, value);
          }
        });

        xhr.send(formData);
      });
    } catch (error) {
      throw new NetworkError(`Upload error: ${(error as Error).message}`);
    }
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (!response.ok) {
      if (isJson) {
        const errorData = await response.json();
        throw new ApiError(
          errorData.message || errorData.error || 'Request failed',
          response.status,
          errorData.code?.toString()
        );
      } else {
        throw new ApiError(response.statusText, response.status);
      }
    }

    if (isJson) {
      return await response.json();
    } else {
      return {
        success: true,
        data: await response.text() as T,
      };
    }
  }

  private buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    const addParam = (key: string, value: any) => {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(item => searchParams.append(key, String(item)));
        } else if (value instanceof Date) {
          searchParams.append(key, value.toISOString());
        } else if (typeof value === 'object') {
          // Handle nested objects like { dateRange: { relative: '90d' } }
          Object.entries(value).forEach(([nestedKey, nestedValue]) => {
            const fullKey = `${key}[${nestedKey}]`;
            searchParams.append(fullKey, String(nestedValue));
          });
        } else {
          searchParams.append(key, String(value));
        }
      }
    };
    
    Object.entries(params).forEach(([key, value]) => {
      addParam(key, value);
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }
}
