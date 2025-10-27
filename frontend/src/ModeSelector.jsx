import React, { useState, useEffect } from "react";
import logo from "./logo.png";
import { motion } from "framer-motion";
import ModeSelector from "./ModeSelector"; 
import CultivoForm from "./CultivoForm"; 
import SuggestedCultivos from "./SuggestedCultivos"; 
import Dashboard from "./Dashboard"; 
import { validarCultivo, sugerirCultivos } from "./ServiciosCultivos"; 
import cultivosDB from "./data/cultivos.json"; 
import CultivosManager from "./CultivosManager";

// --- Splash Screen ---
function SplashScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-green-100 via-green-200 to-green-300 dark:from-gray-800 dark:via-gray-900 dark:to-black transition-colors">
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

function App() {
  const [loading, setLoading] = useState(true);
  const [modo, setModo] = useState(null);
  const [cultivo, setCultivo] = useState("");
  const [ph, setPh] = useState("");
  const [humedad, setHumedad] = useState("");
  const [temperatura, setTemperatura] = useState("");
  const [resultado, setResultado] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [showManager, setShowManager] = useState(false);

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
    console.log("Resultado Validado: ", res); // Verificar los datos
    setResultado(res);
  };

  const handleSugerir = () => {
    const res = sugerirCultivos(ph, humedad, temperatura);
    console.log("Resultado Sugerido: ", res); // Verificar los datos
    setResultado(res);
  };

  // --- Splash ---
  if (loading) {
    return <SplashScreen />;
  }

  // --- Modo Seleccionado ---
  if (!modo) {
    return <ModeSelector setModo={setModo} />;
  }

  // --- Formulario y resultados ---
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-green-100 via-green-200 to-green-300 dark:from-gray-800 dark:via-gray-900 dark:to-black text-gray-800 dark:text-gray-100 p-6 transition-colors">
      <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
        {modo === "definido" && (
          <>
            <h1 className="text-3xl font-bold mb-6 text-center">
              🌱 Validación de Cultivo
            </h1>
            <CultivoForm
              ph={ph}
              setPh={setPh}
              humedad={humedad}
              setHumedad={setHumedad}
              temperatura={temperatura}
              setTemperatura={setTemperatura}
              modo={modo}
              setCultivo={setCultivo}
            />
            <motion.button
              onClick={handleValidar}
              className="w-full bg-green-700 text-white py-2 rounded-xl font-semibold hover:bg-green-800"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Validar Cultivo
            </motion.button>
          </>
        )}

        {modo === "sugerido" && (
          <>
            <h1 className="text-3xl font-bold mb-6 text-center">
              🤝 Cultivos Sugeridos
            </h1>
            <CultivoForm
              ph={ph}
              setPh={setPh}
              humedad={humedad}
              setHumedad={setHumedad}
              temperatura={temperatura}
              setTemperatura={setTemperatura}
              modo={modo}
            />
            <motion.button
              onClick={handleSugerir}
              className="w-full bg-blue-600 text-white py-2 rounded-xl font-semibold hover:bg-blue-700"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Sugerir Cultivos
            </motion.button>
          </>
        )}

        {/* --- Resultado --- */}
        {resultado && (
          <div className="mt-6 w-full flex flex-col items-center">
            {resultado.viable ? (
              <SuggestedCultivos resultado={resultado} />
            ) : (
              <Dashboard
                cultivo={cultivo}
                ph={ph}
                humedad={humedad}
                temperatura={temperatura}
                cultivosDB={cultivosDB}
              />
            )}
          </div>
        )}

        {/* Botones en la misma línea */}
        <div className="flex justify-between mt-6">
          <button
            onClick={() => {
              setModo(null);
              setResultado(null);
              setCultivo("");
              setPh("");
              setHumedad("");
              setTemperatura("");
            }}
            className="px-4 py-2 rounded-xl bg-gray-700 text-white dark:bg-yellow-400 dark:text-black shadow hover:scale-105 transition-transform w-1/2 mr-2"
          >
            ⬅ Volver
          </button>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="px-4 py-2 rounded-xl bg-gray-700 text-white dark:bg-yellow-400 dark:text-black shadow hover:scale-105 transition-transform w-1/2"
          >
            {darkMode ? "☀️ Modo Claro" : "🌙 Modo Oscuro"}
          </button>
        </div>
        
        <div className="mt-4 flex justify-center">
          <button onClick={()=>setShowManager(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">⚙️ Gestionar cultivos</button>
        </div>
        {showManager && <CultivosManager open={showManager} onClose={()=>setShowManager(false)} />}
      </div>
    </div>
  );
}

export default App;
