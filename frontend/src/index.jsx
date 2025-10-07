import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Si usas Tailwind o cualquier otro CSS
import App from './App'; // Asegúrate de que App esté correctamente importado

const root = ReactDOM.createRoot(document.getElementById('root')); 
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
