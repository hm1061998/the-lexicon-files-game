import { expect, test } from '@playwright/test';
import { seedOnboardingSeen } from './journeyHelpers';
import { shellScreens } from './shellScreens';

const viewports = [
  { w: 1280, h: 720 },
  { w: 760, h: 600 },
  { w: 390, h: 844 },
] as const;

test.describe('UI shell screens', () => {
  test.setTimeout(120_000);

  for (const screen of shellScreens) {
    for (const { w, h } of viewports) {
      test(`${screen.name} fits ${w}x${h} with comfortable targets`, async ({ page }) => {
        await page.setViewportSize({ width: w, height: h });
        if (screen.quietCoach) await seedOnboardingSeen(page);
        await screen.reach(page);
        await page.waitForTimeout(400);

        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, 'horizontal overflow').toBeLessThanOrEqual(0);

        // Shell controls only: the game HUD behind a modal is covered by its own specs.
        // Inline vocabulary words are text-sized by design; the case summary has no controls.
        const buttons = await page
          .locator('main button:not(.vocabulary-word), .modal-sheet button:not(.vocabulary-word)')
          .all();
        if (screen.name !== 'summary') expect(buttons.length).toBeGreaterThan(0);
        for (const button of buttons) {
          if (!(await button.isVisible())) continue;
          const box = (await button.boundingBox())!;
          expect(box.width, await button.innerText()).toBeGreaterThanOrEqual(43.5);
          expect(box.height, await button.innerText()).toBeGreaterThanOrEqual(43.5);
          expect(box.x).toBeGreaterThanOrEqual(-0.5);
          expect(box.x + box.width).toBeLessThanOrEqual(w + 0.5);
        }
      });
    }

    // The case-closed verdict is the only place the shell uses a red stamp (AGENTS.md §6).
    test(`${screen.name} red stamp rule`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      if (screen.quietCoach) await seedOnboardingSeen(page);
      await screen.reach(page);
      await expect(page.locator('.stamp--red')).toHaveCount(screen.name === 'summary' ? 1 : 0);
    });
  }
});
