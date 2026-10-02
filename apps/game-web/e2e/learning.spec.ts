import { scenePoint } from './sceneTestData';
import { expect, test, type Page } from '@playwright/test';

async function open(page: Page) {
  await page.goto('/');
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
}

async function profile(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('lexicon-learning', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise<
        | {
            vocabularyTutorialSeen: boolean;
            profile: { vocabulary: Record<string, { stage: string; encounterCount: number }> };
          }
        | undefined
      >((resolve, reject) => {
        const request = db.transaction('records').objectStore('records').get('local-profile');
        request.onsuccess = () => resolve(request.result as typeof request.result);
        request.onerror = () => reject(request.error);
      });
    } finally {
      db.close();
    }
  });
}

async function settings(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('lexicon-settings', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise<{ translationMode: string } | undefined>((resolve, reject) => {
        const request = db.transaction('records').objectStore('records').get('local-settings');
        request.onsuccess = () => resolve(request.result as typeof request.result);
        request.onerror = () => reject(request.error);
      });
    } finally {
      db.close();
    }
  });
}

async function caseEvidenceIds(page: Page): Promise<string[]> {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('lexicon-game-saves', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise<string[]>((resolve, reject) => {
        const request = db.transaction('saves').objectStore('saves').get('case-001');
        request.onsuccess = () => {
          const record = request.result as { state?: { evidenceIds?: string[] } } | undefined;
          resolve(record?.state?.evidenceIds ?? []);
        };
        request.onerror = () => reject(request.error);
      });
    } finally {
      db.close();
    }
  });
}

test('visible dialogue records only annotated contexts and persists mode/progress', async ({
  page,
}) => {
  await open(page);
  const anna = scenePoint('main_office', 'anna', { u: 0.3, v: 0.6 });
  await page.evaluate(({ x, y }) => window.__lexiconDebug!.teleport(x, y), anna);
  await expect(page.getByText('Nói chuyện với Anna', { exact: true })).toBeVisible();
  await page.locator('canvas').click({ position: { x: 400, y: 300 } });
  await page.keyboard.press('e');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: /left\. Xem nghĩa từ/ })).toBeVisible();
  await expect
    .poll(async () => (await profile(page))?.profile.vocabulary.leave?.encounterCount)
    .toBe(1);
  await expect
    .poll(async () => Object.keys((await profile(page))?.profile.vocabulary ?? {}).sort())
    .toEqual(['client', 'early', 'leave', 'meeting']);
  const leave = page.getByRole('button', { name: /left\. Xem nghĩa từ/ });
  await leave.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'leave' })).toBeFocused();
  await expect(leave).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(leave).toBeFocused();
  await expect
    .poll(async () => (await profile(page))?.profile.vocabulary.leave?.encounterCount)
    .toBe(1);
  await leave.click();
  await expect(page.getByRole('dialog', { name: 'leave' })).toContainText(
    'Nhấn vào từ được gạch chân để xem nghĩa.',
  );
  await expect(page.getByRole('dialog', { name: 'leave' })).not.toContainText('rời đi');
  await page.getByRole('button', { name: 'Hiện bản dịch' }).click();
  await expect(page.getByRole('dialog', { name: 'leave' })).toContainText('rời đi');
  await changeModeInSettings(page, 'Beginner');
  await expect.poll(async () => (await settings(page))?.translationMode).toBe('Beginner');
  await expect.poll(async () => (await profile(page))?.vocabularyTutorialSeen).toBe(true);
  await page.getByRole('button', { name: /left\. Xem nghĩa từ/ }).click();
  await expect(page.getByRole('dialog', { name: 'leave' })).toContainText('rời đi');
  await changeModeInSettings(page, 'Immersion');
  await expect.poll(async () => (await settings(page))?.translationMode).toBe('Immersion');
  await page.getByRole('button', { name: /left\. Xem nghĩa từ/ }).click();
  await expect(page.getByRole('dialog', { name: 'leave' })).not.toContainText('rời đi');
  await changeModeInSettings(page, 'Beginner');
  await expect.poll(async () => (await settings(page))?.translationMode).toBe('Beginner');
  await page.reload();
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
  await expect
    .poll(async () => (await profile(page))?.profile.vocabulary.leave?.encounterCount)
    .toBe(1);
  await expect.poll(async () => (await settings(page))?.translationMode).toBe('Beginner');
  await expect.poll(async () => (await profile(page))?.vocabularyTutorialSeen).toBe(true);
  await page.keyboard.press('j');
  await page.getByRole('button', { name: 'Từ vựng', exact: true }).click();
  await page
    .locator('.notebook-word-list')
    .getByRole('button', { name: 'leave', exact: true })
    .click();
  await expect(page.getByRole('heading', { name: 'leave' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'return' })).toHaveCount(0);
  await expect(page.locator('canvas')).toHaveCount(1);
});

test('confirmed learning reset preserves case evidence and keeps one canvas', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await open(page);
  const note = scenePoint('main_office', 'meeting_minutes');
  await page.evaluate(({ x, y }) => window.__lexiconDebug!.teleport(x, y), note);
  await expect(page.getByText('Đọc biên bản cuộc họp')).toBeVisible();
  await page.keyboard.press('e');
  await expect(page.getByRole('dialog')).toContainText('Meeting Minutes');
  await page.getByRole('button', { name: 'Đóng' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await page.evaluate(async () => {
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
      const request = db
        .transaction('records', 'readwrite')
        .objectStore('records')
        .put({ schemaVersion: 99, damaged: true }, 'local-profile');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    db.close();
  });
  await page.reload();
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
  const recovery = page.getByRole('alert');
  await expect(recovery).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(1);
  await recovery.getByRole('button', { name: 'Đặt lại tiến trình từ vựng' }).click();
  await expect(recovery).toHaveCount(0);
  await expect.poll(async () => (await profile(page))?.profile.vocabulary).toEqual({});
  await expect.poll(async () => caseEvidenceIds(page)).toContain('meeting_minutes');
  await expect(page.locator('canvas')).toHaveCount(1);
  expect(pageErrors).toEqual([]);
});

async function changeModeInSettings(page: import('@playwright/test').Page, mode: string) {
  if (await page.getByRole('dialog', { name: 'leave', exact: true }).count())
    await page.keyboard.press('Escape');
  await page.locator('.dialogue-panel').getByRole('button', { name: 'Đóng', exact: true }).click();
  await page.keyboard.press('Escape');
  await page.getByLabel('Chế độ dịch').selectOption(mode);
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await page.keyboard.press('e');
  await expect(page.locator('.dialogue-panel')).toBeVisible();
}
