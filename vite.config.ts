import { defineConfig } from 'vite';
import { resolve } from 'path';

/**
 * jule-ai-energy: Vite Configuration
 * * 構造上の最適化:
 * - rootを 'demo' に設定し、index.htmlを捕捉
 * - outDirを '../dist' に設定し、ルート階層に出力
 */
export default defineConfig({
  // 1. エントリポイント(index.html)が存在するディレクトリを指定
  root: 'demo',

  // 2. 静的アセット(public)がルートにある場合はここも調整が必要ですが、
  // デフォルトで root/public を参照します。
  
  build: {
    // 3. rootを 'demo' にしているため、出力先を一つ上の階層の dist に指定
    outDir: '../dist',
    // 以前のビルド成果物を削除
    emptyOutDir: true,
    sourcemap: true,
    minify: 'terser',
  },

  resolve: {
    alias: {
      // プロジェクト全体のソースコードへのアクセスを確保
      '@': resolve(__dirname, './src'),
    },
  },

  server: {
    port: 3000,
    strictPort: true,
    host: true, // 外部ホストからのアクセスを許可
  }
});
