import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sanitizeInput } from '../middleware/validation.js';
import { strictRateLimit } from '../middleware/security.js';
import { verifyJWT } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', strictRateLimit, sanitizeInput, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).lean();
    if (!user) {
      if (process.env.NODE_ENV !== 'production') console.warn(`[auth] Login fallido: usuario no encontrado (${normalizedEmail})`);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      if (process.env.NODE_ENV !== 'production') console.warn(`[auth] Login fallido: password no coincide (${normalizedEmail})`);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    let secret = process.env.JWT_SECRET;
    if (!secret) {
      // Fallback seguro en desarrollo para no bloquear pruebas
      if (process.env.NODE_ENV !== 'production') {
        secret = 'agrosens-dev-secret';
      } else {
        return res.status(500).json({ error: 'JWT secret no configurado' });
      }
    }

    const expiresIn = '24h';
    const payload = { nombre: user.nombre, email: user.email, rol: user.rol };
    const token = jwt.sign(payload, secret, { expiresIn });

    const decoded = jwt.decode(token);
    return res.json({
      token,
      user: { ...payload, exp: decoded?.exp }
    });
  } catch (e) {
    console.error('Login error:', e);
    return res.status(500).json({ error: 'Error en login' });
  }
});

router.get('/me', verifyJWT, (req, res) => {
  // req.user proviene del token
  return res.json({ user: req.user });
});

router.post('/logout', (req, res) => {
  // No hay estado en servidor para JWT; frontend debe eliminarlo
  return res.json({ ok: true });
});

export default router;
