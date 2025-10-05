import mongoose from "mongoose";

const cultivoSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, index: true },
    ph: { type: [Number], required: true },          // [min, max]
    humedad: { type: [Number], required: true },     // [min, max]
    temperatura: { type: [Number], required: true }, // [min, max]
    imagen: String
  },
  { collection: "cultivos", timestamps: true }
);

export default mongoose.models.Cultivo || mongoose.model("Cultivo", cultivoSchema);
