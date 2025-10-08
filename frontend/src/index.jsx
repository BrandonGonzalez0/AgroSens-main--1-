import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Si tienes un archivo CSS, asegúrate de que esté importado
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('app'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
