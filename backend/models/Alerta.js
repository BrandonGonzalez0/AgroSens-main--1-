import mongoose from 'mongoose';

const alertaSchema = new mongoose.Schema({

  tipo: String,
  mensaje: String,
  prioridad: { type: String, enum: ['baja', 'media', 'alta'], default: 'media' },
  fecha: { type: Date, default: Date.now },



});

export default mongoose.model("Alerta", alertaSchema);
