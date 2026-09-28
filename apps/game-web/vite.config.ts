/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { validateRegisteredContent } from '../../packages/game-content/src/validation/validateRegisteredContent';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'validate-case-content',
      buildStart() {
        validateRegisteredContent();
      },
    },
  ],
  publicDir: 'public',
  server: { port: 5173 },
  test: { include: ['src/**/*.test.{ts,tsx}'] },
});
