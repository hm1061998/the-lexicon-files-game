import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Phaser advances with rendered frames; competing browser canvases make timed movement checks unstable.
  workers: 1,
  testDir: './e2e',
  use: { baseURL: 'http://127.0.0.1:5174' },
});
