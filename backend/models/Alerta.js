import mongoose from 'mongoose';

const alertaSchema = new mongoose.Schema({
  tipo: String,
  mensaje: String,
  nivel: { type: String, default: 'info' },
  metadata: mongoose.Schema.Types.Mixed,
  acknowledged: { type: Boolean, default: false }
}, { collection: 'alertas', timestamps: true });

export default mongoose.models.Alerta || mongoose.model('Alerta', alertaSchema);
