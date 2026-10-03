import { scenePoint } from './sceneTestData';
import { expect, test, type Page } from '@playwright/test';
import { openWorld, reopenWorld } from './journeyHelpers';

async function open(page: Page): Promise<void> {
  await openWorld(page);
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
}

async function learningProfile(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('lexicon-learning', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise<{
        profile: {
          listening: {
            subtitleUses: number;
            correctAnswers: number;
            incorrectAnswers: number;
            totalTimeToExtractFactMs: number;
            timedFacts: number;
          };
          assistance: { audioReplays: number; hints: number; transcriptOpens: number };
        };
      }>((resolve, reject) => {
        const request = db.transaction('records').objectStore('records').get('local-profile');
        request.onsuccess = () => resolve(request.result as typeof request.result);
        request.onerror = () => reject(request.error);
      });
    } finally {
      db.close();
    }
  });
}

async function caseState(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('lexicon-game-saves', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise<{
        state?: {
          evidenceIds: string[];
          discoveredFactIds: string[];
          flags: Record<string, boolean>;
        };
      }>((resolve, reject) => {
        const request = db.transaction('saves').objectStore('saves').get('case-001');
        request.onsuccess = () => resolve(request.result as typeof request.result);
        request.onerror = () => reject(request.error);
      });
    } finally {
      db.close();
    }
  });
}

async function openInMode(page: Page, mode: 'Beginner' | 'Learning' | 'Immersion') {
  await open(page);
  await page.keyboard.press('Escape');
  const pause = page.getByRole('dialog');
  await expect(pause).toBeVisible();
  await pause.getByLabel('Chế độ dịch').selectOption(mode);
  await pause.getByRole('button', { name: 'Tiếp tục' }).click();
  const hotspot = scenePoint('main_office', 'phone_recording');
  await page.evaluate(({ x, y }) => window.__lexiconDebug!.teleport(x, y), hotspot);
  await expect(page.getByText('Nghe bản ghi điện thoại của Leo')).toBeVisible();
  await page.keyboard.press('e');
  await expect(page.getByRole('dialog')).toContainText("Leo's Phone Recording");
}

test('phone recording resolves the fact and persists playback telemetry after reload', async ({
  page,
}) => {
  // Two real playbacks plus a reload: needs more than the 30s default on software GL.
  test.setTimeout(90_000);
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') pageErrors.push(message.text());
  });

  await open(page);
  const hotspot = scenePoint('main_office', 'phone_recording');
  await page.evaluate(({ x, y }) => window.__lexiconDebug!.teleport(x, y), hotspot);
  await expect(page.getByText('Nghe bản ghi điện thoại của Leo')).toBeVisible();
  await page.keyboard.press('e');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText("Leo's Phone Recording");
  await expect(dialog).toContainText('20:29');
  await expect(dialog).not.toContainText("I'm outside the meeting room");

  await dialog.getByRole('button', { name: 'Gợi ý từ khóa' }).click();
  await expect(dialog).toContainText('meeting room');
  await dialog.getByRole('button', { name: 'Mở lời thoại' }).click();
  await expect(dialog).toContainText("I'm outside the meeting room");
  await dialog.getByRole('button', { name: 'Mở lời thoại' }).click();
  await dialog.getByRole('button', { name: 'Phát bản ghi' }).click();
  await expect(dialog.getByRole('status')).toContainText('Đang phát bản ghi.');
  await expect(dialog.getByRole('status')).toContainText('Đã phát hết bản ghi.', {
    timeout: 10000,
  });
  await dialog.getByRole('button', { name: 'Phát lại từ đầu' }).click();
  await expect(dialog.getByRole('status')).toContainText('Đang phát bản ghi.');
  await expect(dialog.getByRole('status')).toContainText('Đã phát hết bản ghi.', {
    timeout: 10000,
  });

  await dialog.getByRole('button', { name: 'Inside the meeting room' }).click();
  await expect(dialog).toContainText("This interpretation doesn't match the evidence.");
  await expect
    .poll(async () => (await caseState(page))?.state?.discoveredFactIds)
    .not.toContain('leo_outside_at_2029');

  await dialog.getByRole('button', { name: 'Outside the meeting room' }).click();
  await expect(dialog).toContainText('Bạn đã rút ra fact từ bản ghi này.');

  await expect
    .poll(async () => (await caseState(page))?.state?.flags.leo_phone_recording_understood)
    .toBe(true);
  await expect
    .poll(async () => (await caseState(page))?.state?.discoveredFactIds)
    .toContain('leo_outside_at_2029');
  await expect(page.locator('canvas')).toHaveCount(1);

  await reopenWorld(page);
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
  await expect
    .poll(async () => (await caseState(page))?.state?.discoveredFactIds)
    .toContain('leo_outside_at_2029');
  await expect
    .poll(async () => (await learningProfile(page))?.profile.listening)
    .toMatchObject({
      subtitleUses: 0,
      correctAnswers: 1,
      incorrectAnswers: 1,
      timedFacts: 1,
    });
  await expect
    .poll(async () => (await learningProfile(page))?.profile.assistance)
    .toMatchObject({ audioReplays: 1, hints: 1, transcriptOpens: 1 });
  expect((await learningProfile(page))?.profile.listening.totalTimeToExtractFactMs).toBeGreaterThan(
    0,
  );
  await expect(page.locator('canvas')).toHaveCount(1);
  expect(pageErrors).toEqual([]);
});

test('Beginner mode shows the transcript and translation for the recording', async ({ page }) => {
  await openInMode(page, 'Beginner');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText("I'm outside the meeting room");
  await expect(dialog).toContainText('Chào, tôi đang ở bên ngoài');
  await expect(page.locator('canvas')).toHaveCount(1);
});

test('Immersion mode keeps the transcript and translation hidden', async ({ page }) => {
  await openInMode(page, 'Immersion');
  const dialog = page.getByRole('dialog');
  await expect(dialog).not.toContainText("I'm outside the meeting room");
  await expect(dialog).not.toContainText('Chào, tôi đang ở bên ngoài');
  await expect(page.locator('canvas')).toHaveCount(1);
});

test('audio failure can retry and closing playback unmounts the evidence session', async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('net::ERR_FAILED'))
      pageErrors.push(message.text());
  });
  await page.route('**/audio/case-001/leo-phone-recording.wav', (route) => route.abort());
  await openInMode(page, 'Learning');
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Phát bản ghi' }).click();
  await expect(dialog).toContainText('Không thể phát bản ghi. Bạn có thể thử lại.');
  await page.unroute('**/audio/case-001/leo-phone-recording.wav');
  await dialog.getByRole('button', { name: 'Thử phát lại' }).click();
  await expect(dialog.getByRole('status')).toContainText('Đang phát bản ghi.');
  await expect(dialog.getByRole('status')).toContainText('Đã phát hết bản ghi.', {
    timeout: 10000,
  });
  await dialog.getByRole('button', { name: 'Phát lại từ đầu' }).click();
  await expect(dialog.getByRole('status')).toContainText('Đang phát bản ghi.');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.listening-task')).toHaveCount(0);
  await expect(page.locator('canvas')).toHaveCount(1);
  expect(pageErrors).toEqual([]);
});

test('a collected recording can be reopened from the notebook to answer later', async ({
  page,
}) => {
  await open(page);
  const hotspot = scenePoint('main_office', 'phone_recording');
  await page.evaluate(({ x, y }) => window.__lexiconDebug!.teleport(x, y), hotspot);
  await expect(page.getByText('Nghe bản ghi điện thoại của Leo')).toBeVisible();
  await page.keyboard.press('e');
  await expect(page.getByRole('dialog')).toContainText("Leo's Phone Recording");
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await page.keyboard.press('j');
  await page.locator('.notebook-index-card').first().click();
  await page.getByRole('button', { name: 'Xem lại' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText("Leo's Phone Recording");
  await dialog.getByRole('button', { name: 'Outside the meeting room' }).click();
  await expect(dialog).toContainText('Bạn đã rút ra fact từ bản ghi này.');
  await expect
    .poll(async () => (await caseState(page))?.state?.flags.leo_phone_recording_understood)
    .toBe(true);
  await expect
    .poll(async () => (await caseState(page))?.state?.evidenceIds)
    .toEqual(['leo_phone_recording']);
});

test('the recorder keys work from the keyboard and a number key answers', async ({ page }) => {
  test.setTimeout(90_000);
  await openInMode(page, 'Learning');
  const dialog = page.getByRole('dialog');
  const status = dialog.locator('.listening-playback-state');

  await page.keyboard.press(' ');
  await expect(status).toContainText('Đang phát bản ghi.', { timeout: 10_000 });
  await page.keyboard.press(' ');
  await expect(status).toContainText('Bản ghi đã tạm dừng.');
  await page.keyboard.press('r');
  await expect(status).toContainText('Đang phát bản ghi.', { timeout: 10_000 });

  await page.keyboard.press('h');
  await expect(dialog.locator('.listening-hint')).toBeVisible();
  await page.keyboard.press('h');
  await expect(dialog.locator('.listening-hint')).toHaveCount(0);
  await page.keyboard.press('t');
  await expect(dialog.locator('.listening-transcript')).toBeVisible();

  await page.keyboard.press('1');
  await expect(dialog.locator('.listening-feedback')).toContainText(
    "This interpretation doesn't match the evidence.",
  );
  await expect(dialog.locator('.listening-verified')).toHaveCount(0);
  await page.keyboard.press('2');
  await expect(dialog.locator('.listening-verified')).toContainText('Đã xác minh');
  await expect(dialog.locator('.listening-feedback')).toContainText(
    'Bạn đã rút ra fact từ bản ghi này.',
  );
});

test('recorder keys stay quiet on the evidence section and over a focused button', async ({
  page,
}) => {
  await openInMode(page, 'Learning');
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Chứng cứ', exact: true }).click();
  await page.keyboard.press('1');
  await expect(dialog.locator('.listening-feedback')).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Bài nghe của vụ án' }).click();
  // Space on a focused key is the browser's click, so it must act exactly once.
  await dialog.getByRole('button', { name: 'Phát bản ghi' }).focus();
  await page.keyboard.press(' ');
  await expect(dialog.locator('.listening-playback-state')).toContainText('Đang phát bản ghi.', {
    timeout: 10_000,
  });
});
