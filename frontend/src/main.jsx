import React from "react";
import ReactDOM from "react-dom";
import App from "./App"; // Asegúrate de que App.jsx esté correctamente importado
import "./index.css"; // Si tienes un archivo CSS global

const rootElement = document.getElementById("app"); // El contenedor en index.html
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
