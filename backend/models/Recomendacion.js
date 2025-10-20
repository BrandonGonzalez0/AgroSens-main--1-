import mongoose from 'mongoose';

const recomendacionSchema = new mongoose.Schema({
  cultivoSugerido: { type: mongoose.Schema.Types.ObjectId, ref: 'Cultivo' },
  condicionesActuales: {
    ph: Number,
    humedad: Number,
    temperatura: Number
  },
  fecha: { type: Date, default: Date.now },
});

export default mongoose.models.Recomendacion || mongoose.model("Recomendacion", recomendacionSchema);