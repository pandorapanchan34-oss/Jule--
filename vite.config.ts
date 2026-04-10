import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'demo',                    // ← これ大事！ demoフォルダをルートにする
  build: {
    outDir: '../dist-demo',        // ← GitHub Pages用に出力先を明確に
    emptyOutDir: true,
  },
  server: {
    open: true,
  },
});
