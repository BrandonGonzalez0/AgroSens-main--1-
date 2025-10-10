import React from "react";
import ReactDOM from "react-dom";
import App from "./App"; // Asegúrate de que App.jsx esté correctamente importado
import "./index.css"; // Si tienes un archivo CSS global

// Registrar service worker generado por vite-plugin-pwa si está disponible
(async () => {
  try {
    const sw = await import('virtual:pwa-register');
    if (sw && typeof sw.registerSW === 'function') {
      sw.registerSW({
        onNeedRefresh() { console.log('Nuevo contenido disponible - recarga recomendada'); },
        onOfflineReady() { console.log('La aplicación está lista para funcionar offline'); }
      });
    }
  } catch (e) {
    // no pasa nada si el plugin no está disponible en este entorno
  }
})();

const rootElement = document.getElementById("app"); // El contenedor en index.html
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
