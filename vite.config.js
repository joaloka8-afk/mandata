import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: process.env.MANDATA_API || 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
