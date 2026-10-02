import { readFileSync } from 'node:fs';
import { mkdirSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import type { UiStrings } from '@lexicon/shared-types';
import { scenePoint } from './sceneTestData';
import { interactAt, openWorld, pressInteract, saved } from './journeyHelpers';

const strings = JSON.parse(
  readFileSync(new URL('../../../packages/game-content/ui/vi.json', import.meta.url), 'utf8'),
) as UiStrings;
const SHOTS = '../../docs/ai/playtests/2026-10-02-intro-onboarding';

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

async function readStore(page: Page, database: string, store: string, key?: string) {
  return page.evaluate(
    async ({ database, store, key }) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(database);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      try {
        if (!db.objectStoreNames.contains(store)) return undefined;
        return await new Promise<unknown>((resolve, reject) => {
          const objectStore = db.transaction(store).objectStore(store);
          const request = key === undefined ? objectStore.getAll() : objectStore.get(key);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      } finally {
        db.close();
      }
    },
    { database, store, key },
  );
}

type LearningRecord = {
  schemaVersion: number;
  vocabularyTutorialSeen: boolean;
  profile: { vocabulary: Record<string, unknown> };
  onboardingSeen: Record<string, boolean>;
};
const learning = (page: Page) =>
  readStore(page, 'lexicon-learning', 'records', 'local-profile') as Promise<
    LearningRecord | undefined
  >;

const coachNote = (page: Page, text: string) =>
  page.locator('.coach-note').filter({ hasText: text.slice(0, 24) });

async function seedLearning(page: Page, value: unknown): Promise<void> {
  await page.goto('/@vite/env');
  await page.evaluate(async (value) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('lexicon-learning', 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('records');
        request.result.createObjectStore('backups', { autoIncrement: true });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('records', 'readwrite');
      tx.objectStore('records').put(value, 'local-profile');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, value);
}

test.describe('intro onboarding', () => {
  test.setTimeout(90_000);

  test('a new player is guided from title to the first notes, and reload does not repeat them', async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.setViewportSize({ width: 760, height: 600 });
    await page.route('**/favicon.ico', (route) => route.fulfill({ status: 204 }));
    await page.goto('/');
    await expect(page.getByRole('heading', { name: strings.titleGame })).toBeVisible();
    await expect(page.getByRole('button', { name: strings.titleContinue })).toHaveCount(0);
    await expect(page.locator('canvas')).toHaveCount(0);

    await page.getByRole('button', { name: strings.titleNewCase, exact: true }).click();
    await expect(page.getByRole('dialog', { name: strings.supportTitle })).toBeVisible();
    await page.getByRole('button', { name: strings.supportUseDefault }).click();

    const memo = page.getByRole('dialog', { name: strings.briefingTitle });
    await expect(memo).toBeVisible();
    await expect(memo.locator('.briefing-line')).toHaveCount(4);
    await page.waitForFunction(() => window.__lexiconDebug !== undefined);
    await page.keyboard.press('Escape');
    await expect(memo).toHaveCount(0);
    // Esc closed the memo; it must not have opened the pause menu as well.
    await expect(page.getByText(strings.paused)).toHaveCount(0);
    await expect(page.locator('.hud-objective-panel')).toBeVisible();

    await expect(coachNote(page, strings.coachMove)).toBeVisible();
    await page.keyboard.down('d');
    await page.waitForTimeout(1200);
    await page.keyboard.up('d');
    await expect(coachNote(page, strings.coachMove)).toHaveCount(0);

    const minutes = scenePoint('main_office', 'meeting_minutes');
    await page.evaluate(({ x, y }) => window.__lexiconDebug!.teleport(x, y), minutes);
    await expect(coachNote(page, strings.coachInteract)).toBeVisible();
    await pressInteract(page);
    await expect(page.getByRole('dialog')).toContainText('Meeting Minutes');
    await expect
      .poll(async () => (await saved(page))?.state.evidenceIds)
      .toContain('meeting_minutes');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await expect(coachNote(page, strings.coachNotebook)).toBeVisible();
    await page.keyboard.press('j');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(coachNote(page, strings.coachNotebook)).toHaveCount(0);

    // The notebook renders many vocabulary encounters, each autosaved in turn: allow the queue to drain.
    await expect
      .poll(async () => (await learning(page))?.onboardingSeen, { timeout: 20_000 })
      .toMatchObject({ move: true, interact: true, notebook: true });

    await page.reload();
    await page.getByRole('button', { name: strings.titleContinue }).click();
    await page.waitForFunction(() => window.__lexiconDebug !== undefined);
    await page.waitForTimeout(1200);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    // Finished notes never return; the board note is not finished yet, so it may be showing.
    for (const text of [strings.coachMove, strings.coachInteract, strings.coachNotebook])
      await expect(coachNote(page, text)).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('starting over backs up the save, keeps vocabulary and shows the briefing again', async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await openWorld(page);
    const minutes = scenePoint('main_office', 'meeting_minutes');
    await interactAt(page, minutes.x, minutes.y, 'Đọc biên bản cuộc họp');
    await expect
      .poll(async () => (await saved(page))?.state.evidenceIds)
      .toContain('meeting_minutes');
    await expect
      .poll(async () => Object.keys((await learning(page))?.profile.vocabulary ?? {}).length)
      .toBeGreaterThan(0);
    const vocabularyBefore = Object.keys((await learning(page))!.profile.vocabulary).sort();
    const backupsBefore = (
      ((await readStore(page, 'lexicon-game-saves', 'backups')) as unknown[] | undefined) ?? []
    ).length;

    await page.reload();
    await page.getByRole('button', { name: strings.titleNewCase, exact: true }).click();
    await expect(
      page.getByRole('alertdialog', { name: strings.newCaseConfirmTitle }),
    ).toBeVisible();
    await page.getByRole('button', { name: strings.cancel }).click();
    await expect(page.getByRole('button', { name: strings.titleContinue })).toBeVisible();
    await page.getByRole('button', { name: strings.titleNewCase, exact: true }).click();
    await page.getByRole('button', { name: strings.newCaseConfirmAccept, exact: true }).click();
    await expect(page.getByRole('dialog', { name: strings.briefingTitle })).toBeVisible();
    await page.getByRole('button', { name: strings.briefingAccept }).click();

    await expect.poll(async () => (await saved(page))?.state.evidenceIds).toEqual([]);
    const backups = ((await readStore(page, 'lexicon-game-saves', 'backups')) as unknown[]) ?? [];
    expect(backups).toHaveLength(backupsBefore + 1);
    const vocabularyAfter = Object.keys((await learning(page))!.profile.vocabulary);
    // Progress is kept; the briefing may add words of its own.
    for (const id of vocabularyBefore) expect(vocabularyAfter).toContain(id);
    expect(errors).toEqual([]);
  });

  test('a returning player with a V2 learning record sees no hints and is upgraded to V3', async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.route('**/favicon.ico', (route) => route.fulfill({ status: 204 }));
    await seedLearning(page, {
      schemaVersion: 2,
      profile: {
        cefrEstimate: 'A1',
        vocabulary: {},
        grammar: {},
        skills: { vocabulary: 0, grammar: 0, reading: 0, listening: 0, communication: 0 },
        assistance: { translations: 0, hints: 0, transcriptOpens: 0, audioReplays: 0 },
        listening: {
          subtitleUses: 0,
          correctAnswers: 0,
          incorrectAnswers: 0,
          totalTimeToExtractFactMs: 0,
          timedFacts: 0,
        },
      },
      vocabularyTutorialSeen: true,
      updatedAt: Date.now(),
    });
    await openWorld(page, { coach: 'fresh' });
    await page.waitForTimeout(1500);
    await expect(page.locator('.coach-note')).toHaveCount(0);
    await expect.poll(async () => (await learning(page))?.schemaVersion).toBe(3);
    expect((await learning(page))!.onboardingSeen).toEqual({
      move: true,
      interact: true,
      notebook: true,
      board: true,
    });
    const backups = ((await readStore(page, 'lexicon-learning', 'backups')) as unknown[]) ?? [];
    expect(backups.length).toBeGreaterThanOrEqual(1);
    expect(errors).toEqual([]);
  });

  for (const viewport of [
    { name: '1280x720', width: 1280, height: 720 },
    { name: '760x600', width: 760, height: 600 },
    { name: '390x844', width: 390, height: 844 },
  ]) {
    test(`title, briefing and coach note fit without scrolling at ${viewport.name}`, async ({
      browser,
    }, testInfo) => {
      mkdirSync(SHOTS, { recursive: true });
      const context = await browser.newContext({
        baseURL: testInfo.project.use.baseURL,
        viewport: { width: viewport.width, height: viewport.height },
      });
      const page = await context.newPage();
      const errors = collectErrors(page);
      await page.route('**/favicon.ico', (route) => route.fulfill({ status: 204 }));
      const inside = async (selector: string) => {
        const box = await page.locator(selector).first().boundingBox();
        expect(box, selector).not.toBeNull();
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.y).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 0.5);
        expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 0.5);
      };
      const noScroll = (selector: string) =>
        page
          .locator(selector)
          .first()
          .evaluate((el) => el.scrollHeight <= el.clientHeight + 1);
      const buttonsBigEnough = async (selector: string) => {
        for (const button of await page.locator(selector).all()) {
          const box = await button.boundingBox();
          expect(box!.width).toBeGreaterThanOrEqual(43.5);
          expect(box!.height).toBeGreaterThanOrEqual(43.5);
        }
      };

      await page.goto('/');
      await expect(page.getByRole('heading', { name: strings.titleGame })).toBeVisible();
      await inside('.title-card');
      expect(await noScroll('.title-card')).toBe(true);
      await buttonsBigEnough('.title-card button');
      await page.screenshot({ path: `${SHOTS}/title-${viewport.name}.png` });

      await page.getByRole('button', { name: strings.titleNewCase, exact: true }).click();
      await page.getByRole('button', { name: strings.supportUseDefault }).click();
      await expect(page.getByRole('dialog', { name: strings.briefingTitle })).toBeVisible();
      await inside('.briefing-memo');
      expect(await noScroll('.briefing-memo')).toBe(true);
      await buttonsBigEnough('.briefing-accept');
      await page.screenshot({ path: `${SHOTS}/briefing-${viewport.name}.png` });

      await page.getByRole('button', { name: strings.briefingAccept }).click();
      await expect(coachNote(page, strings.coachMove)).toBeVisible();
      await inside('.coach-note');
      await buttonsBigEnough('.coach-note button');
      await page.screenshot({ path: `${SHOTS}/coach-${viewport.name}.png` });
      const scrolls = await page.evaluate(
        () => document.documentElement.scrollHeight <= window.innerHeight + 1,
      );
      expect(scrolls).toBe(true);
      expect(errors).toEqual([]);
      await context.close();
    });
  }

  test('the briefing stays readable in the deduction board case file', async ({ page }) => {
    const errors = collectErrors(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    await openWorld(page, { mode: 'new' });
    await page.keyboard.press('b');
    await expect(page.locator('.deduction-case').first()).toContainText(
      'Welcome to the International Investigation Bureau',
    );
    expect(errors).toEqual([]);
  });

  test('the how-to page opens from pause and Esc closes only the page', async ({ page }) => {
    const errors = collectErrors(page);
    await openWorld(page);
    await page.keyboard.press('Escape');
    await expect(page.getByText(strings.paused)).toBeVisible();
    await page.getByRole('button', { name: strings.pauseHowTo }).click();
    const howTo = page.getByRole('dialog', { name: strings.howToTitle });
    await expect(howTo).toBeVisible();
    await expect(howTo).toContainText(strings.howToControlsHeading);
    await page.keyboard.press('Escape');
    await expect(howTo).toHaveCount(0);
    await expect(page.getByText(strings.paused)).toBeVisible();
    await page.getByRole('button', { name: strings.resume }).click();
    await expect(page.getByText(strings.paused)).toHaveCount(0);
    expect(errors).toEqual([]);
  });
});
