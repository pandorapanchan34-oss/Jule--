import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: 'demo',
build: {
  outDir: 'dist',  // dist-demo → dist に変更
  emptyOutDir: true,
},
  base: '/jule-ai-energy/',
});
