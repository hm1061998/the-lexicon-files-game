import { expect, test, type Page } from '@playwright/test';
import { dialogueEvidenceScreens } from './dialogueEvidenceScreens';

const viewports = [
  { w: 1280, h: 720 },
  { w: 760, h: 600 },
  { w: 390, h: 844 },
  { w: 844, h: 390 },
] as const;

// Dark red (#743026): the investigation red that still reads as small text on paper.
const RED = 'rgb(116, 48, 38)';
const paperSelector = '.dialogue-panel, .evidence-modal';

/** Elements inside the open paper whose text is the investigation red. */
async function redClasses(page: Page): Promise<string[]> {
  return page
    .locator(paperSelector)
    .first()
    .evaluate((root, red) => {
      return [root, ...Array.from(root.querySelectorAll('*'))]
        .filter((el) => getComputedStyle(el).color === red)
        .map((el) => el.className.toString());
    }, RED);
}

test.describe('Dialogue and evidence paper UI', () => {
  test.setTimeout(120_000);

  for (const screen of dialogueEvidenceScreens) {
    for (const { w, h } of viewports) {
      test(`${screen.name} fits ${w}x${h} with comfortable targets`, async ({ page }) => {
        await page.setViewportSize({ width: w, height: h });
        await screen.reach(page);
        await page.waitForTimeout(400);

        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, 'horizontal overflow').toBeLessThanOrEqual(0);

        // The paper stays on screen (it scrolls inside itself when it is taller than the viewport).
        const paper = page.locator(paperSelector).first();
        const pb = (await paper.boundingBox())!;
        expect(pb.y, 'paper top').toBeGreaterThanOrEqual(-0.5);
        expect(pb.y + pb.height, 'paper bottom').toBeLessThanOrEqual(h + 0.5);
        expect(pb.x, 'paper left').toBeGreaterThanOrEqual(-0.5);
        expect(pb.x + pb.width, 'paper right').toBeLessThanOrEqual(w + 0.5);

        // No scrolling inside the paper (in-game overlays read like objects, not web pages).
        const scrolls = await page.evaluate((selector) => {
          const root = document.querySelector(selector) as HTMLElement | null;
          const nodes = root ? [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))] : [];
          return nodes
            .filter((el) => {
              const overflow = getComputedStyle(el).overflowY;
              return (
                (overflow === 'auto' || overflow === 'scroll') &&
                el.scrollHeight - el.clientHeight > 1
              );
            })
            .map((el) => `${el.className} ${el.scrollHeight}>${el.clientHeight}`);
        }, paperSelector);
        expect(scrolls, 'scrolling containers').toEqual([]);

        // An open definition card lies entirely on the paper.
        const card = page.locator('.dialogue-panel .vocabulary-popover');
        if (await card.isVisible()) {
          const cb = (await card.boundingBox())!;
          expect(cb.y, 'card top').toBeGreaterThanOrEqual(pb.y - 0.5);
          expect(cb.y + cb.height, 'card bottom').toBeLessThanOrEqual(pb.y + pb.height + 0.5);
          expect(cb.x + cb.width, 'card right').toBeLessThanOrEqual(pb.x + pb.width + 0.5);
        }

        const buttons = await page
          .locator(
            '.dialogue-panel button:not(.vocabulary-word), .evidence-modal button:not(.vocabulary-word)',
          )
          .all();
        expect(buttons.length).toBeGreaterThan(0);
        for (const button of buttons) {
          if (!(await button.isVisible())) continue;
          const box = (await button.boundingBox())!;
          expect(box.width, await button.innerText()).toBeGreaterThanOrEqual(43.5);
          expect(box.height, await button.innerText()).toBeGreaterThanOrEqual(43.5);
        }
      });
    }

    // AGENTS.md §6: red belongs to evidence; the dialogue and the listening slip stay ink.
    test(`${screen.name} red rule`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await screen.reach(page);
      const red = await redClasses(page);
      if (screen.name === 'evidence' || screen.name === 'listening') {
        expect(red).toEqual(['evidence-category']);
      } else {
        expect(red).toEqual([]);
      }
    });
  }

  test('an open definition card replaces the choices instead of covering them', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await dialogueEvidenceScreens.find((s) => s.name === 'vocab-in-dialogue')!.reach(page);
    await expect(page.locator('.dialogue-panel .vocabulary-popover')).toBeVisible();
    await expect(page.locator('.dialogue-choice').first()).toBeHidden();
    await page.getByRole('button', { name: 'Đóng', exact: true }).last().click();
    await expect(page.locator('.dialogue-choice').first()).toBeVisible();
  });

  // The OS preference path; the in-game setting uses the same selectors (see motion.css and its CSS tests).
  for (const [screen, selector] of [
    ['dialogue', '.dialogue-choice'],
    ['evidence', '.evidence-photo'],
  ] as const) {
    test(`reduced motion levels ${selector}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await dialogueEvidenceScreens.find((s) => s.name === screen)!.reach(page);
      const target = page.locator(selector).first();
      await expect(target).toBeVisible();
      expect(await target.evaluate((el) => getComputedStyle(el).rotate)).toBe('none');
    });
  }
});
