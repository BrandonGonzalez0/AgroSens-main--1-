import React, { useState } from 'react';
import './Medicion.css';

function Medicion() {
  const [datos, setDatos] = useState({
    ph: '',
    humedad: '',
    temperatura: ''
  });

  const handleChange = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

  const enviarDatos = () => {
    console.log('Datos enviados:', datos);
    alert('Datos del terreno registrados correctamente.');
  };

  return (
    <div className="medicion">
      <h2>Medición del Terreno</h2>
      <input type="number" name="ph" placeholder="pH del suelo" value={datos.ph} onChange={handleChange} />
      <input type="number" name="humedad" placeholder="Humedad (%)" value={datos.humedad} onChange={handleChange} />
      <input type="number" name="temperatura" placeholder="Temperatura (°C)" value={datos.temperatura} onChange={handleChange} />
      <button onClick={enviarDatos}>Registrar</button>
    </div>
  );
}

export default Medicion;
