// Secure API utility functions
class APIClient {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    this.csrfToken = null;
    this.isProduction = import.meta.env.PROD;
  }

  async getCSRFToken() {
    if (this.csrfToken) return this.csrfToken;
    
    try {
      // In development, use proxy; in production, use full URL
      const endpoint = this.isProduction ? `${this.baseURL}/api/csrf-token` : '/api/csrf-token';
      
      const response = await fetch(endpoint, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.csrfToken = data.csrfToken;
        return this.csrfToken;
      }
    } catch (error) {
      console.warn('Failed to get CSRF token:', error);
    }
    
    return null;
  }

  async request(endpoint, options = {}) {
    // Validate and sanitize endpoint
    if (typeof endpoint !== 'string' || !endpoint.startsWith('/')) {
      throw new Error('Invalid endpoint');
    }
    
    // In development, use proxy; in production, use full URL
    const url = this.isProduction ? `${this.baseURL}${endpoint}` : endpoint;
    const config = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Add CSRF token for non-GET requests
    if (options.method && !['GET', 'HEAD', 'OPTIONS'].includes(options.method.toUpperCase())) {
      const token = await this.getCSRFToken();
      if (token) {
        config.headers['X-CSRF-Token'] = token;
      }
    }

    try {
      const response = await fetch(url, config);
      
      // Handle CSRF token expiration
      if (response.status === 403 && response.headers.get('content-type')?.includes('application/json')) {
        const errorData = await response.json();
        if (errorData.code === 'CSRF_TOKEN_INVALID') {
          // Clear token and retry once
          this.csrfToken = null;
          const newToken = await this.getCSRFToken();
          if (newToken) {
            config.headers['X-CSRF-Token'] = newToken;
            return fetch(url, config);
          }
        }
      }
      
      return response;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

// Create singleton instance
const apiClient = new APIClient();

export default apiClient;

// Utility functions for common operations
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .substring(0, 1000); // Limit length
};

export const validateSensorData = (data) => {
  const errors = [];
  
  if (data.ph !== undefined) {
    const ph = Number(data.ph);
    if (isNaN(ph) || ph < 0 || ph > 14) {
      errors.push('pH must be between 0 and 14');
    }
  }
  
  if (data.humidity !== undefined) {
    const humidity = Number(data.humidity);
    if (isNaN(humidity) || humidity < 0 || humidity > 100) {
      errors.push('Humidity must be between 0 and 100');
    }
  }
  
  if (data.temperature !== undefined) {
    const temp = Number(data.temperature);
    if (isNaN(temp) || temp < -50 || temp > 100) {
      errors.push('Temperature must be between -50 and 100');
    }
  }
  
  return errors;
};