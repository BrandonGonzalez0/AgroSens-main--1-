import React from 'react';
import './Historial.css';

function Historial() {
  const registros = [
    { fecha: '2025-08-20', cultivo: 'Lechuga', resultado: 'Compatible' },
    { fecha: '2025-08-22', cultivo: 'Tomate', resultado: 'No compatible' }
  ];

  return (
    <div className="historial">
      <h2>Historial de Análisis</h2>
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Cultivo</th>
            <th>Resultado</th>
          </tr>
        </thead>
        <tbody>
          {registros.map((r, index) => (
            <tr key={index}>
              <td>{r.fecha}</td>
              <td>{r.cultivo}</td>
              <td>{r.resultado}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Historial;
