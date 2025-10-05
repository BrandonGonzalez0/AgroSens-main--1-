/**
 * Script de seed para poblar MongoDB con tu JSON de cultivos.
 * Uso (local):
 *   # O exporta MONGO_URI en tu terminal
 *   export MONGO_URI="mongodb+srv://user:pass@cluster.mongodb.net/AgroSens?retryWrites=true&w=majority"
 *   node scripts/seed.js
 *
 *   # o pasando MONGO_DB si tu URI no incluye DB:
 *   export MONGO_DB="AgroSens"
 *   node scripts/seed.js
 */

import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Cultivo from "../models/Cultivo.js";

const uri = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB; // opcional si la URI ya tiene /AgroSens

if (!uri) {
  console.error("❌ Falta MONGO_URI. Defínelo en el entorno antes de correr el seed.");
  process.exit(1);
}

async function run() {
  try {
    await mongoose.connect(uri, dbName ? { dbName } : undefined);
    console.log("✅ Conectado a Mongo");

    const file = path.resolve("data/cultivos.json");
    const raw = fs.readFileSync(file, "utf-8");
    const mapa = JSON.parse(raw); // { tomate: { ph:[..], humedad:[..], temperatura:[..], imagen:"..." }, ... }

    const docs = Object.entries(mapa).map(([nombre, v]) => ({
      nombre,
      ph: v.ph,
      humedad: v.humedad,
      temperatura: v.temperatura,
      imagen: v.imagen || ""
    }));

    await Cultivo.deleteMany({});
    await Cultivo.insertMany(docs);
    console.log(`✅ Insertados ${docs.length} cultivos`);
  } catch (e) {
    console.error("❌ Error seed:", e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
