import { defineConfig } from 'vite';

export default defineConfig({
  // relative asset URLs, so the built site works from a domain root or a sub-path (e.g. GitHub Pages)
  base: './',
  server: { port: 5173 },
  build: {
    target: 'es2020',
    // the lazily loaded 3D chunk is mostly three.js (~520 kB, ~130 kB gzipped); that size is expected
    chunkSizeWarningLimit: 600
  }
});
