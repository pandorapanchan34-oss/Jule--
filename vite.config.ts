import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

const isGHPages = process.env.GITHUB_PAGES === 'true';

export default defineConfig({
  plugins: [react()],

  root: 'demo',                    // ← ここを復活

  build: {
    outDir: isGHPages ? '../dist-demo' : '../dist',  // ルートから見て ../dist
    emptyOutDir: true,
  },

  base: isGHPages 
    ? '/jule-ai-energy/' 
    : '/', 
});
