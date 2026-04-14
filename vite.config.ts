import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // root: 'demo' は一旦コメントアウト or 削除（Vercelでは不要）
  // root: 'demo',

  build: {
    outDir: 'dist',           // Vercel用に固定
    emptyOutDir: true,
  },

  base: '/',                  // ← これが超重要！Vercelでは絶対これ
});
