import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'demo', // ここを追加！index.htmlがあるディレクトリを指定します
  
  build: {
    outDir: '../dist', // 出力先をdemoの外（ルート）に戻すために ../ をつけます
    emptyOutDir: true,
    sourcemap: true,
    minify: 'terser',
  },
  // ...残りの設定
});
