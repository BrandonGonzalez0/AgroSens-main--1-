import React, { useRef } from 'react';

export default function SuggestedCarousel({ suggestions = [], selected, onSelect }) {
  const containerRef = useRef(null);

  const scrollBy = (offset) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollBy({ left: offset, behavior: 'smooth' });
  };

  if (!Array.isArray(suggestions) || suggestions.length === 0) {
    return <div className="p-4 rounded-xl bg-white dark:bg-gray-800 shadow">No hay sugerencias.</div>;
  }

  return (
    <div className="relative">
      <button
        onClick={() => scrollBy(-300)}
        aria-label="Anterior"
        className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 dark:bg-gray-800/80 p-2 rounded-full shadow"
      >◀</button>

      <div ref={containerRef} className="flex gap-4 overflow-x-auto no-scrollbar py-2 px-8">
        {suggestions.map((c) => (
          <button
            key={c.nombre}
            onClick={() => onSelect(c)}
            className={`flex-shrink-0 w-64 md:w-72 lg:w-80 text-left bg-white dark:bg-gray-800 rounded-2xl shadow p-3 transition-colors border-2 card ${selected && selected.nombre === c.nombre ? 'border-green-400' : 'border-transparent'}`}
          >
            <div className="w-full h-40 overflow-hidden rounded-xl mb-3">
              <img src={c.imagen} alt={c.nombre} className="w-full h-full object-cover card-img" />
            </div>
            <h3 className="text-lg font-bold text-green-700 dark:text-green-300 mb-1">{c.nombre}</h3>
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <div><strong>pH:</strong> {Array.isArray(c.ph) ? `${c.ph[0]} - ${c.ph[1]}` : c.ph}</div>
              <div><strong>Humedad:</strong> {Array.isArray(c.humedad) ? `${c.humedad[0]} - ${c.humedad[1]}` : c.humedad}</div>
              <div><strong>Temp.:</strong> {Array.isArray(c.temperatura) ? `${c.temperatura[0]} - ${c.temperatura[1]}` : c.temperatura}</div>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => scrollBy(300)}
        aria-label="Siguiente"
        className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 dark:bg-gray-800/80 p-2 rounded-full shadow"
      >▶</button>
    </div>
  );
}
