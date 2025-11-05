import crypto from 'crypto';

// CSRF Token Management
class CSRFProtection {
  constructor() {
    this.tokens = new Map();
    this.secretKey = process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex');
    
    // Clean expired tokens every hour
    setInterval(() => this.cleanExpiredTokens(), 3600000);
  }

  generateToken(sessionId) {
    const token = crypto.randomBytes(32).toString('hex');
    const timestamp = Date.now();
    const signature = this.signToken(token, sessionId, timestamp);
    
    const csrfToken = `${token}.${timestamp}.${signature}`;
    
    // Store token with expiration (1 hour)
    this.tokens.set(csrfToken, {
      sessionId,
      timestamp,
      expires: timestamp + 3600000
    });
    
    return csrfToken;
  }

  validateToken(token, sessionId) {
    if (!token || !sessionId) {
      return false;
    }

    const tokenData = this.tokens.get(token);
    if (!tokenData) {
      return false;
    }

    // Check expiration
    if (Date.now() > tokenData.expires) {
      this.tokens.delete(token);
      return false;
    }

    // Check session match
    if (tokenData.sessionId !== sessionId) {
      return false;
    }

    // Verify signature
    const [tokenPart, timestamp, signature] = token.split('.');
    const expectedSignature = this.signToken(tokenPart, sessionId, parseInt(timestamp));
    
    if (signature !== expectedSignature) {
      return false;
    }

    // Token is valid, remove it (one-time use)
    this.tokens.delete(token);
    return true;
  }

  signToken(token, sessionId, timestamp) {
    const data = `${token}.${sessionId}.${timestamp}`;
    return crypto.createHmac('sha256', this.secretKey).update(data).digest('hex');
  }

  cleanExpiredTokens() {
    const now = Date.now();
    for (const [token, data] of this.tokens.entries()) {
      if (now > data.expires) {
        this.tokens.delete(token);
      }
    }
  }
}

const csrfProtection = new CSRFProtection();

// Middleware to generate CSRF token
export const generateCSRFToken = (req, res, next) => {
  const sessionId = req.sessionID || req.ip + req.get('User-Agent');
  const token = csrfProtection.generateToken(sessionId);
  
  res.locals.csrfToken = token;
  res.setHeader('X-CSRF-Token', token);
  
  next();
};

// Middleware to validate CSRF token
export const validateCSRFToken = (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const token = req.get('X-CSRF-Token') || req.body._csrf || req.query._csrf;
  const sessionId = req.sessionID || req.ip + req.get('User-Agent');

  if (!csrfProtection.validateToken(token, sessionId)) {
    return res.status(403).json({
      error: 'Invalid CSRF token',
      code: 'CSRF_TOKEN_INVALID'
    });
  }

  next();
};

// Route to get CSRF token
export const getCSRFToken = (req, res) => {
  const sessionId = req.sessionID || req.ip + req.get('User-Agent');
  const token = csrfProtection.generateToken(sessionId);
  
  res.json({ csrfToken: token });
};

export default csrfProtection;