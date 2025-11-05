import validator from 'validator';
import { escape } from 'html-escaper';

// Enhanced input validation middleware
const validateInput = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.details.map(d => d.message),
        code: 'VALIDATION_FAILED'
      });
    }
    next();
  };
};

// Enhanced sanitization to prevent injection attacks
const sanitizeInput = (req, res, next) => {
  try {
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }
    next();
  } catch (error) {
    return res.status(400).json({ 
      error: 'Invalid input format',
      code: 'SANITIZATION_FAILED'
    });
  }
};

function sanitizeObject(obj, depth = 0) {
  // Prevent deep recursion attacks
  if (depth > 10) {
    throw new Error('Object too deeply nested');
  }
  
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeValue(obj);
  }
  
  // Prevent prototype pollution
  if (obj.constructor !== Object && obj.constructor !== Array) {
    throw new Error('Invalid object type');
  }
  
  const sanitized = Array.isArray(obj) ? [] : {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Prevent prototype pollution
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    
    // Sanitize key
    const cleanKey = sanitizeKey(key);
    if (!cleanKey) continue;
    
    if (typeof value === 'object' && value !== null) {
      sanitized[cleanKey] = sanitizeObject(value, depth + 1);
    } else {
      sanitized[cleanKey] = sanitizeValue(value);
    }
  }
  
  return sanitized;
}

function sanitizeKey(key) {
  if (typeof key !== 'string') return null;
  
  // Remove dangerous characters from keys
  return key.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 100);
}

function sanitizeValue(value) {
  if (typeof value === 'string') {
    // Comprehensive XSS prevention
    let cleaned = value
      // Remove script tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove javascript: protocol
      .replace(/javascript:/gi, '')
      // Remove event handlers
      .replace(/on\w+\s*=/gi, '')
      // Remove data: URLs (except safe image formats)
      .replace(/data:(?!image\/(png|jpg|jpeg|gif|webp);base64,)[^;]*;/gi, '')
      // Remove vbscript
      .replace(/vbscript:/gi, '')
      // Remove expression() CSS
      .replace(/expression\s*\(/gi, '')
      // Remove import statements
      .replace(/@import/gi, '')
      // Limit length
      .substring(0, 10000);
    
    // HTML escape for output safety
    return escape(cleaned);
  }
  
  if (typeof value === 'number') {
    // Validate number ranges
    if (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER) {
      return 0;
    }
    return value;
  }
  
  if (typeof value === 'boolean') {
    return value;
  }
  
  // For other types, convert to string and sanitize
  return sanitizeValue(String(value));
}

// Validate file paths to prevent directory traversal
const validatePath = (inputPath) => {
  if (!inputPath || typeof inputPath !== 'string') {
    return null;
  }
  
  // Remove null bytes and normalize
  const cleaned = inputPath.replace(/\0/g, '').normalize();
  
  // Check for directory traversal attempts
  if (cleaned.includes('..') || cleaned.includes('~') || cleaned.startsWith('/')) {
    return null;
  }
  
  // Only allow alphanumeric, hyphens, underscores, and dots
  if (!/^[a-zA-Z0-9._-]+$/.test(cleaned)) {
    return null;
  }
  
  return cleaned;
};

// Validate URLs to prevent SSRF
const validateURL = (url) => {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  try {
    const parsed = new URL(url);
    
    // Only allow HTTP/HTTPS
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }
    
    // Block private IP ranges
    const hostname = parsed.hostname;
    if (validator.isIP(hostname)) {
      if (validator.isIP(hostname, 4)) {
        const parts = hostname.split('.').map(Number);
        // Block private IPv4 ranges
        if (
          (parts[0] === 10) ||
          (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
          (parts[0] === 192 && parts[1] === 168) ||
          (parts[0] === 127) ||
          (parts[0] === 169 && parts[1] === 254)
        ) {
          return false;
        }
      }
      // Block IPv6 private ranges
      if (hostname.startsWith('::1') || hostname.startsWith('fc') || hostname.startsWith('fd')) {
        return false;
      }
    }
    
    // Block localhost variations
    if (['localhost', '0.0.0.0'].includes(hostname.toLowerCase())) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
};

// Generate secure random tokens
const generateSecureToken = () => {
  return require('crypto').randomBytes(32).toString('hex');
};

// Validate API keys (remove hardcoded credentials)
const validateApiKey = (apiKey) => {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  
  // Get from environment variables instead of hardcoded
  const validApiKeys = process.env.VALID_API_KEYS ? process.env.VALID_API_KEYS.split(',') : [];
  return validApiKeys.includes(apiKey);
};

export { validateInput, sanitizeInput, validatePath, validateURL, generateSecureToken, validateApiKey };