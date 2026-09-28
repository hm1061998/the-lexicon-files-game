import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Phaser advances with rendered frames; competing browser canvases make timed movement checks unstable.
  workers: 1,
  testDir: './e2e',
  use: { baseURL: 'http://localhost:5173' },
  webServer: { command: 'npm run dev', port: 5173, reuseExistingServer: true },
});
