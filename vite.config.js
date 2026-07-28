import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const basePath = process.env.VITE_BASE_PATH?.trim() || '/admin/';
if (
  !basePath.startsWith('/')
  || !basePath.endsWith('/')
  || basePath.includes('..')
  || basePath.includes('//')
) {
  throw new Error('VITE_BASE_PATH must be an absolute path that starts and ends with "/"');
}

export default defineConfig({
  base: basePath,
  define: {
    'import.meta.env.VITE_BASE_PATH': JSON.stringify(basePath),
  },
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
        url: `https://admin.example.invalid${basePath}`,
      },
    },
  },
});
