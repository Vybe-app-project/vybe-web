import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const escapeHtmlAttribute = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll("'", '&#39;');

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const basePath = process.env.VITE_BASE_PATH?.trim() || env.VITE_BASE_PATH?.trim() || '/admin/';
  if (
    !basePath.startsWith('/')
    || !basePath.endsWith('/')
    || basePath.includes('..')
    || basePath.includes('//')
  ) {
    throw new Error('VITE_BASE_PATH must be an absolute path that starts and ends with "/"');
  }

  const apiUrl = process.env.VITE_API_URL?.trim() || env.VITE_API_URL?.trim();
  let supportApiUrl = '';
  let supportApiOrigin = '';
  if (apiUrl) {
    const parsedApiUrl = new URL(apiUrl);
    const localDevelopmentApi = (
      command === 'serve'
      && parsedApiUrl.protocol === 'http:'
      && ['127.0.0.1', 'localhost', '[::1]'].includes(parsedApiUrl.hostname)
    );
    if (
      (parsedApiUrl.protocol !== 'https:' && !localDevelopmentApi)
      || parsedApiUrl.username
      || parsedApiUrl.password
      || parsedApiUrl.search
      || parsedApiUrl.hash
      || parsedApiUrl.pathname.replace(/\/+$/, '') !== '/api'
    ) {
      throw new Error('VITE_API_URL must be an HTTPS origin ending in /api');
    }
    supportApiUrl = escapeHtmlAttribute(parsedApiUrl.toString().replace(/\/+$/, ''));
    supportApiOrigin = escapeHtmlAttribute(parsedApiUrl.origin);
  }

  return {
    base: basePath,
    define: {
      'import.meta.env.VITE_BASE_PATH': JSON.stringify(basePath),
    },
    plugins: [
      {
        name: 'vybe-support-config',
        transformIndexHtml(html, context) {
          if (!context.path.endsWith('/support.html') || !supportApiUrl) return html;
          return html
            .replaceAll('__VYBE_API_BASE_URL__', supportApiUrl)
            .replaceAll('__VYBE_API_ORIGIN__', supportApiOrigin);
        },
      },
      react(),
      tailwindcss(),
    ],
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
          }
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
  };
});
