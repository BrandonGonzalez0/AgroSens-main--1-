import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',  // Asegúrate de que esté configurado para generar en 'dist/'
    rollupOptions: {
      input: './index.html',  // Asegúrate de que esté apuntando al archivo correcto
    },
  },
});
