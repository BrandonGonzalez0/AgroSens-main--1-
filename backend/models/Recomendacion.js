import mongoose from 'mongoose';

const recSchema = new mongoose.Schema({
  cultivo: String,
  titulo: String,
  cuerpo: String,
  condiciones: mongoose.Schema.Types.Mixed
}, { collection: 'recomendaciones', timestamps: true });

export default mongoose.models.Recomendacion || mongoose.model('Recomendacion', recSchema);
