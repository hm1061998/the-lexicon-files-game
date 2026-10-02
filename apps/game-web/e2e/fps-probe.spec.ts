import { chromium, expect, test } from '@playwright/test';
import { openWorld } from './journeyHelpers';

// Opt-in frame-rate probe on software GL: FPS_PROBE=1 npm run test:e2e -w @lexicon/game-web -- e2e/fps-probe.spec.ts
test.describe('FPS probe (opt-in)', () => {
  test.skip(!process.env.FPS_PROBE, 'set FPS_PROBE=1 to measure');
  test.setTimeout(120_000);

  test('idle main_office frame rate', async ({}, testInfo) => {
    const browser = await chromium.launch({ args: ['--use-gl=swiftshader'] });
    const runs: number[] = [];
    try {
      for (let i = 0; i < 3; i += 1) {
        const context = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
        const page = await context.newPage();
        await openWorld(page);
        await page.waitForTimeout(1000);
        const frames = await page.evaluate(
          () =>
            new Promise<number>((resolve) => {
              let count = 0;
              const end = performance.now() + 5000;
              const tick = (): void => {
                count += 1;
                if (performance.now() < end) requestAnimationFrame(tick);
                else resolve(count);
              };
              requestAnimationFrame(tick);
            }),
        );
        runs.push(Math.round((frames / 5) * 10) / 10);
        await context.close();
      }
    } finally {
      await browser.close();
    }
    const fps = Math.round((runs.reduce((a, b) => a + b, 0) / runs.length) * 10) / 10;
    console.log(`FPS_RESULT ${JSON.stringify({ fps, runs })}`);
    expect(fps).toBeGreaterThan(0);
  });
});
