import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',  // Carpeta de salida de la construcción
    rollupOptions: {
      input: 'src/main.jsx',  // Apunta a tu archivo principal de entrada
    },
  },
});
