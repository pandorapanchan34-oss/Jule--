import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const isGHPages = process.env.GITHUB_PAGES === 'true';

export default defineConfig({
  plugins: [react()],

  // root: 'demo' は Vercel では削除（Vercelはルートからビルド）
  // root: 'demo',

  build: {
    outDir: isGHPages ? '../dist-demo' : 'dist',   // Vercelは 'dist'（ルート直下）
    emptyOutDir: true,
  },

  base: isGHPages 
    ? '/jule-ai-energy/'     // GitHub Pages用（リポジトリ名に合わせる）
    : '/',                   // Vercel用（ai-energy.vercel.app のルート）
});
