import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const rawBase = env.BASE_PATH || '/';
    const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
    return {
      base,
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              dnd_vendor: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
            },
          },
        },
      },
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
