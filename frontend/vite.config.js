import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Esto es para asegurarse de que el servidor de desarrollo use el puerto correcto
  },
  build: {
    outDir: 'dist', // Esto asegura que la salida de la construcción se guarde en la carpeta dist
  },
  base: '/',  // Asegúrate de que la base esté configurada correctamente para el entorno de producción
});
