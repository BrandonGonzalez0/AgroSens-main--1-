import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';  // Asegúrate de que el archivo de estilos esté importado
import App from './App';

// Asegúrate de que React se esté renderizando correctamente en el DOM
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
