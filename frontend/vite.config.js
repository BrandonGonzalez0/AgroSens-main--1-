import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Dev server: proxy API calls to backend (running en http://localhost:5000)
  server: {
    proxy: {
      '/api': 'http://localhost:5000'
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'logo.png', 'logo.svg'],
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /\/api\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
            }
          }
        ]
      },
      manifest: {
        name: 'AgroSens',
        short_name: 'AgroSens',
        description: 'Herramientas de soporte para cultivos',
        theme_color: '#10B981',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'logo.svg', sizes: 'any', type: 'image/svg+xml' },
          { src: 'logo.png', sizes: '192x192', type: 'image/png' },
          { src: 'logo.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist',  // Carpeta de salida de la construcción
  },
});
