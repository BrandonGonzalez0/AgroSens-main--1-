import React from 'react';
import ReactDOM from 'react-dom/client';  // Cambia esto
import App from './App';
import './index.css'; // Si estás usando CSS

const rootElement = document.getElementById('root') || document.getElementById('app');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error('No se encontró el elemento root');
}
