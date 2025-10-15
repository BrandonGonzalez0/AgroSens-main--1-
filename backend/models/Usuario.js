import mongoose from 'mongoose';

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, index: true },
  role: { type: String, default: 'user' }
}, { collection: 'usuarios', timestamps: true });

export default mongoose.models.Usuario || mongoose.model('Usuario', usuarioSchema);
