import React from 'react';
import ReactDOM from 'react-dom/client';  // Cambia esto
import App from './App';
import './index.css'; // Si estás usando CSS

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
