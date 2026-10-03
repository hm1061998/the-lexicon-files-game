import { expect, test, type Page } from '@playwright/test';
import { dialogueEvidenceScreens } from './dialogueEvidenceScreens';
import { openWorld } from './journeyHelpers';
import { shellScreens, type Screen } from './shellScreens';

// Every visible button on the screens of parts 1-4b is one of the three kinds (ink, paper,
// device) or a control of a checked primitive. Inline vocabulary words are text-sized by design.
// The notebook, the board and the accusation panel belong to part 5 and are not covered here.
const ALLOWED = [
  '.ink-button',
  '.paper-button',
  '.device-key',
  '.folder-tabs button',
  '.key-hint-line button',
  '.vocabulary-word',
].join(', ');

const byName = (list: readonly Screen[], name: string): Screen =>
  list.find((screen) => screen.name === name)!;

const screens: readonly Screen[] = [
  ...shellScreens,
  { name: 'hud', reach: async (page) => openWorld(page) },
  {
    name: 'dialogue-log',
    reach: async (page: Page) => {
      await byName(dialogueEvidenceScreens, 'dialogue').reach(page);
      await page.keyboard.press('l');
      await page.locator('.dialogue-log').waitFor();
    },
  },
  ...dialogueEvidenceScreens,
];

test.describe('Button kinds', () => {
  test.setTimeout(120_000);

  for (const screen of screens) {
    test(`${screen.name}: every visible button is an ink, paper or device button`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await screen.reach(page);
      await page.waitForTimeout(300);
      const strays = await page.evaluate((allowed) => {
        return Array.from(document.querySelectorAll('button'))
          .filter((button) => {
            const box = button.getBoundingClientRect();
            const style = getComputedStyle(button);
            return (
              box.width > 0 &&
              box.height > 0 &&
              style.visibility !== 'hidden' &&
              !button.matches(allowed)
            );
          })
          .map(
            (button) =>
              `${button.className || '(no class)'} "${(button.textContent ?? '').trim().slice(0, 30)}"`,
          );
      }, ALLOWED);
      expect(strays, 'buttons outside the three kinds').toEqual([]);
    });
  }
});
