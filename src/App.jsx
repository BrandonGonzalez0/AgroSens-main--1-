import React, { useState, useEffect } from "react";
import logo from "./logo.png";
import { motion } from "framer-motion";
import { validarCultivo, sugerirCultivos } from "./ServiciosCultivos";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import cultivosDB from "./data/cultivos.json";

// --- Carta de cultivo ---
function CultivoCard({ nombre, ph, humedad, temperatura, imagen, recomendacion }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 w-72 transition-colors">
      <img
        src={imagen}
        alt={nombre}
        className="w-full h-40 object-cover rounded-xl mb-3"
      />
      <h2 className="text-xl font-bold text-green-700 dark:text-green-300 mb-2">
        {nombre}
      </h2>
      <p className="text-sm text-gray-700 dark:text-gray-300">
        <strong>pH ideal del Cultivo:</strong> {ph}
      </p>
      <p className="text-sm text-gray-700 dark:text-gray-300">
        <strong>Humedad:</strong> {humedad}
      </p>
      <p className="text-sm text-gray-700 dark:text-gray-300">
        <strong>Temperatura:</strong> {temperatura}
      </p>
      <p className="mt-2 text-gray-600 dark:text-gray-400 italic">
        {recomendacion}
      </p>
    </div>
  );
}

function App() {
  const [loading, setLoading] = useState(true);
  const [modo, setModo] = useState(null);
  const [cultivo, setCultivo] = useState("");
  const [ph, setPh] = useState("");
  const [humedad, setHumedad] = useState("");
  const [temperatura, setTemperatura] = useState("");
  const [resultado, setResultado] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  // Splash screen
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  // Dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const handleValidar = () => {
    const res = validarCultivo(cultivo, ph, humedad, temperatura);

    if (res.viable) {
      setResultado({
        viable: true,
        mensaje: `✅ El cultivo de ${cultivo} es APTO para tus condiciones. 
        Puedes proceder con la plantación sin problemas.`,
      });
    } else {
      setResultado({
        viable: false,
        mensaje: `❌ El cultivo de ${cultivo} NO es apto actualmente.`,
        pasos: [
          "Ajustar el pH del suelo aplicando enmiendas (cal para subirlo, azufre para bajarlo).",
          "Mejorar la retención de humedad usando riego por goteo o cobertura orgánica.",
          "Optimizar la temperatura mediante invernaderos, mallas de sombreo o ventilación.",
          "Realizar un análisis de suelo para identificar nutrientes faltantes.",
        ],
      });
    }
  };

  const handleSugerir = () => {
    const res = sugerirCultivos(ph, humedad, temperatura);
    setResultado(
      res.length > 0
        ? { viable: true, sugerencias: res }
        : { viable: false, mensaje: "No hay cultivos compatibles con estas condiciones." }
    );
  };

  // --- Splash ---
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-green-100 via-green-200 to-green-300 dark:from-gray-800 dark:via-gray-900 dark:to-black transition-colors">
        <motion.img
          src={logo}
          alt="AgroSens Logo"
          className="w-48 h-48 drop-shadow-lg"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <motion.h1
          className="mt-6 text-3xl font-bold text-green-900 dark:text-green-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
        >
          Bienvenido a AgroSens
        </motion.h1>
      </div>
    );
  }

  // --- Selección de modo ---
  if (!modo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-green-100 via-green-200 to-green-300 dark:from-gray-800 dark:via-gray-900 dark:to-black text-gray-800 dark:text-gray-100 p-6 transition-colors">
        <h1 className="text-3xl font-bold mb-6">Selecciona el modo de uso</h1>
        <motion.button
          onClick={() => setModo("definido")}
          className="w-64 bg-green-700 text-white py-3 rounded-xl font-semibold mb-4 shadow-md hover:bg-green-800"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🌱 Modo Cultivo Definido
        </motion.button>
        <motion.button
          onClick={() => setModo("sugerido")}
          className="w-64 bg-blue-600 text-white py-3 rounded-xl font-semibold shadow-md hover:bg-blue-700"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🤝 Modo Cultivo Sugerido
        </motion.button>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="mt-6 px-4 py-2 rounded-xl bg-gray-700 text-white dark:bg-yellow-400 dark:text-black shadow hover:scale-105 transition-transform"
        >
          {darkMode ? "☀️ Modo Claro" : "🌙 Modo Oscuro"}
        </button>
      </div>
    );
  }

  // --- Formulario común ---
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-green-100 via-green-200 to-green-300 dark:from-gray-800 dark:via-gray-900 dark:to-black text-gray-800 dark:text-gray-100 p-6 transition-colors">
      <h1 className="text-3xl font-bold mb-6">
        {modo === "definido" ? "🌱 Validación de Cultivo" : "🤝 Cultivos Sugeridos"}
      </h1>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg w-full max-w-md transition-colors">
        {modo === "definido" && (
          <div className="mb-4">
            <label className="block mb-1 font-semibold">Nombre del cultivo</label>
            <input
              type="text"
              value={cultivo}
              onChange={(e) => setCultivo(e.target.value)}
              className="w-full border rounded-lg p-2 text-black"
              placeholder="Ej: Tomate"
            />
          </div>
        )}

        <div className="mb-4">
          <label className="block mb-1 font-semibold">pH</label>
          <input
            type="number"
            value={ph}
            onChange={(e) => setPh(e.target.value)}
            className="w-full border rounded-lg p-2 text-black"
            placeholder="Ej: 6.5"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-semibold">Humedad (%)</label>
          <input
            type="number"
            value={humedad}
            onChange={(e) => setHumedad(e.target.value)}
            className="w-full border rounded-lg p-2 text-black"
            placeholder="Ej: 70"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-semibold">Temperatura (°C)</label>
          <input
            type="number"
            value={temperatura}
            onChange={(e) => setTemperatura(e.target.value)}
            className="w-full border rounded-lg p-2 text-black"
            placeholder="Ej: 22"
          />
        </div>

        {modo === "definido" ? (
          <motion.button
            onClick={handleValidar}
            className="w-full bg-green-700 text-white py-2 rounded-xl font-semibold hover:bg-green-800"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Validar Cultivo
          </motion.button>
        ) : (
          <motion.button
            onClick={handleSugerir}
            className="w-full bg-blue-600 text-white py-2 rounded-xl font-semibold hover:bg-blue-700"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Sugerir Cultivos
          </motion.button>
        )}
      </div>

      {/* --- Resultado --- */}
      {resultado && (
        <div className="mt-6 w-full flex flex-col items-center">
          {modo === "sugerido" && resultado.viable && resultado.sugerencias ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {resultado.sugerencias.map((c) => (
                <CultivoCard
                  key={c.nombre}
                  nombre={c.nombre}
                  ph={c.ph}
                  humedad={c.humedad}
                  temperatura={c.temperatura}
                  imagen={c.imagen}
                  recomendacion="Este cultivo es recomendable para tus condiciones actuales."
                />
              ))}
            </div>
          ) : (
            <motion.div
              className="mt-6 p-4 rounded-xl shadow-md bg-white dark:bg-gray-800 w-full max-w-lg text-left"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h2 className="text-lg font-bold mb-2">📜 Carta de Recomendación</h2>
              <p className="mb-2">{resultado.mensaje}</p>
              {!resultado.viable && resultado.pasos && (
                <ul className="list-disc pl-6 text-sm text-gray-700 dark:text-gray-300">
                  {resultado.pasos.map((paso, i) => (
                    <li key={i}>{paso}</li>
                  ))}
                </ul>
              )}

              {/* --- Dashboard comparativo dinámico --- */}
              {modo === "definido" &&
                cultivo &&
                cultivosDB[cultivo.toLowerCase()] && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-2">
                      Requerimientos vs valores actuales
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart
                        data={[
                          {
                            parametro: "pH",
                            Actual: Number(ph),
                            Ideal:
                              (cultivosDB[cultivo.toLowerCase()].ph[0] +
                                cultivosDB[cultivo.toLowerCase()].ph[1]) /
                              2,
                          },
                          {
                            parametro: "Humedad (%)",
                            Actual: Number(humedad),
                            Ideal:
                              (cultivosDB[cultivo.toLowerCase()].humedad[0] +
                                cultivosDB[cultivo.toLowerCase()].humedad[1]) /
                              2,
                          },
                          {
                            parametro: "Temperatura (°C)",
                            Actual: Number(temperatura),
                            Ideal:
                              (cultivosDB[cultivo.toLowerCase()].temperatura[0] +
                                cultivosDB[cultivo.toLowerCase()].temperatura[1]) /
                              2,
                          },
                        ]}
                      >
                        <XAxis dataKey="parametro" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Actual" fill="#f87171" />
                        <Bar dataKey="Ideal" fill="#34d399" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
            </motion.div>
          )}
        </div>
      )}

      {/* Botón volver */}
      <button
        onClick={() => {
          setModo(null);
          setResultado(null);
          setCultivo("");
          setPh("");
          setHumedad("");
          setTemperatura("");
        }}
        className="mt-6 underline text-sm"
      >
        ⬅ Volver a seleccionar modo
      </button>

      {/* Botón dark mode */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="mt-6 px-4 py-2 rounded-xl bg-gray-700 text-white dark:bg-yellow-400 dark:text-black shadow hover:scale-105 transition-transform"
      >
        {darkMode ? "☀️ Modo Claro" : "🌙 Modo Oscuro"}
      </button>
    </div>
  );
}

export default App;
