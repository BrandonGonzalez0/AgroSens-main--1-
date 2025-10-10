import React from "react";
import CultivoCard from "./CultivoCard";

function SuggestedCultivos({ resultado }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {resultado.sugerencias.map((cultivo) => (
        <CultivoCard
          key={cultivo.nombre}
          nombre={cultivo.nombre}
          ph={cultivo.ph}
          humedad={cultivo.humedad}
          temperatura={cultivo.temperatura}
          imagen={cultivo.imagen}
          recomendacion="Este cultivo es recomendable para tus condiciones actuales."
        />
      ))}
    </div>
  );
}

export default SuggestedCultivos;
