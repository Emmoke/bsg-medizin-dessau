import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// BASIS: Unterpfad der Webseite. Für GitHub Pages "/<repo-name>/", für eine eigene Domain "/".
// Beim Bauen über die Umgebungsvariable BASIS setzbar (siehe .github/workflows/pages.yml).
export default defineConfig({
  base: process.env.BASIS ?? '/',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist', emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react';
          if (/node_modules\/lucide-react\//.test(id)) return 'icons';
          if (/node_modules\/@?firebase\//.test(id)) return 'firebase';
          if (/node_modules\/(gsap|lenis)\//.test(id)) return 'bewegung';
        },
      },
    },
  },
});
