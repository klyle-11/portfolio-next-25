import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Served through server.mjs (which also hosts the /api routes), not Vite's own server.
// envPrefix is set to something unused so nothing from .env can leak into the UI bundle.
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  envPrefix: 'BLOG_ADMIN_PUBLIC_',
  build: { target: 'es2022', chunkSizeWarningLimit: 1500 }
});
