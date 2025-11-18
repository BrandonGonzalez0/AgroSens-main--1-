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
import { validateCSRFToken, getCSRFToken } from './middleware/csrf.js';
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
import sensorsV1 from "./routes/api_sensors_v1.js";
import mqttSensorsRoutes from './routes/mqtt_sensors.js';
import iaRoutes from "./routes/ia.js";
import modelsRoutes from "./routes/models.js";
import cultivosRoutes from "./routes/cultivos.js";
import recomendacionesRoutes from "./routes/recomendaciones.js";
import usuariosRoutes from "./routes/usuarios.js";
import authRoutes from "./routes/auth.js";
import alertasRoutes from "./routes/alertas.js";
import weatherRoutes from "./routes/weather.js";

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

  // Auto-seed de usuarios: crea colección, índice y usuarios iniciales
  async function ensureUsersSeed(connection) {
    try {
      if (!connection) return;
      const shouldSeed = process.env.AUTO_SEED_USERS === 'true' || (process.env.NODE_ENV !== 'production');
      if (!shouldSeed) return;
      const native = connection.db;
      const collName = 'users';
      const exists = await native.listCollections({ name: collName }).toArray();
      if (exists.length === 0) {
        await native.createCollection(collName);
        console.log(`Colección ${collName} creada`);
      }
      await native.collection(collName).createIndex({ email: 1 }, { unique: true });
      const seedUsers = [
        {
          nombre: 'Administrador AgroSens',
          email: 'admin@agrosens.cl',
          password_hash: '$2a$10$OKGapI33uKIfegzb9cv7fO2JQoExEZrQaIO/wV/Ths1x2tJtuSKaS',
          rol: 'admin',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          nombre: 'Agricultor Demo',
          email: 'agricultor@agrosens.cl',
          password_hash: '$2a$10$aA32zTOp1coN4WXVYtMaQeGSBRSbBLgJGHZly/BoE2Xgp4IOWWKku',
          rol: 'agricultor',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      for (const u of seedUsers) {
        const found = await native.collection(collName).findOne({ email: u.email });
        if (!found) {
          await native.collection(collName).insertOne(u);
          console.log(`Usuario sembrado: ${u.email}`);
        }
      }
    } catch (e) {
      console.warn('Auto-seed users falló:', e?.message || e);
    }
  }

  if (dbConnection) {
    await ensureUsersSeed(dbConnection);
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
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        connectSrc: ["'self'", "https://api.open-meteo.com", "https://api.weatherapi.com"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", "blob:"],
        frameSrc: ["'none'"],
        workerSrc: ["'self'", "blob:"],
        manifestSrc: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  }));
  
  // Progressive rate limiting
  app.use(progressiveRateLimit);
  
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    optionsSuccessStatus: 200
  }));
  
  // Session configuration with mandatory secret
  if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
    console.error('CRITICAL: SESSION_SECRET environment variable is not set in production!');
    process.exit(1);
  }
  
  app.use(session({
    secret: process.env.SESSION_SECRET || `temp-dev-secret-${Date.now()}-${Math.random()}`,
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
        if (!buf || buf.length === 0) return; // allow empty bodies
        JSON.parse(buf.toString());
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
  app.get('/api/csrf-token', getCSRFToken);
  
  app.get('/', (req, res) => {
    res.json({ message: '¡Servidor de AgroSens en funcionamiento!', status: 'healthy' });
  });

  // Rutas principales con protección CSRF para operaciones de escritura
  app.use('/api/sensores', sensoresRoutes);
  // New v1 sensors API (recepción de lecturas desde ESP32 u otros gateways)
  app.use('/api/sensors/v1', sensorsV1);
  // Endpoints que exponen los últimos valores leídos vía MQTT
  app.use('/sensores', mqttSensorsRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/ia', validateCSRFToken, iaRoutes);
  app.use('/api/models', modelsRoutes);
  app.use('/api/cultivos', cultivosRoutes);
  app.use('/api/recomendaciones', validateCSRFToken, recomendacionesRoutes);
  app.use('/api/usuarios', strictRateLimit, validateCSRFToken, usuariosRoutes);
  app.use('/api/alertas', validateCSRFToken, alertasRoutes);
  app.use('/api/weather', weatherRoutes);
  
  // Health check endpoints
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbConnection ? 'connected' : 'disconnected'
    });
  });
  
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbConnection ? 'connected' : 'disconnected',
      environment: process.env.NODE_ENV || 'development'
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
  const server = app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT} (DB ${dbConnection ? 'conectada' : 'no disponible - modo local'})`));

  // Iniciar servicio MQTT en background
  try {
    const { startMQTTService } = await import('./mqtt_service.js');
    startMQTTService();
  } catch (e) {
    console.error('No se pudo inicializar servicio MQTT:', e.message || e);
  }
};

start();