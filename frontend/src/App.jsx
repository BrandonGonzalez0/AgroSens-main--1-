import React, { useState, useEffect, useMemo } from "react";
import logo from "./logo.png";
import { motion } from "framer-motion";
import { validarCultivo, sugerirCultivos, cultivos } from "./ServiciosCultivos";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import cultivosDB from "./data/cultivos.json";

// Normaliza un nombre para buscar en cultivosDB (quita acentos, espacios y minúsculas)
function normalizeKey(name) {
  if (!name) return "";
  return name
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
}

// --- Carta de cultivo ---
function CultivoCard({ cultivo, onClick, selected }) {
  // cultivo: { nombre, ph, humedad, temperatura, imagen }
  return (
    <motion.button
      onClick={() => onClick(cultivo)}
      layout
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className={`text-left bg-white dark:bg-gray-800 rounded-2xl shadow p-3 transition-colors focus:outline-none border-2 ${
        selected ? "border-green-400" : "border-transparent"
      }`}
    >
      <div className="w-full h-36 overflow-hidden rounded-xl mb-3">
        <a href={cultivo.imagen} target="_blank" rel="noreferrer">
          <img
            src={cultivo.imagen}
            alt={cultivo.nombre}
            className="w-full h-full object-cover hover:opacity-90 transition-opacity"
          />
        </a>
      </div>
      <h3 className="text-lg font-bold text-green-700 dark:text-green-300 mb-1">{cultivo.nombre}</h3>
      <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
        <div><strong>pH:</strong> {cultivo.ph}</div>
        <div><strong>Humedad:</strong> {cultivo.humedad}</div>
        <div><strong>Temp.:</strong> {cultivo.temperatura}</div>
      </div>
    </motion.button>
  );
}

function DetallePanel({ item, onClose, currentPh, currentHum, currentTemp }) {
  const [showRecs, setShowRecs] = useState(false);
  const [recs, setRecs] = useState([]);

  useEffect(() => {
    // reset when item changes
    setShowRecs(false);
    setRecs([]);
  }, [item]);

  if (!item) return null;

  const buildRecommendations = () => {
    const list = [];
    const db = cultivosDB[item.nombre.toLowerCase()];
    const phVal = parseFloat(currentPh);
    const humVal = parseFloat(currentHum);
    const tempVal = parseFloat(currentTemp);

    if (db && Array.isArray(db.ph)) {
      if (!isNaN(phVal)) {
        if (phVal < db.ph[0]) list.push({ id: 'ph_low', text: 'Aumentar pH: aplicar cal agrícola (monitorizar cada semana).', done: false });
        else if (phVal > db.ph[1]) list.push({ id: 'ph_high', text: 'Reducir pH: aplicar azufre o enmiendas ácidas.', done: false });
      }
    }

    if (db && Array.isArray(db.humedad)) {
      if (!isNaN(humVal)) {
        if (humVal < db.humedad[0]) list.push({ id: 'hum_low', text: 'Incrementar humedad: aumentar riego/uso de mulching.', done: false });
        else if (humVal > db.humedad[1]) list.push({ id: 'hum_high', text: 'Reducir humedad: mejorar drenaje y reducir riegos.', done: false });
      }
    }

    if (db && Array.isArray(db.temperatura)) {
      if (!isNaN(tempVal)) {
        if (tempVal < db.temperatura[0]) list.push({ id: 'temp_low', text: 'Aumentar temperatura: considerar invernadero o coberturas.', done: false });
        else if (tempVal > db.temperatura[1]) list.push({ id: 'temp_high', text: 'Reducir temperatura: sombreo, ventilación o mallas.', done: false });
      }
    }

    // Si no hay reglas específicas, ofrecer recomendaciones generales
    if (list.length === 0) {
      list.push({ id: 'general1', text: 'Realizar análisis de suelo completo antes de decisiones mayores.', done: false });
      list.push({ id: 'general2', text: 'Mejorar materia orgánica para retención de agua y nutrientes.', done: false });
    }

    return list;
  };

  const onToggleRec = (id) => {
    setRecs((prev) => prev.map(r => r.id === id ? { ...r, done: !r.done } : r));
  };

  const onShowRecs = () => {
    const built = buildRecommendations();
    setRecs(built);
    setShowRecs(true);
  };

  const doneCount = recs.filter(r => r.done).length;
  const progress = recs.length ? Math.round((doneCount / recs.length) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full md:w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4">
      <div className="w-full h-36 mb-3 overflow-hidden rounded-xl">
        <a href={item.imagen} target="_blank" rel="noreferrer">
          <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover" />
        </a>
      </div>
      <h2 className="text-xl font-bold text-green-700 dark:text-green-300 mb-2">{item.nombre}</h2>
      <p className="text-sm text-gray-700 dark:text-gray-300"><strong>pH ideal:</strong> {item.ph}</p>
      <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Humedad:</strong> {item.humedad}</p>
      <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Temperatura:</strong> {item.temperatura}</p>
      <div className="mt-4 flex gap-2">
        <button onClick={onClose} className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-sm">Cerrar</button>
        <button onClick={onShowRecs} className="px-3 py-2 rounded-lg bg-green-700 text-white text-sm">Ver recomendaciones</button>
      </div>

      {showRecs && (
        <div className="mt-4">
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">Progreso: {progress}%</div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full mb-3">
            <div className="h-2 rounded-full bg-green-500" style={{ width: `${progress}%` }} />
          </div>
          <ul className="space-y-2">
            {recs.map(r => (
              <li key={r.id} className="flex items-center gap-2">
                <input type="checkbox" checked={r.done} onChange={() => onToggleRec(r.id)} />
                <span className={`text-sm ${r.done ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>{r.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
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
  // UI para modo sugerido
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCultivo, setSelectedCultivo] = useState(null);

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

  const filteredSugerencias = useMemo(() => {
    if (!resultado || !resultado.sugerencias) return [];
    const term = searchTerm.trim().toLowerCase();
    return resultado.sugerencias.filter(s => s.nombre.toLowerCase().includes(term));
  }, [resultado, searchTerm]);

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
        {modo === "definido" ? "🌱 Validacion de cultivos" : "🤝 Cultivos Sugeridos"}
      </h1>

      {modo === "definido" ? (
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg transition-colors">
            <div className="mb-4">
              <label className="block mb-1 font-semibold">Selecciona el cultivo</label>
              <select value={cultivo} onChange={(e) => setCultivo(e.target.value)} className="w-full border rounded-lg p-2 text-black">
                <option value="">-- Elige un cultivo --</option>
                {cultivos.map(c => (
                  <option key={c.nombre} value={c.nombre}>{c.nombre}</option>
                ))}
              </select>
            </div>

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

            <motion.button
              onClick={handleValidar}
              className="w-full bg-green-700 text-white py-2 rounded-xl font-semibold hover:bg-green-800"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Validar Cultivo
            </motion.button>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg transition-colors">
            <h3 className="text-lg font-semibold mb-3">Vista previa del cultivo</h3>
            {cultivo ? (
              (() => {
                const found = cultivos.find(c => normalizeKey(c.nombre) === normalizeKey(cultivo));
                if (found) return <CultivoCard cultivo={found} onClick={() => {}} selected={true} />;
                return <div className="text-sm text-gray-600">No se encontró información del cultivo seleccionado.</div>;
              })()
            ) : (
              <div className="text-sm text-gray-600">Selecciona un cultivo para ver la tarjeta aquí.</div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg w-full max-w-md transition-colors">
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

          <motion.button
            onClick={handleSugerir}
            className="w-full bg-blue-600 text-white py-2 rounded-xl font-semibold hover:bg-blue-700"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Sugerir Cultivos
          </motion.button>
        </div>
      )}

      {/* --- Resultado --- */}
      {resultado && (
        <div className="mt-6 w-full flex flex-col items-center">
          {modo === "sugerido" && resultado.viable && resultado.sugerencias ? (
            // Dashboard layout: lista de cards + panel de detalle
            <div className="w-full grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2">
                <div className="mb-4 flex items-center gap-3">
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar cultivo..."
                    className="flex-1 p-2 rounded-lg border"
                  />
                  <div className="text-sm text-gray-600 dark:text-gray-300">Resultados: {filteredSugerencias.length}</div>
                </div>

                {filteredSugerencias.length === 0 ? (
                  <div className="p-4 rounded-xl bg-white dark:bg-gray-800 shadow">No se encontraron cultivos.</div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredSugerencias.map((c) => (
                      <CultivoCard
                        key={c.nombre}
                        cultivo={c}
                        onClick={(it) => setSelectedCultivo(it)}
                        selected={selectedCultivo && selectedCultivo.nombre === c.nombre}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="md:col-span-1">
                {selectedCultivo ? (
                  <DetallePanel item={selectedCultivo} onClose={() => setSelectedCultivo(null)} currentPh={ph} currentHum={humedad} currentTemp={temperatura} />
                ) : (
                  <div className="p-4 rounded-xl bg-white dark:bg-gray-800 shadow text-center">
                    <p className="text-gray-700 dark:text-gray-300">Selecciona una tarjeta para ver detalles del cultivo.</p>
                  </div>
                )}
              </div>
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

              {modo === "definido" && cultivo && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Detalles del cultivo seleccionado</h3>
                  {/* buscar datos en la lista 'cultivos' exportada */}
                  {(() => {
                    const found = cultivos.find(c => normalizeKey(c.nombre) === normalizeKey(cultivo));
                    if (found) return <CultivoCard cultivo={found} onClick={() => {}} selected={true} />;
                    return <div className="text-sm text-gray-600">No se encontró información del cultivo seleccionado.</div>;
                  })()}
                </div>
              )}

              {/* --- Dashboard comparativo dinámico --- */}
              {modo === "definido" &&
                cultivo &&
                cultivosDB[normalizeKey(cultivo)] && (
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
                              (cultivosDB[normalizeKey(cultivo)].ph[0] +
                                cultivosDB[normalizeKey(cultivo)].ph[1]) /
                              2,
                          },
                          {
                            parametro: "Humedad (%)",
                            Actual: Number(humedad),
                            Ideal:
                              (cultivosDB[normalizeKey(cultivo)].humedad[0] +
                                cultivosDB[normalizeKey(cultivo)].humedad[1]) /
                              2,
                          },
                          {
                            parametro: "Temperatura (°C)",
                            Actual: Number(temperatura),
                            Ideal:
                              (cultivosDB[normalizeKey(cultivo)].temperatura[0] +
                                cultivosDB[normalizeKey(cultivo)].temperatura[1]) /
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
