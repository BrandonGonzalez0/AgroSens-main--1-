import express from "express";
import Recomendacion from "../models/Recomendacion.js"; // Asegúrate que coincida el nombre
import { sanitizeInput } from '../middleware/validation.js';

const router = express.Router();

// Obtener todas las recomendaciones
router.get("/", async (req, res) => {
  try {
    const recomendaciones = await Recomendacion.find();
    res.json(recomendaciones);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Crear una nueva recomendación
router.post("/", sanitizeInput, async (req, res) => {
  try {
    const nueva = new Recomendacion(req.body);
    await nueva.save();
    res.status(201).json(nueva);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;