import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';  // Asegúrate de que este archivo esté siendo importado correctamente
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
