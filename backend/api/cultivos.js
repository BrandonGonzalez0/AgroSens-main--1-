import mongoose from "mongoose";
import Cultivo from "../models/Cultivo.js";

let conn; // conexión compartida entre invocaciones

async function connectDB() {
  if (!conn) {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("Falta MONGO_URI en variables de entorno");
    const opts = {};
    // Si la URI NO incluye el nombre de la base, descomenta:
    // opts.dbName = process.env.MONGO_DB || "AgroSens";
    conn = mongoose.connect(uri, opts);
  }
  await conn;
}

export default async function handler(req, res) {
  // CORS básico (ajusta origin en producción)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    await connectDB();
    const cultivos = await Cultivo.find().lean();
    return res.status(200).json(cultivos);
  } catch (err) {
    console.error("/api/cultivos error:", err);
    return res.status(500).json({ error: "Error al obtener cultivos" });
  }
}
