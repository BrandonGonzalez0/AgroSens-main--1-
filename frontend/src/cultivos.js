import React, { useState } from "react";
import vegetales from "../data/vegetales.json";

function Cultivos() {
  const [nombre, setNombre] = useState("");
  const [ph, setPh] = useState("");
  const [humedad, setHumedad] = useState("");
  const [temperatura, setTemperatura] = useState("");
  const [resultado, setResultado] = useState(null);

  const evaluarCultivo = (nombre, ph, humedad, temperatura) => {
    const vegetal = vegetales.find(
      (v) => v.nombre.toLowerCase() === nombre.toLowerCase()
    );

    if (!vegetal) {
      return {
        apto: false,
        carta: `❌ El cultivo "${nombre}" no se encuentra en la base de datos.`,
        recomendaciones: [],
      };
    }

    const esApto =
      ph >= vegetal.ph[0] &&
      ph <= vegetal.ph[1] &&
      humedad >= vegetal.humedad[0] &&
      humedad <= vegetal.humedad[1] &&
      temperatura >= vegetal.temperatura[0] &&
      temperatura <= vegetal.temperatura[1];

    if (esApto) {
      return {
        apto: true,
        carta: `✅ Según las condiciones ingresadas, el cultivo de ${vegetal.nombre} es APTO para ser plantado en tu terreno.`,
        recomendaciones: [
          `Mantén el pH entre ${vegetal.ph[0]} y ${vegetal.ph[1]}`,
          `Controla la humedad entre ${vegetal.humedad[0]}% y ${vegetal.humedad[1]}%`,
          `Asegura una temperatura entre ${vegetal.temperatura[0]}°C y ${vegetal.temperatura[1]}°C`,
        ],
      };
    } else {
      return {
        apto: false,
        carta: `❌ Según las condiciones ingresadas, el cultivo de ${vegetal.nombre} NO es apto para ser plantado en tu terreno.`,
        recomendaciones: vegetal.recomendaciones,
      };
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const evaluacion = evaluarCultivo(
      nombre,
      parseFloat(ph),
      parseFloat(humedad),
      parseFloat(temperatura)
    );
    setResultado(evaluacion);
  };

  return (
    <div className="contenedor">
      <h2>🌱 Validación de Cultivo</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nombre del cultivo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="pH"
          value={ph}
          onChange={(e) => setPh(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Humedad (%)"
          value={humedad}
          onChange={(e) => setHumedad(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Temperatura (°C)"
          value={temperatura}
          onChange={(e) => setTemperatura(e.target.value)}
          required
        />
        <button type="submit">Validar Cultivo</button>
      </form>

      {resultado && (
        <div className="resultado">
          <p>{resultado.carta}</p>
          {resultado.recomendaciones.length > 0 && (
            <div>
              <h3>Recomendaciones:</h3>
              <ul>
                {resultado.recomendaciones.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Cultivos;
