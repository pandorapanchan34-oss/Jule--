import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'demo',                    
  build: {
    outDir: '../dist-demo',        
    emptyOutDir: true,
  },
  server: {
    open: true,
  },
});
