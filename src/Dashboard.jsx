import React, { useState } from "react";
import { sugerirCultivos } from "./ServiciosCultivos";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from "recharts";


export default function Dashboard() {
  const [ph, setPh] = useState(6.5);
  const [humedad, setHumedad] = useState(65);
  const [temperatura, setTemperatura] = useState(20);
  const [sugerencias, setSugerencias] = useState([]);

  const generarDashboard = () => {
    const res = sugerirCultivos(ph, humedad, temperatura);
    setSugerencias(res);
  };

  const COLORS = ["#00C49F", "#FF8042"];

  return (
    <div className="p-6 bg-gray-50 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4">📊 Dashboard AgroSens</h2>

      {/* Inputs */}
      <div className="flex gap-4 mb-4">
        <input
          type="number"
          value={ph}
          onChange={(e) => setPh(parseFloat(e.target.value))}
          placeholder="pH"
          className="border p-2 rounded"
        />
        <input
          type="number"
          value={humedad}
          onChange={(e) => setHumedad(parseFloat(e.target.value))}
          placeholder="Humedad (%)"
          className="border p-2 rounded"
        />
        <input
          type="number"
          value={temperatura}
          onChange={(e) => setTemperatura(parseFloat(e.target.value))}
          placeholder="Temperatura (°C)"
          className="border p-2 rounded"
        />

        <button
          onClick={generarDashboard}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Generar Dashboard
        </button>
      </div>

      {/* Gráfico de barras */}
      {sugerencias.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Compatibilidad de Cultivos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sugerencias}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombre" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="compatibilidad" fill="#4F46E5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Gráfico de pastel */}
      {sugerencias.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Cultivos de Exportación vs Locales</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  {
                    name: "Exportación",
                    value: sugerencias.filter((s) => s.exportacion).length,
                  },
                  {
                    name: "Locales",
                    value: sugerencias.filter((s) => !s.exportacion).length,
                  },
                ]}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label
              >
                {sugerencias.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
