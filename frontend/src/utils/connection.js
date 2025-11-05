// Connection utilities for frontend-backend communication
import apiClient from './api.js';

class ConnectionManager {
  constructor() {
    this.isConnected = false;
    this.lastCheck = null;
    this.checkInterval = null;
    this.listeners = [];
  }

  // Check internet connectivity
  async checkInternet() {
    try {
      await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      return true;
    } catch {
      return false;
    }
  }

  // Check if backend is available
  async checkConnection() {
    try {
      // First check internet connectivity
      const hasInternet = await this.checkInternet();
      
      if (!hasInternet) {
        this.isConnected = false;
        this.lastCheck = Date.now();
        this.notifyListeners('offline', { reason: 'No internet connection' });
        return false;
      }

      // Then check backend
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        timeout: 5000
      });

      if (response.ok) {
        const data = await response.json();
        this.isConnected = true;
        this.lastCheck = Date.now();
        this.notifyListeners('connected', data);
        return true;
      } else {
        throw new Error('Backend not responding');
      }
    } catch (error) {
      this.isConnected = false;
      this.lastCheck = Date.now();
      this.notifyListeners('disconnected', error);
      return false;
    }
  }

  // Start periodic connection checking
  startMonitoring(interval = 30000) {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Initial check
    this.checkConnection();

    // Periodic checks
    this.checkInterval = setInterval(() => {
      this.checkConnection();
    }, interval);
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Add connection status listener
  addListener(callback) {
    this.listeners.push(callback);
  }

  // Remove connection status listener
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notify all listeners of connection status change (silently)
  notifyListeners(status, data) {
    this.listeners.forEach(callback => {
      try {
        callback(status, data);
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }

  // Get current connection status
  getStatus() {
    return {
      isConnected: this.isConnected,
      lastCheck: this.lastCheck,
      timeSinceLastCheck: this.lastCheck ? Date.now() - this.lastCheck : null
    };
  }

  // Initialize CSRF token
  async initializeCSRF() {
    try {
      await apiClient.getCSRFToken();
      return true;
    } catch (error) {
      console.warn('Failed to initialize CSRF token:', error);
      return false;
    }
  }
}

// Create singleton instance
const connectionManager = new ConnectionManager();

// Auto-start monitoring when module loads
if (typeof window !== 'undefined') {
  connectionManager.startMonitoring();
}

export default connectionManager;

// Utility functions
export const isBackendConnected = () => connectionManager.isConnected;

export const waitForConnection = (timeout = 10000) => {
  return new Promise((resolve, reject) => {
    if (connectionManager.isConnected) {
      resolve(true);
      return;
    }

    const timeoutId = setTimeout(() => {
      connectionManager.removeListener(listener);
      reject(new Error('Connection timeout'));
    }, timeout);

    const listener = (status) => {
      if (status === 'connected') {
        clearTimeout(timeoutId);
        connectionManager.removeListener(listener);
        resolve(true);
      }
    };

    connectionManager.addListener(listener);
  });
};

export const onConnectionChange = (callback) => {
  connectionManager.addListener(callback);
  return () => connectionManager.removeListener(callback);
};