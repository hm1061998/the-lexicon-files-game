import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { test } from '@playwright/test';
import { investigationScreens } from './investigationScreens';

// Opt-in: records the visible "Trang n/N" of every notebook tab and board face, to compare page counts
// before and after a restyle. UI_INVESTIGATION_PAGES_FILE=<file> npm run test:e2e -w @lexicon/game-web -- e2e/ui-investigation-pagecount.spec.ts
// The file is resolved from apps/game-web (the Playwright cwd); each run starts it afresh.
const file = process.env.UI_INVESTIGATION_PAGES_FILE;
const viewports = [
  { w: 1280, h: 720 },
  { w: 760, h: 600 },
  { w: 390, h: 844 },
  { w: 844, h: 390 },
] as const;

test.describe.configure({ mode: 'serial' });
test.describe('investigation page counts (opt-in)', () => {
  test.skip(!file, 'set UI_INVESTIGATION_PAGES_FILE to record page counts');
  test.setTimeout(120_000);
  test.beforeAll(() => {
    mkdirSync(dirname(file!), { recursive: true });
    writeFileSync(file!, '');
  });

  for (const screen of investigationScreens) {
    for (const { w, h } of viewports) {
      test(`${screen.name} ${w}x${h}`, async ({ page }) => {
        await page.setViewportSize({ width: w, height: h });
        await screen.reach(page);
        await page.waitForTimeout(600);
        const labels = await page
          .locator('.page-controls')
          .evaluateAll((nodes) =>
            nodes
              .filter((n) => n.getClientRects().length && !n.closest('.page-measurement'))
              .map((n) => n.textContent?.match(/\d+\/\d+/)?.[0] ?? '?'),
          );
        appendFileSync(file!, `${screen.name}\t${w}x${h}\t${labels.join(' | ')}\n`);
      });
    }
  }
});
