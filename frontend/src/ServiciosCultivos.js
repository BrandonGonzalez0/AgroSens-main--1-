// --- Base de datos de cultivos ---
const cultivos = [
  {
    nombre: "Lechuga",
    ph: "6.0 - 7.0",
    humedad: "60% - 80%",
    temperatura: "15°C - 22°C",
    imagen: "https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcSJt51MwdipDH4q_4cC0GnqP24XSh9nYj5t47dOr5kQIuErrBZ7FwoP9MyElrYq7zhoySrq1PMAIoeZSI-h0VoUgwWBhLS4haVlAjTbGw",
  },
  {
    nombre: "Tomate",
    ph: "6.0 - 6.8",
    humedad: "50% - 70%",
    temperatura: "20°C - 28°C",
    imagen: "https://upload.wikimedia.org/wikipedia/commons/8/89/Tomato_je.jpg",
  },
  {
    nombre: "Zanahoria",
    ph: "6.0 - 6.8",
    humedad: "55% - 75%",
    temperatura: "16°C - 22°C",
    imagen: "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcSBagBKwQru5GByTif73vFQr_EQxxV4D5gVbpPOADYrXXNhJ01ufBxKSuZm38jjo0a11AGJAkkTHEEK3J_-ddfUqjlQR48XE-IRHzMSx8gR",
  },
  {
    nombre: "Papa",
    ph: "5.0 - 6.5",
    humedad: "65% - 85%",
    temperatura: "15°C - 20°C",
    imagen: "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcQN6sLbBkrik3I65UM7ToSADYaHa1LCLyohHDZdlJQRS91PFAI6LfkEu08eUWknsEfxH_gL6okwBguf9U_41kCuI5EIEOMyOh87Um-vNutT",
  },
  {
    nombre: "Cebolla",
    ph: "6.0 - 7.0",
    humedad: "60% - 70%",
    temperatura: "12°C - 25°C",
    imagen: "https://upload.wikimedia.org/wikipedia/commons/2/25/Onion_on_White.JPG",
  },
  {
    nombre: "Ajo",
    ph: "6.0 - 7.5",
    humedad: "55% - 70%",
    temperatura: "12°C - 24°C",
    imagen: "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcQnK1Q2aKbpbkMmqVw-4vkODZAR4GNguj1KEm1sLa-oASfudDi7UdubpHDiNp8YRwk-09OV2UKrGBmAjRU7dVNnYIBLNV57kBQYTuoUN5fEoA",
  },
  {
    nombre: "Pepino",
    ph: "5.5 - 7.0",
    humedad: "65% - 85%",
    temperatura: "18°C - 25°C",
    imagen: "https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcScBE01YfFwUY9kC5sgw8OuQ8_VSv-2QWksj_Di6MvqzdoTuawV-1mC2j0ucoGufKPWEG_bry81iPxZZHF0wChJC73Fxgm52EaOSDww2CPRBg",
  },
  {
    nombre: "Maíz",
    ph: "5.8 - 7.0",
    humedad: "60% - 80%",
    temperatura: "18°C - 27°C",
    imagen: "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcQ-i5vY9awY9Ql0bKrXHmecMC2kfCVWPGDIZOJJIx1gHR5lFMBW0ISMp9DwAS9oevv3FkKfzd4cfo_DqjiQfD79X3mdfniidbacWUiXw9UX",
  },
  {
    nombre: "Trigo",
    ph: "6.0 - 7.5",
    humedad: "50% - 70%",
    temperatura: "15°C - 24°C",
    imagen: "https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcRgrjGUMPIm6k2pY44VMgcBwqRiRbbFjop3Tfz7AcTo2MjxklhWgtg46rx9R5zBEo73yrLE5gEHnuVhlYK0EwoWjNBSBJMRM1hLlOfO1dzn",
  },
  {
    nombre: "Fresa",
    ph: "5.5 - 6.5",
    humedad: "65% - 80%",
    temperatura: "15°C - 22°C",
    imagen: "https://upload.wikimedia.org/wikipedia/commons/2/29/PerfectStrawberry.jpg",
  },
  {
    nombre: "Manzana",
    ph: "6.0 - 7.0",
    humedad: "50% - 70%",
    temperatura: "13°C - 24°C",
    imagen: "https://upload.wikimedia.org/wikipedia/commons/1/15/Red_Apple.jpg",
  },
  {
    nombre: "Plátano",
    ph: "5.5 - 7.0",
    humedad: "70% - 90%",
    temperatura: "24°C - 30°C",
    imagen: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Banana-Single.jpg",
  },
  {
    nombre: "Naranja",
    ph: "6.0 - 7.5",
    humedad: "60% - 80%",
    temperatura: "20°C - 30°C",
    imagen: "https://upload.wikimedia.org/wikipedia/commons/c/c4/Orange-Fruit-Pieces.jpg",
  },
  {
    nombre: "Uva",
    ph: "6.0 - 7.5",
    humedad: "50% - 70%",
    temperatura: "15°C - 30°C",
    imagen: "https://upload.wikimedia.org/wikipedia/commons/0/05/Grapes_in_bowl.jpg",
  },
  {
    nombre: "Sandía",
    ph: "6.0 - 6.8",
    humedad: "60% - 80%",
    temperatura: "22°C - 28°C",
    imagen: "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcSb8CxRbyfHzB5wUQAyTtQeg1EwrHypxNnOE8tqt1Dwxpn-Pq9aa8tUtynXEHq41XBe80qi11v3Sau9wRgLX27-M7iAQiZvpSsNt6tylnrY",
  },
  {
    nombre: "Melón",
    ph: "6.0 - 6.8",
    humedad: "60% - 75%",
    temperatura: "20°C - 26°C",
    imagen: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTRDdAXoBRC6IxTb7z7o-3FnEnbs3n_KFpaGEA9XbWGR_HU12mza0n1RNnQnafOjWsCB-tX1by9OTHq3ca-dxB9CfndLPpkepKEWAecXrOk",
  },
  {
    nombre: "Pimiento",
    ph: "6.0 - 6.8",
    humedad: "60% - 80%",
    temperatura: "18°C - 25°C",
    imagen: "https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcRRoRZJT3Blq_u1G5fBfVXH7JBDEcN6FC-cYWc2q3rcOvm10-ybVnpbXju2_7tF2v8IkphmchOhYLCVVoUrjNDll0sMsfx8FvT7pBpGv2j6uQ",
  },
  {
    nombre: "Espinaca",
    ph: "6.0 - 7.0",
    humedad: "60% - 75%",
    temperatura: "10°C - 20°C",
    imagen: "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcTAA1DhEMFu7GTPUlXkj4JNl3vqznmNfvTIAXmOdRSh4QRUwNGKVs_2RRcDMC-NJXo_TzQ0hpfxNNAFodxDvkYgHp2MuO2rgz85gJvJ0d2T3Q",
  },
  {
    nombre: "Repollo",
    ph: "6.0 - 7.5",
    humedad: "60% - 80%",
    temperatura: "15°C - 20°C",
    imagen: "https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcSySOfo661UwKC7P9AubFfQYLs3ZsJNk1h55-2d8OK65H0U_e3IITPUP9VZYEFAMw22GSSFkFTsyoQyUiDj_NoRXEuZz6W0oHFumNopQnPQXg",
  },
  // ... 🔥 agrega más hasta completar 50+
];

// --- Validación simple ---
// Helper: parse ranges like "6.0 - 7.0", "60% - 80%", "15°C - 22°C"
function parseRange(rangeStr) {
  if (!rangeStr || typeof rangeStr !== 'string') return null;
  // Keep digits, dot, comma, minus and percent/degree symbols; then split on '-'
  const parts = rangeStr.split('-').map(p => p.replace(/[^0-9.,]/g, '').trim().replace(',', '.'));
  if (parts.length < 2) return null;
  const min = parseFloat(parts[0]);
  const max = parseFloat(parts[1]);
  if (isNaN(min) || isNaN(max)) return null;
  return [min, max];
}

function parseInputValue(v) {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v === 'string') {
    return parseFloat(v.replace(/[^0-9.,-]/g, '').trim().replace(',', '.'));
  }
  return Number(v);
}

export function validarCultivo(nombre, ph, humedad, temperatura) {
  if (!nombre) return { viable: false, mensaje: 'No se indicó el nombre del cultivo.' };
  const cultivo = cultivos.find(c => c.nombre.toLowerCase() === nombre.toLowerCase());
  if (!cultivo) {
    return { viable: false, mensaje: "Cultivo no encontrado en la base de datos." };
  }

  const phRange = parseRange(cultivo.ph);
  const humRange = parseRange(cultivo.humedad);
  const tempRange = parseRange(cultivo.temperatura);

  const phVal = parseInputValue(ph);
  const humVal = parseInputValue(humedad);
  const tempVal = parseInputValue(temperatura);

  const missing = [];
  if (phVal === null || isNaN(phVal)) missing.push('pH');
  if (humVal === null || isNaN(humVal)) missing.push('Humedad');
  if (tempVal === null || isNaN(tempVal)) missing.push('Temperatura');

  if (missing.length > 0) {
    return {
      viable: false,
      mensaje: `Faltan o no son válidos los siguientes valores: ${missing.join(', ')}.`,
      detalles: { ph: phVal, humedad: humVal, temperatura: tempVal }
    };
  }

  const phOk = phRange ? (phVal >= phRange[0] && phVal <= phRange[1]) : true;
  const humOk = humRange ? (humVal >= humRange[0] && humVal <= humRange[1]) : true;
  const tempOk = tempRange ? (tempVal >= tempRange[0] && tempVal <= tempRange[1]) : true;

  const viable = phOk && humOk && tempOk;

  const motivos = [];
  if (!phOk) motivos.push(`pH (${phVal}) fuera de rango [${phRange ? phRange.join('-') : 'n/a'}]`);
  if (!humOk) motivos.push(`Humedad (${humVal}) fuera de rango [${humRange ? humRange.join('-') : 'n/a'}]`);
  if (!tempOk) motivos.push(`Temperatura (${tempVal}) fuera de rango [${tempRange ? tempRange.join('-') : 'n/a'}]`);

  return {
    viable,
    mensaje: viable ? `${cultivo.nombre} es apto para tus condiciones.` : `${cultivo.nombre} no es apto: ${motivos.join('; ')}`,
    detalles: {
      ph: { valor: phVal, rango: phRange },
      humedad: { valor: humVal, rango: humRange },
      temperatura: { valor: tempVal, rango: tempRange }
    }
  };
}

// --- Sugerencias (filtrado simple) ---
export function sugerirCultivos(ph, humedad, temperatura) {
  const phNum = parseFloat(ph);
  const humNum = parseFloat(humedad);
  const tempNum = parseFloat(temperatura);

  return cultivos.filter(c => {
    // Rango pH
    const [phMin, phMax] = c.ph.split("-").map(v => parseFloat(v));
    // Solo ejemplo simple: tomar valores medios
    return (
      phNum >= (phMin || 0) &&
      phNum <= (phMax || 14) &&
      humNum >= 40 &&
      tempNum >= 10
    );
  });
}

// Exportar la lista completa de cultivos para uso en la UI
export { cultivos };
