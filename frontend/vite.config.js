import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js'
  },
  server: {
    port: 5174,
    open: true,
    proxy: {
      // Proxy API requests to the backend
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        // Don't rewrite the path, keep /api as is
        configure: (proxy, _options) => {
          // Log proxy events
          proxy.on('error', (err, _req, _res) => {
            console.error('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying request to:', req.method, req.path);
            // Ensure proper headers are set
            proxyReq.setHeader('origin', 'http://localhost:5174');
            proxyReq.setHeader('referer', 'http://localhost:5174');
            // Log the actual URL being requested
            console.log('Actual request URL:', proxyReq.path);
          });
        }
      }
    },
    cors: {
      origin: 'http://localhost:5174',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      allowedHeaders: 'Content-Type,Authorization',
      credentials: true
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
  },
});
