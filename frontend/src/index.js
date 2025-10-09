import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';  // Asegúrate de que App.jsx está siendo importado correctamente
import './index.css'; // Si tienes un archivo CSS global

const root = ReactDOM.createRoot(document.getElementById('app'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
