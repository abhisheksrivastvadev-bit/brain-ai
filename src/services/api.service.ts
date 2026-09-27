/**
 * Brain AI - Mock / Base API Service
 */

import type { ApiResponse } from '../types'

export const apiService = {
  async simulateRequest<T>(data: T, delay = 1000): Promise<ApiResponse<T>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data,
          status: 'success',
          timestamp: new Date().toISOString(),
        })
      }, delay)
    })
  },
}

export default apiService
