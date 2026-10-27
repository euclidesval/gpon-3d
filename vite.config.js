import { defineConfig } from 'vite';

export default defineConfig({
  // Caminhos relativos: funciona no GitHub Pages e num servidor estático simples, sem internet.
  base: './',
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1500,
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.js'],
  },
});
