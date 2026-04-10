export default defineConfig({
  root: "demo",
  base: "/jule-ai-energy/",
  plugins: [react()],
  build: {
    outDir: "../dist",
    emptyOutDir: true
  }
})
