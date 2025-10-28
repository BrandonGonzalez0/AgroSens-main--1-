import crypto from 'crypto';

// Enhanced CSRF protection middleware
const csrfProtection = (req, res, next) => {
  // Skip CSRF for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Check for CSRF token in headers or body
  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.session?.csrfToken;

  if (!token || !sessionToken) {
    return res.status(403).json({ 
      error: 'CSRF token required',
      code: 'CSRF_TOKEN_MISSING'
    });
  }

  // Use timing-safe comparison to prevent timing attacks
  if (!crypto.timingSafeEqual(Buffer.from(token), Buffer.from(sessionToken))) {
    return res.status(403).json({ 
      error: 'Invalid CSRF token',
      code: 'CSRF_TOKEN_INVALID'
    });
  }

  next();
};

// Generate cryptographically secure CSRF token
const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Validate CSRF token format
const isValidCSRFToken = (token) => {
  return typeof token === 'string' && /^[a-f0-9]{64}$/.test(token);
};

export { csrfProtection, generateCSRFToken, isValidCSRFToken };