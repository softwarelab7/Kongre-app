import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { securityHeadersPlugin } from './vite-security-headers.ts';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [
      react(),
      tailwindcss(),
      securityHeadersPlugin(env),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'script',
        useCredentials: true,
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
            {
              src: 'data:image/png;base64,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',
              sizes: '180x180',
              type: 'image/png',
              purpose: 'any',
            },
            { src: '/icon-192.png?v=2.10.2', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icon-512.png?v=2.10.2', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icon-maskable-512.png?v=2.10.2', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
            { src: '/apple-touch-icon.png?v=2.10.2', sizes: '180x180', type: 'image/png', purpose: 'any' },
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
            {
              name: 'Hojas S-89',
              short_name: 'S-89',
              description: 'Asignaciones estudiantiles S-89 (Offline)',
              url: '/#/s89',
              icons: [
                { src: '/shortcuts/programacion-96.png', sizes: '96x96', type: 'image/png' },
                { src: '/shortcuts/programacion-192.png', sizes: '192x192', type: 'image/png' },
              ],
            },
          ],
        },
        workbox: {
          importScripts: ['/push-sw.js'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [
            /^\/api\//,
            /^\/__offline__\//,
            /^\/registerSW\.js$/,
            /^\/sw\.js$/,
            /^\/push-sw\.js$/,
            /^\/workbox-.*\.js$/,
            /\.js$/,
          ],
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024, // 6MB para plantillas PDF S-89 y bundles
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,pdf,json,webmanifest}'],
          runtimeCaching: [
            // Estrategia dedicada para Formularios y Datos S-89 respaldados por IndexedDB
            {
              urlPattern: /\/__offline__\/s89\/.*|.*(s89|s-89|s_89).*\.(json|pdf)$/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 's89-forms-indexeddb-cache',
                expiration: {
                  maxEntries: 250,
                  maxAgeSeconds: 60 * 60 * 24 * 180, // 180 días
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            // Caché persistente para Plantillas PDF Oficiales (S-89, S-21, S-140, S-88, S-13)
            {
              urlPattern: /.*\.pdf$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'official-pdf-templates-cache',
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 año
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
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
