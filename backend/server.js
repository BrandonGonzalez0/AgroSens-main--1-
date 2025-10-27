import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cors from 'cors';

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
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Servir modelos convertidos (TF.js) desde backend/public_models
  app.use('/models', express.static(PUBLIC_MODELS_DIR));

  app.get('/', (req, res) => {
    res.send('¡Servidor de AgroSens en funcionamiento!');
  });

  // Rutas principales
  app.use('/api/sensores', sensoresRoutes);
  app.use('/api/ia', iaRoutes);
  app.use('/api/models', modelsRoutes);
  app.use('/api/cultivos', cultivosRoutes);
  app.use('/api/recomendaciones', recomendacionesRoutes);
  app.use('/api/usuarios', usuariosRoutes);
  app.use('/api/alertas', alertasRoutes);

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT} (DB ${dbConnection ? 'conectada' : 'no disponible - modo local'})`));
};

start();