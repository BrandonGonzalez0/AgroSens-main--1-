import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',  // Esto es donde Vite colocará los archivos de producción
  },
  base: '/',  // Asegúrate de que esté configurado correctamente para producción
});
