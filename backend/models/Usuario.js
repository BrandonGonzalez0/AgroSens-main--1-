import mongoose from 'mongoose';

const usuarioSchema = new mongoose.Schema({
  nombre: String,
  correo: String,
  password: String,
  rol: {type: String, enum:["agricultor", "admin"], default: "agricultor"}
});

export default mongoose.model("Usuario", usuarioSchema);