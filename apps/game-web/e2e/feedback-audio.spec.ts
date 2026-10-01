import { expect, test } from '@playwright/test';

test('loads ambient music only after the first real browser gesture', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('project-utopia.ogg')) requests.push(request.url());
  });
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => Boolean(window.__lexiconDebug))).toBe(true);
  expect(requests).toHaveLength(0);
  await page.locator('canvas').click({ position: { x: 300, y: 300 } });
  await expect.poll(() => requests.length).toBe(1);
});

async function openAnnaDialogue(page: import('@playwright/test').Page) {
  await page.goto('/');
  await expect
    .poll(() => page.evaluate(() => Boolean(window.__lexiconDebug?.teleportLogical)))
    .toBe(true);
  await page.evaluate(() => window.__lexiconDebug!.teleportLogical(8.7, 7.4));
  await expect.poll(() => page.evaluate(() => window.__lexiconDebug!.nearby())).toBe('anna');
  await page.keyboard.press('e');
  await expect(page.getByRole('dialog')).toBeVisible();
}

test('plays the authored voice clip, permits the next choice, and exposes replay', async ({
  page,
}) => {
  await page.goto('/');
  await expect
    .poll(() => page.evaluate(() => Boolean(window.__lexiconDebug?.teleportLogical)))
    .toBe(true);
  await page.evaluate(() => window.__lexiconDebug!.teleportLogical(8.7, 7.4));
  await expect.poll(() => page.evaluate(() => window.__lexiconDebug!.nearby())).toBe('anna');
  await page.keyboard.press('e');
  const controls = page.locator('.dialogue-voice-controls');
  await expect(controls).toBeVisible();
  await expect.poll(() => controls.getAttribute('data-voice-key')).toContain('anna_initial');
  await expect(page.getByRole('button', { name: 'Phát lại giọng đọc' })).toBeVisible();
  await page.getByRole('button', { name: 'What time did you leave?' }).click();
  await expect(controls).toHaveAttribute('data-voice-key', expect.stringContaining('answer1'));
  await page.getByRole('button', { name: 'Phát lại giọng đọc' }).click();
  await expect(page.getByText('A little after eight fifteen.')).toBeVisible();
  await page.getByRole('button', { name: 'Đóng' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('voice load failure leaves authored text and choices usable', async ({ page }) => {
  await page.route('**/audio/case-001/anna/anna_initial__entry.wav', (route) =>
    route.fulfill({ status: 404, body: 'missing clip' }),
  );
  await openAnnaDialogue(page);
  await expect
    .poll(() => page.locator('.dialogue-voice-controls').getAttribute('data-voice-status'))
    .toBe('error');
  await expect(page.getByText(/Không thể tải giọng đọc/)).toBeVisible();
  await expect(
    page.getByText('I left the meeting early. I had a call with a client.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'What time did you leave?' }).click();
  await expect(page.getByText('A little after eight fifteen.')).toBeVisible();
});
