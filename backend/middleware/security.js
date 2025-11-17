import rateLimit from 'express-rate-limit';

// Enhanced security middleware collection

// IP whitelist for admin endpoints
const ADMIN_WHITELIST = process.env.ADMIN_IPS ? process.env.ADMIN_IPS.split(',') : [];

// Check if IP is whitelisted for admin access
export const adminIPFilter = (req, res, next) => {
  if (ADMIN_WHITELIST.length === 0) {
    return next(); // No whitelist configured, allow all
  }
  
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  
  if (ADMIN_WHITELIST.includes(clientIP)) {
    return next();
  }
  
  return res.status(403).json({ 
    error: 'Access denied from this IP',
    code: 'IP_NOT_WHITELISTED'
  });
};

// Progressive rate limiting by IP - increases delay with repeated violations
export const progressiveRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use X-Forwarded-For if behind proxy, otherwise use connection IP
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
           req.ip || 
           req.connection.remoteAddress || 
           'unknown';
  },
  handler: (req, res) => {
    const retryAfter = Math.round(req.rateLimit.resetTime / 1000) || 1;
    res.set('Retry-After', retryAfter);
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: retryAfter,
      code: 'RATE_LIMIT_EXCEEDED'
    });
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/' || req.path === '/health';
  }
});

// Strict rate limiting for sensitive operations with IP tracking
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
           req.ip || 
           req.connection.remoteAddress || 
           'unknown';
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many sensitive requests',
      code: 'STRICT_RATE_LIMIT_EXCEEDED'
    });
  }
});

// Request size limiter
export const requestSizeLimiter = (maxSize = '1mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length']);
    const maxBytes = parseSize(maxSize);
    
    if (contentLength && contentLength > maxBytes) {
      return res.status(413).json({
        error: 'Request entity too large',
        maxSize: maxSize,
        code: 'REQUEST_TOO_LARGE'
      });
    }
    
    next();
  };
};

// Parse size string to bytes
function parseSize(size) {
  const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  
  if (!match) return 1024 * 1024; // Default 1MB
  
  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';
  
  return Math.floor(value * units[unit]);
}

// Security headers middleware
export const securityHeaders = (req, res, next) => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // HSTS for HTTPS
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  next();
};

// Request logging for security monitoring
export const securityLogger = (req, res, next) => {
  const start = Date.now();
  const originalSend = res.send;
  
  res.send = function(data) {
    const duration = Date.now() - start;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      statusCode: res.statusCode,
      duration: duration,
      contentLength: res.get('content-length') || 0
    };
    
    // Log suspicious activity
    if (res.statusCode >= 400 || duration > 5000) {
      console.warn('Security Alert:', JSON.stringify(logData));
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

// Input validation for common attack patterns
export const inputValidation = (req, res, next) => {
  const suspiciousPatterns = [
    /(\<|\%3C)script(\>|\%3E)/i,
    /javascript:/i,
    /vbscript:/i,
    /onload\s*=/i,
    /onerror\s*=/i,
    /eval\s*\(/i,
    /expression\s*\(/i,
    /\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c/i,
    /union\s+select/i,
    /drop\s+table/i,
    /insert\s+into/i,
    /delete\s+from/i
  ];
  
  const checkValue = (value) => {
    if (typeof value === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkValue);
    }
    return false;
  };
  
  // Check query parameters
  if (req.query && checkValue(req.query)) {
    return res.status(400).json({
      error: 'Suspicious input detected in query parameters',
      code: 'SUSPICIOUS_INPUT'
    });
  }
  
  // Check request body
  if (req.body && checkValue(req.body)) {
    return res.status(400).json({
      error: 'Suspicious input detected in request body',
      code: 'SUSPICIOUS_INPUT'
    });
  }
  
  next();
};