import mongoose from "mongoose";

const analisisIASchema = new mongoose.Schema({
  tipo: { type: String, enum: ["Madurez", "plagas"], required: true },
  resultado: String,
  imagenUrl: String,
  fecha: { type: Date, default: Date.now },
});

export default mongoose.models.AnalisisIA || mongoose.model("AnalisisIA", analisisIASchema);
