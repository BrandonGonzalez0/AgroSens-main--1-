import React from "react";

function CultivoCard({ cultivo, onClick, selected }) {
  // cultivo: { nombre, ph, humedad, temperatura, imagen, icon }
  const icon = cultivo.icon;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 w-72 transition-colors">
      <div className="w-full h-40 flex items-center justify-center rounded-xl mb-3 bg-gray-50 dark:bg-gray-700">
        {icon ? (
          <div className="text-6xl leading-none" aria-hidden>{icon}</div>
        ) : (
          <img
            src={cultivo.imagen}
            alt={cultivo.nombre}
            className="w-full h-full object-cover rounded-xl"
          />
        )}
      </div>
      <h2 className="text-xl font-bold text-green-700 dark:text-green-300 mb-2">
        {cultivo.nombre}
      </h2>
      <p className="text-sm text-gray-700 dark:text-gray-300">
        <strong>pH ideal:</strong> {cultivo.ph}
      </p>
      <p className="text-sm text-gray-700 dark:text-gray-300">
        <strong>Humedad:</strong> {cultivo.humedad}
      </p>
      <p className="text-sm text-gray-700 dark:text-gray-300">
        <strong>Temperatura:</strong> {cultivo.temperatura}
      </p>
    </div>
  );
}

export default CultivoCard;
