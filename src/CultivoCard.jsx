import React from "react";

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
        <strong>pH ideal:</strong> {ph}
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

export default CultivoCard;
