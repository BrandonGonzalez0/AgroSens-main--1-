import express from "express";
import Alerta from "../models/Alerta.js"; // Asegúrate que el modelo exista con ese nombre
const { sanitizeInput } = require('../middleware/validation.js');

const router = express.Router();

// Obtener todas las alertas
router.get("/", async (req, res) => {
  try {
    const alertas = await Alerta.find();
    res.json(alertas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Crear una nueva alerta
router.post("/", sanitizeInput, async (req, res) => {
  try {
    const nuevaAlerta = new Alerta(req.body);
    await nuevaAlerta.save();
    res.status(201).json(nuevaAlerta);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Eliminar una alerta (por ID)
router.delete("/:id", sanitizeInput, async (req, res) => {
  try {
    await Alerta.findByIdAndDelete(req.params.id);
    res.json({ message: "Alerta eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;