import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Single-repo setup: Vite builds the client to dist/client.
// In dev, the client runs on :5173 and proxies /api to the Express server on :3000.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
