import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api/opencode': {
        target: 'https://opencode.ai/zen/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/opencode/, ''),
        secure: false,
      }
    }
  }
});
