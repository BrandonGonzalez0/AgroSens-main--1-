import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { csrfProtection, generateCSRFToken } from './middleware/csrf.js';
import { sanitizeInput } from './middleware/validation.js';
import { 
  progressiveRateLimit, 
  strictRateLimit, 
  securityHeaders, 
  securityLogger, 
  inputValidation,
  requestSizeLimiter
} from './middleware/security.js';

import sensoresRoutes from "./routes/sensores.js";
import iaRoutes from "./routes/ia.js";
import modelsRoutes from "./routes/models.js";
import cultivosRoutes from "./routes/cultivos.js";
import recomendacionesRoutes from "./routes/recomendaciones.js";
import usuariosRoutes from "./routes/usuarios.js";
import alertasRoutes from "./routes/alertas.js";

dotenv.config();
console.log("MONGO_URI:", process.env.MONGO_URI || process.env.MONGODB_URI);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_MODELS_DIR = path.join(__dirname, 'public_models');
// Ensure the directory exists so users can drop converted TF.js models here
try { fs.mkdirSync(PUBLIC_MODELS_DIR, { recursive: true }); } catch (e) { /* ignore */ }

const start = async () => {
  let dbConnection = null;
  try {
    dbConnection = await connectDB();
  } catch (err) {
    console.error('Advertencia: fallo al conectar a la base de datos:', err.message || err);
    dbConnection = null;
  }

  const app = express();
  
  // Enhanced security middleware stack
  app.use(securityHeaders);
  app.use(securityLogger);
  app.use(inputValidation);
  app.use(requestSizeLimiter('5mb'));
  
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));
  
  // Progressive rate limiting
  app.use(progressiveRateLimit);
  
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
  }));
  
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    store: dbConnection ? MongoStore.create({
      mongoUrl: process.env.MONGO_URI || process.env.MONGODB_URI
    }) : undefined,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict'
    }
  }));
  
  app.use(express.json({ 
    limit: '5mb',
    verify: (req, res, buf) => {
      try {
        JSON.parse(buf);
      } catch (e) {
        throw new Error('Invalid JSON');
      }
    }
  }));
  
  // Input sanitization
  app.use(sanitizeInput);

  // Servir modelos convertidos (TF.js) desde backend/public_models
  app.use('/models', express.static(path.resolve(PUBLIC_MODELS_DIR)));

  // CSRF token endpoint
  app.get('/api/csrf-token', (req, res) => {
    const token = generateCSRFToken();
    req.session.csrfToken = token;
    res.json({ csrfToken: token });
  });
  
  app.get('/', (req, res) => {
    res.json({ message: '¡Servidor de AgroSens en funcionamiento!', status: 'healthy' });
  });

  // Rutas principales con protección CSRF para operaciones de escritura
  app.use('/api/sensores', sensoresRoutes);
  app.use('/api/ia', csrfProtection, iaRoutes);
  app.use('/api/models', modelsRoutes);
  app.use('/api/cultivos', cultivosRoutes);
  app.use('/api/recomendaciones', csrfProtection, recomendacionesRoutes);
  app.use('/api/usuarios', strictRateLimit, csrfProtection, usuariosRoutes);
  app.use('/api/alertas', csrfProtection, alertasRoutes);
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbConnection ? 'connected' : 'disconnected'
    });
  });
  
  // Global error handler
  app.use((err, req, res, next) => {
    console.error('Server error:', err);
    
    // Don't expose error details in production
    const isDev = process.env.NODE_ENV !== 'production';
    
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Invalid JSON format' });
    }
    
    if (err.message === 'Invalid JSON') {
      return res.status(400).json({ error: 'Invalid JSON format' });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      ...(isDev && { details: err.message })
    });
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT} (DB ${dbConnection ? 'conectada' : 'no disponible - modo local'})`));
};

start();