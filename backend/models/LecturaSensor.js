import mongoose from "mongoose";

const lecturasSensorSchema = new mongoose.Schema({
  ph: Number,
  humedad: Number,
  temperatura: Number,
  fecha: { type: Date, default: Date.now }
});

// Evita redefinir modelos en entornos con recarga (nodemon/hot-reload)
export default mongoose.models.LecturaSensor || mongoose.model("LecturaSensor", lecturasSensorSchema);