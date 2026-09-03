import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

// Dev proxy target = the ASP.NET Core API. Overridable via env for docker/local runs.
const API_TARGET = process.env.VITE_DEV_API_TARGET || 'http://localhost:5036'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Loom',
        short_name: 'Loom',
        description: 'Loom — real-time messenger',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Never cache API or SignalR traffic.
        navigateFallbackDenylist: [/^\/api/, /^\/hubs/],
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: {
    port: 5173,
    proxy: {
      // Same-origin in dev => no CORS needed against a backend that has none configured.
      '/api': { target: API_TARGET, changeOrigin: true, secure: false },
      '/hubs': { target: API_TARGET, changeOrigin: true, secure: false, ws: true },
    },
  },
})
