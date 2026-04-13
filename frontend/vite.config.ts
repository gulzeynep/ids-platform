import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-is': 'react-is',
    },
  },
  build: {
    chunkSizeWarningLimit: 1000, 
  }
});