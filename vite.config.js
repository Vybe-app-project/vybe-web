import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/admin/',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'build',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@chakra-ui') || id.includes('node_modules/@emotion')) {
            return 'ui';
          }
          if (id.includes('node_modules/framer-motion')) return 'motion';
          if (id.includes('node_modules/react')) return 'react';
          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    globals: true,
    restoreMocks: true,
    environmentOptions: {
      jsdom: {
        url: 'https://admin.example.invalid/admin/',
      },
    },
  },
});
