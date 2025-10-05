import React from 'react';
import './Navbar.css';


function Navbar() {
  return (
    <nav className="navbar">
      <h2>AgroSens </h2> 

      <ul className="nav-links">
        <li><a href="#">Inicio</a></li>
        <li><a href="#">Medición</a></li>
        <li><a href="#">Recomendaciones</a></li>
        <li><a href="#">Historial</a></li>
      </ul>
    </nav>
  );
}

export default Navbar;
