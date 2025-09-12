import { db } from '../config/firebase';
import type { ApiResponse, ApiError } from './types';

// Cliente base para operaciones con Firestore
export class ApiClient {
  private handleError(error: any): ApiError {
    console.error('API Error:', error);
    
    return {
      message: error.message || 'Error desconocido',
      code: error.code || 'unknown',
      details: error
    };
  }

  protected async executeOperation<T>(
    operation: () => Promise<T>,
    successMessage?: string
  ): Promise<ApiResponse<T>> {
    try {
      const data = await operation();
      return {
        data,
        success: true,
        message: successMessage
      };
    } catch (error) {
      const apiError = this.handleError(error);
      return {
        data: null as any,
        success: false,
        error: apiError.message,
        message: apiError.message
      };
    }
  }
}

export default new ApiClient();