import mongoose from "mongoose";

const cultivoSchema = new mongoose.Schema({
  nombre: String,
  phMin: Number,
  phMax: Number, 
  humedadMin: Number,
  humedadMax: Number, 
  temperaturaMin: Number,
  temperaturaMax: Number,
  temporada: String,
  descripcion: String,
  imagenUrl: String,
});

export default mongoose.model("Cultivo", cultivoSchema);
  