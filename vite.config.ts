import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // ビルドの起点を demo フォルダに設定
  root: 'demo',
  plugins: [react()],
  base: '/jule-ai-energy/',
  build: {
    // demo/dist ではなく、プロジェクトルートの dist に出力させる
    outDir: '../dist',
    emptyOutDir: true,
    minify: 'terser',
  },
})
