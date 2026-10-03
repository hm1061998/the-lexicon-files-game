import { scenePoint } from './sceneTestData';
import { expect, test, type Page } from '@playwright/test';
import { openWorld, reopenWorld } from './journeyHelpers';

type DebugApi = {
  player(): { x: number; y: number; depth: number };
  teleport(x: number, y: number): void;
};

declare global {
  interface Window {
    __lexiconDebug?: DebugApi;
  }
}

function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

async function open(page: Page): Promise<void> {
  await openWorld(page);
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
}

async function readRecord(page: Page, database: string, store: string, key: string) {
  return page.evaluate(
    async ({ database, store, key }) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(database);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      try {
        if (!db.objectStoreNames.contains(store)) return undefined;
        return await new Promise<Record<string, unknown> | undefined>((resolve, reject) => {
          const request = db.transaction(store).objectStore(store).get(key);
          request.onsuccess = () => resolve(request.result as Record<string, unknown> | undefined);
          request.onerror = () => reject(request.error);
        });
      } finally {
        db.close();
      }
    },
    { database, store, key },
  );
}

// Seeds on a same-origin page that does not boot the app, so the app finds the data on first load.
async function seed(page: Page, database: string, key: string, value: unknown): Promise<void> {
  await page.goto('/@vite/env');
  await page.evaluate(
    async ({ database, key, value }) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(database, 1);
        request.onupgradeneeded = () => {
          request.result.createObjectStore('records');
          request.result.createObjectStore('backups', { autoIncrement: true });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('records', 'readwrite');
        tx.objectStore('records').put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    },
    { database, key, value },
  );
}

async function openPause(page: Page) {
  await page.keyboard.press('Escape');
  const pause = page.getByRole('dialog');
  await expect(pause).toBeVisible();
  return pause;
}

test('settings and progress survive reload', async ({ page }) => {
  test.setTimeout(90000);
  const errors = trackErrors(page);
  await open(page);

  const pause = await openPause(page);
  await pause.getByLabel('Chế độ dịch').selectOption('Immersion');
  await pause.getByLabel('Phụ đề bản ghi').selectOption('on');
  await pause.getByLabel('Giảm chuyển động').check();
  const slider = pause.getByRole('slider', { name: 'Âm lượng' });
  await slider.focus();
  const before = await page.evaluate(() => window.__lexiconDebug!.player());
  await page.keyboard.press('d');
  for (let i = 0; i < 8; i += 1) await page.keyboard.press('ArrowLeft');
  await expect(slider).toHaveValue('40');
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.__lexiconDebug!.player())).toEqual(before);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await openPause(page);
  await pause.getByRole('button', { name: 'Tiếp tục' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await expect
    .poll(() => readRecord(page, 'lexicon-settings', 'records', 'local-settings'))
    .toMatchObject({
      schemaVersion: 2,
      translationMode: 'Immersion',
      volume: 40,
      subtitles: 'on',
      reducedMotion: true,
      uiSounds: true,
    });

  const hotspot = scenePoint('main_office', 'phone_recording');
  await page.evaluate(({ x, y }) => window.__lexiconDebug!.teleport(x, y), hotspot);
  await expect(page.getByText('Nghe bản ghi điện thoại của Leo')).toBeVisible();
  await page.keyboard.press('e');
  await expect(page.getByRole('dialog')).toContainText("Leo's Phone Recording");
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await page.evaluate(
    ({ x, y }) => window.__lexiconDebug!.teleport(x, y),
    scenePoint('main_office', 'hallway_door'),
  );
  await expect(page.getByText('Đến phòng lưu trữ', { exact: true })).toBeVisible();
  await page.keyboard.press('e');
  await expect(page.getByText('Quay lại văn phòng', { exact: true })).toBeVisible();
  await expect
    .poll(
      async () =>
        (await readRecord(page, 'lexicon-game-saves', 'saves', 'case-001'))?.activeSceneId,
    )
    .toBe('archive');

  await reopenWorld(page);
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
  await expect(page.locator('canvas')).toHaveCount(1);
  const pauseAfter = await openPause(page);
  await expect(pauseAfter.getByLabel('Chế độ dịch')).toHaveValue('Immersion');
  await expect(pauseAfter.getByLabel('Phụ đề bản ghi')).toHaveValue('on');
  await expect(pauseAfter.getByLabel('Giảm chuyển động')).toBeChecked();
  await expect(pauseAfter.getByRole('slider', { name: 'Âm lượng' })).toHaveValue('40');
  expect(await readRecord(page, 'lexicon-settings', 'records', 'local-settings')).toMatchObject({
    translationMode: 'Immersion',
    volume: 40,
    subtitles: 'on',
    reducedMotion: true,
  });
  await pauseAfter.getByRole('button', { name: 'Tiếp tục' }).click();

  const saved = await readRecord(page, 'lexicon-game-saves', 'saves', 'case-001');
  expect(saved).toMatchObject({
    activeSceneId: 'archive',
    state: { evidenceIds: ['leo_phone_recording'] },
  });

  await page.keyboard.press('j');
  await page.locator('.notebook-index-card').first().click();
  await page.getByRole('button', { name: 'Xem lại' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText("Leo's Phone Recording");
  await expect(dialog).toContainText("I'm outside the meeting room");
  await expect(dialog).not.toContainText('Chào, tôi đang ở bên ngoài');
  expect(errors).toEqual([]);
});

test('legacy learning V1 translation mode is preserved', async ({ page }) => {
  const errors = trackErrors(page);
  await seed(page, 'lexicon-learning', 'local-profile', {
    schemaVersion: 1,
    translationMode: 'Immersion',
    profile: {
      cefrEstimate: 'A2',
      skills: { vocabulary: 0, grammar: 0, reading: 0, listening: 0, communication: 0 },
      vocabulary: {},
      grammar: {},
      assistance: { translations: 0, hints: 0, transcriptOpens: 0, audioReplays: 0 },
      listening: {
        subtitleUses: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        totalTimeToExtractFactMs: 0,
        timedFacts: 0,
      },
    },
    vocabularyTutorialSeen: false,
    updatedAt: 1,
  });
  await open(page);
  const pause = await openPause(page);
  await expect(pause.getByLabel('Chế độ dịch')).toHaveValue('Immersion');
  await expect
    .poll(
      async () =>
        (await readRecord(page, 'lexicon-learning', 'records', 'local-profile'))?.schemaVersion,
    )
    .toBe(2);
  const learning = await readRecord(page, 'lexicon-learning', 'records', 'local-profile');
  expect(learning).not.toHaveProperty('translationMode');
  await expect
    .poll(
      async () =>
        (await readRecord(page, 'lexicon-settings', 'records', 'local-settings'))?.translationMode,
    )
    .toBe('Immersion');
  expect(errors).toEqual([]);
});

test('corrupt settings recover to defaults', async ({ page }) => {
  const errors = trackErrors(page);
  await seed(page, 'lexicon-settings', 'local-settings', { schemaVersion: 1, volume: 999 });
  await open(page);
  await expect(page.getByText('Cài đặt bị lỗi nên đã khôi phục mặc định.')).toBeVisible();
  const pause = await openPause(page);
  await expect(pause.getByRole('slider', { name: 'Âm lượng' })).toHaveValue('80');
  await pause.getByRole('button', { name: 'Tiếp tục' }).click();
  await page.evaluate(
    ({ x, y }) => window.__lexiconDebug!.teleport(x, y),
    scenePoint('main_office', 'hallway_door'),
  );
  await expect(page.getByText('Đến phòng lưu trữ', { exact: true })).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(1);
  expect(errors).toEqual([]);
});
