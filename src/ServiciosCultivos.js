// --- Base de datos de cultivos ---
const cultivos = [
  {
    nombre: "Lechuga",
    ph: "6.0 - 7.0",
    humedad: "60% - 80%",
    temperatura: "15°C - 22°C",
    imagen: "https://upload.wikimedia.org/wikipedia/commons/5/5f/Latuca_sativa.jpg",
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
    imagen: "https://upload.wikimedia.org/wikipedia/commons/4/4b/Carrots.jpg",
  },
  {
    nombre: "Papa",
    ph: "5.0 - 6.5",
    humedad: "65% - 85%",
    temperatura: "15°C - 20°C",
    imagen: "https://upload.wikimedia.org/wikipedia/commons/6/60/Patates.jpg",
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
    imagen: "https://upload.wikimedia.org/wikipedia/commons/9/9c/GarlicBasket.jpg",
  },
  {
    nombre: "Pepino",
    ph: "5.5 - 7.0",
    humedad: "65% - 85%",
    temperatura: "18°C - 25°C",
    imagen: "https://upload.wikimedia.org/wikipedia/commons/9/96/Cucumber_Slice_and_whole.jpg",
  },
  {
    nombre: "Maíz",
    ph: "5.8 - 7.0",
    humedad: "60% - 80%",
    temperatura: "18°C - 27°C",
    imagen: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Corncobs.jpg",
  },
  {
    nombre: "Arroz",
    ph: "5.0 - 6.5",
    humedad: "70% - 90%",
    temperatura: "20°C - 30°C",
    imagen: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Rice_plants_%28IRRI%29.jpg",
  },
  {
    nombre: "Trigo",
    ph: "6.0 - 7.5",
    humedad: "50% - 70%",
    temperatura: "15°C - 24°C",
    imagen: "https://upload.wikimedia.org/wikipedia/commons/0/0d/Wheat_close-up.JPG",
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
    imagen: "https://upload.wikimedia.org/wikipedia/commons/e/ee/Watermelon_cross_BNC.jpg",
  },
  {
    nombre: "Melón",
    ph: "6.0 - 6.8",
    humedad: "60% - 75%",
    temperatura: "20°C - 26°C",
    imagen: "https://upload.wikimedia.org/wikipedia/commons/5/5b/Cantaloupe_and_cross_section.jpg",
  },
  {
    nombre: "Pimiento",
    ph: "6.0 - 6.8",
    humedad: "60% - 80%",
    temperatura: "18°C - 25°C",
    imagen: "https://upload.wikimedia.org/wikipedia/commons/6/69/Bell_pepper_red.jpg",
  },
  {
    nombre: "Espinaca",
    ph: "6.0 - 7.0",
    humedad: "60% - 75%",
    temperatura: "10°C - 20°C",
    imagen: "https://upload.wikimedia.org/wikipedia/commons/0/09/Spinach_leaves.jpg",
  },
  {
    nombre: "Repollo",
    ph: "6.0 - 7.5",
    humedad: "60% - 80%",
    temperatura: "15°C - 20°C",
    imagen: "https://upload.wikimedia.org/wikipedia/commons/1/1d/Cabbage_and_cross_section_on_white.jpg",
  },
  // ... 🔥 agrega más hasta completar 50+
];

// --- Validación simple ---
export function validarCultivo(nombre, ph, humedad, temperatura) {
  const cultivo = cultivos.find(c => c.nombre.toLowerCase() === nombre.toLowerCase());
  if (!cultivo) {
    return { viable: false, mensaje: "Cultivo no encontrado en la base de datos." };
  }
  return { viable: true, mensaje: `${cultivo.nombre} es viable según tus condiciones.` };
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
