// middleware/upload.js
const multer = require('multer');
const path = require('path');

// Configuración de Multer para almacenar imágenes en el servidor
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Directorio de imágenes
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Nombre único para la imagen
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
