import mongoose from 'mongoose';

const cultivoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  ph: { type: [Number], required: true },
  humedad: { type: [Number], required: true },
  temperatura: { type: [Number], required: true },
  imagen: { type: String, required: true },
  icono: { type: String, required: true },
  siembra: { type: [String], required: true },
});

const Cultivo = mongoose.model('Cultivo', cultivoSchema);

export default Cultivo;
