import React from "react";
import CultivoCard from "./CultivoCard";

function SuggestedCultivos({ resultado }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {resultado.sugerencias.map((cultivo) => (
        <CultivoCard
          key={cultivo.nombre}
          cultivo={cultivo}
          onClick={() => {}}
          selected={false}
        />
      ))}
    </div>
  );
}

export default SuggestedCultivos;
