import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.ico',
          'favicon.svg',
          'safari-pinned-tab.svg',
          'notification-badge-72.png',
          'notification-badge-96.png',
          'apple-touch-icon.png',
          'apple-touch-icon-180x180.png',
          'apple-touch-icon-152x152.png',
          'apple-touch-icon-167x167.png',
          'apple-touch-icon-120x120.png',
          'apple-touch-icon-precomposed.png',
          'favicon-16.png',
          'favicon-32.png',
          'favicon-48.png',
          'push-sw.js',
        ],
        manifest: {
          id: '/',
          name: 'Kongre - Gestor Teocrático',
          short_name: 'Kongre',
          description: 'Gestión de asignaciones de congregación, reuniones, asistencia S-88 y territorios con soporte offline.',
          theme_color: '#4C3AED',
          background_color: '#FFFFFF',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '/',
          scope: '/',
          icons: [
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
            { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
          ],
          shortcuts: [
            {
              name: 'Programación',
              short_name: 'Programación',
              description: 'Reuniones y programa semanal',
              url: '/#/programacion',
              icons: [
                { src: '/shortcuts/programacion-96.png', sizes: '96x96', type: 'image/png' },
                { src: '/shortcuts/programacion-192.png', sizes: '192x192', type: 'image/png' },
              ],
            },
            {
              name: 'Territorios',
              short_name: 'Territorios',
              description: 'Mapas y territorios',
              url: '/#/territorios',
              icons: [
                { src: '/shortcuts/territorios-96.png', sizes: '96x96', type: 'image/png' },
                { src: '/shortcuts/territorios-192.png', sizes: '192x192', type: 'image/png' },
              ],
            },
            {
              name: 'Asistencia',
              short_name: 'Asistencia',
              description: 'Registro S-88',
              url: '/#/asistencia',
              icons: [
                { src: '/shortcuts/asistencia-96.png', sizes: '96x96', type: 'image/png' },
                { src: '/shortcuts/asistencia-192.png', sizes: '192x192', type: 'image/png' },
              ],
            },
            {
              name: 'Anuncios',
              short_name: 'Anuncios',
              description: 'Tablero de anuncios',
              url: '/#/tablero_anuncios',
              icons: [
                { src: '/shortcuts/tablero_anuncios-96.png', sizes: '96x96', type: 'image/png' },
                { src: '/shortcuts/tablero_anuncios-192.png', sizes: '192x192', type: 'image/png' },
              ],
            },
          ],
        },
        workbox: {
          importScripts: ['/push-sw.js'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            // FASE 6: Caching Offline para Mosaicos de Mapas (OpenStreetMap / CartoDB / Esri)
            {
              urlPattern: /^https:\/\/[a-d]\.basemaps\.cartocdn\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'cartodb-tiles-cache',
                expiration: {
                  maxEntries: 600,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/[a-c]\.tile\.openstreetmap\.org\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'osm-tiles-cache',
                expiration: {
                  maxEntries: 600,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/server\.arcgisonline\.com\/ArcGIS\/rest\/services\/World_Imagery\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'esri-satellite-tiles-cache',
                expiration: {
                  maxEntries: 300,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || '.', '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
                return 'vendor-react';
              }
              if (id.includes('@supabase')) {
                return 'vendor-supabase';
              }
              if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('purify')) {
                return 'vendor-pdf';
              }
              if (id.includes('leaflet')) {
                return 'vendor-maps';
              }
              if (id.includes('react-big-calendar') || id.includes('date-fns')) {
                return 'vendor-calendar';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-lucide';
              }
              return 'vendor-utils';
            }
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
