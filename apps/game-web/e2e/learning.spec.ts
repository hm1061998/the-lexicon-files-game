import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
const scene = JSON.parse(
  readFileSync(
    new URL(
      '../../../packages/game-content/cases/case-001/scenes/main_office.json',
      import.meta.url,
    ),
    'utf8',
  ),
) as { assets: Array<{ id: string; x: number; y: number }> };

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
            translationMode: string;
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

test('visible dialogue records only annotated contexts and persists mode/progress', async ({
  page,
}) => {
  await open(page);
  const anna = scene.assets.find((asset) => asset.id === 'anna')!;
  await page.evaluate(({ x, y }) => window.__lexiconDebug!.teleport(x + 50, y + 30), anna);
  await expect(page.getByText('Nói chuyện với Anna', { exact: true })).toBeVisible();
  await page.locator('canvas').click({ position: { x: 400, y: 300 } });
  await page.keyboard.press('e');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: /left\. Xem nghĩa từ/ })).toBeVisible();
  await expect
    .poll(async () => (await profile(page))?.profile.vocabulary.leave?.encounterCount)
    .toBe(1);
  await page.getByRole('button', { name: /left\. Xem nghĩa từ/ }).click();
  await expect(page.getByRole('dialog', { name: 'leave' })).toContainText(
    'Nhấn vào từ được gạch chân để xem nghĩa.',
  );
  await expect(page.getByRole('dialog', { name: 'leave' })).not.toContainText('rời đi');
  await page.getByRole('button', { name: 'Hiện bản dịch' }).click();
  await expect(page.getByRole('dialog', { name: 'leave' })).toContainText('rời đi');
  await page.getByLabel('Chế độ dịch').selectOption('Beginner');
  await expect.poll(async () => (await profile(page))?.translationMode).toBe('Beginner');
  await expect.poll(async () => (await profile(page))?.vocabularyTutorialSeen).toBe(true);
  await page.getByRole('button', { name: /left\. Xem nghĩa từ/ }).click();
  await expect(page.getByRole('dialog', { name: 'leave' })).toContainText('rời đi');
  await page.getByLabel('Chế độ dịch').selectOption('Immersion');
  await expect.poll(async () => (await profile(page))?.translationMode).toBe('Immersion');
  await page.getByRole('button', { name: /left\. Xem nghĩa từ/ }).click();
  await expect(page.getByRole('dialog', { name: 'leave' })).not.toContainText('rời đi');
  await page.getByLabel('Chế độ dịch').selectOption('Beginner');
  await expect.poll(async () => (await profile(page))?.translationMode).toBe('Beginner');
  await page.reload();
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
  await expect
    .poll(async () => (await profile(page))?.profile.vocabulary.leave?.encounterCount)
    .toBe(1);
  await expect.poll(async () => (await profile(page))?.translationMode).toBe('Beginner');
  await expect.poll(async () => (await profile(page))?.vocabularyTutorialSeen).toBe(true);
  await page.keyboard.press('j');
  await page.getByRole('button', { name: 'Từ vựng', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'leave' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'return' })).toHaveCount(0);
  await expect(page.locator('canvas')).toHaveCount(1);
});
