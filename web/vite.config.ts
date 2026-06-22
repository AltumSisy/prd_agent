import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 支持局域网访问
const API_HOST = process.env.API_HOST || 'localhost';
const API_PORT = process.env.API_PORT || '3000';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // 监听所有网络接口（局域网访问）
    proxy: {
      '/api': {
        target: `http://${API_HOST}:${API_PORT}`,
        changeOrigin: true,
        // 不 rewrite，直接透传 /api/chat/:sessionId
      },
    },
  },
  build: {
    // Optimize bundle size
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunk for better caching
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
});