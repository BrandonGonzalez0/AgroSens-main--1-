import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";

import sensoresRoutes from "./routes/sensores.js";
import iaRoutes from "./routes/ia.js";
import cultivosRoutes from "./routes/cultivos.js";
import recomendacionesRoutes from "./routes/recomendaciones.js";
import usuariosRoutes from "./routes/usuarios.js";
import alertasRoutes from "./routes/alertas.js";


dotenv.config();

const start = async () => {
  try {
    await connectDB();

    const app = express();
    app.use(express.json());

    app.get("/", (req, res) => {
      res.send("¡Servidor de AgroSens en funcionamiento!");
    });

    // Rutas principales
    app.use("/api/sensores", sensoresRoutes);
    app.use("/api/ia", iaRoutes);
    app.use("/api/cultivos", cultivosRoutes);
    app.use("/api/recomendaciones", recomendacionesRoutes);
    app.use("/api/usuarios", usuariosRoutes);
    app.use("/api/alertas", alertasRoutes);
 

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));
  } catch (err) {
    console.error("Error al iniciar el servidor:", err.message || err);
    process.exit(1);
  }
};

start();