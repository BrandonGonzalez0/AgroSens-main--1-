import jwt from 'jsonwebtoken';

export function verifyJWT(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ error: 'JWT secret not configured' });

    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !req.user.rol) return res.status(403).json({ error: 'Forbidden' });
    if (!roles.includes(req.user.rol)) return res.status(403).json({ error: 'Insufficient role' });
    next();
  };
}
