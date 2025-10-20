import mongoose from 'mongoose';
import Cultivo from '../models/Cultivo.js'; // Asumimos que tienes un modelo Cultivo
import express from 'express';

const router = express.Router();

// Conexión a la base de datos
const connectDB = async () => {
  try {
    // Si no hay una conexión activa, se establece una nueva
    if (mongoose.connection.readyState === 0) {
      const uri = process.env.MONGO_URI;
      if (!uri) throw new Error("Falta MONGO_URI en las variables de entorno");
      await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
      console.log("Conectado a MongoDB");
    }
  } catch (err) {
    console.error("Error al conectar con MongoDB:", err);
    throw new Error("Error de conexión a la base de datos");
  }
};

// Ruta principal para probar la conexión
router.get('/', (req, res) => {
  res.json({ message: "Ruta de cultivos funciona" });
});

// Ruta para obtener todos los cultivos
router.get('/all', async (req, res) => {
  try {
    // Primero, nos aseguramos de que la base de datos esté conectada
    await connectDB();

    // Ahora obtenemos los cultivos
    const cultivos = await Cultivo.find().lean();

    // Si no hay cultivos, enviamos una respuesta vacía
    if (!cultivos || cultivos.length === 0) {
      return res.status(404).json({ message: "No se encontraron cultivos" });
    }

    // Devolvemos los cultivos
    return res.status(200).json(cultivos);
  } catch (err) {
    console.error("/api/cultivos error:", err);
    return res.status(500).json({ error: "Error al obtener cultivos" });
  }
});

export default router;
