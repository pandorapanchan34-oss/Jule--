import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 明示的に VERCEL 環境変数を見ることで、パスの衝突を避けます
const isVercel = process.env.VERCEL === 'true';

export default defineConfig({
  plugins: [react()],
  // demo/index.html をエントリーポイントに指定
  root: 'demo',
  build: {
    // 成果物をルート直下の dist フォルダに集約
    outDir: '../dist',
    emptyOutDir: true,
  },
  // Vercelならルートパス、GitHub Pagesなら相対パス（./）で解決
  base: isVercel ? '/' : './',
});
