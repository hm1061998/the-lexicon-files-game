import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { scenePoint } from './sceneTestData';

test('dialogue and notebook controls stay accessible and fit a compact viewport', async ({
  page,
}) => {
  const output = '../../.superpowers/sdd/2026-10-01-phase-11e-camera-audio-ui-addendum';
  mkdirSync(output, { recursive: true });
  await page.setViewportSize({ width: 760, height: 600 });
  await page.goto('/');
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
  await page.evaluate(
    ({ x, y }) => window.__lexiconDebug!.teleport(x, y),
    scenePoint('main_office', 'anna', { u: 0.3, v: 0.6 }),
  );
  await page.locator('canvas').click({ position: { x: 400, y: 300 } });
  await page.keyboard.press('e');

  const dialogue = page.getByRole('dialog');
  await expect(dialogue).toBeVisible();
  const modes = page.getByRole('group', { name: 'Chế độ dịch' }).first();
  await expect(modes.getByRole('button', { name: 'Đang học' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.screenshot({ path: `${output}/dialogue-compact-760x600.png` });
  await expect(dialogue.getByRole('button', { name: 'Phát lại giọng đọc' })).toBeVisible();
  await expect(page.locator('.dialogue-tools').getByRole('group')).toHaveCount(2);
  await modes.getByRole('button', { name: 'Cơ bản' }).focus();
  await page.keyboard.press('Enter');
  await expect(modes.getByRole('button', { name: 'Cơ bản' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.screenshot({ path: `${output}/dialogue-desktop-1280x720.png` });
  await page.setViewportSize({ width: 760, height: 600 });
  const dialogueBounds = await page.locator('.dialogue-panel').boundingBox();
  expect(dialogueBounds).not.toBeNull();
  expect(dialogueBounds!.x).toBeGreaterThanOrEqual(0);
  expect(dialogueBounds!.y).toBeGreaterThanOrEqual(12);
  expect(dialogueBounds!.x + dialogueBounds!.width).toBeLessThanOrEqual(760);
  expect(dialogueBounds!.y + dialogueBounds!.height).toBeLessThanOrEqual(600);
  const closeBounds = await dialogue
    .getByRole('button', { name: 'Đóng', exact: true })
    .boundingBox();
  expect(closeBounds?.y).toBeGreaterThanOrEqual(12);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(760);

  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 760, height: 600 });
  await page.reload();
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
  await page.keyboard.press('j');
  const notebook = page.locator('.notebook-panel');
  await expect(notebook).toBeVisible();
  const notebookModes = notebook.getByRole('group', { name: 'Chế độ dịch' });
  await expect(notebookModes).toBeVisible();
  await expect(notebookModes).toBeInViewport();
  const notebookModeBounds = await notebookModes.boundingBox();
  expect(notebookModeBounds).not.toBeNull();
  expect(notebookModeBounds!.y).toBeGreaterThanOrEqual(0);
  await page.screenshot({ path: `${output}/notebook-compact-760x600.png` });
  await notebook.getByRole('button', { name: 'Chứng cứ', exact: true }).click();
  await expect(
    notebook.getByText('Chưa thu thập được chứng cứ nào.', { exact: true }),
  ).toBeVisible();
  const notebookBounds = await notebook.boundingBox();
  expect(notebookBounds).not.toBeNull();
  expect(notebookBounds!.x).toBeGreaterThanOrEqual(0);
  expect(notebookBounds!.x + notebookBounds!.width).toBeLessThanOrEqual(760);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(760);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.screenshot({ path: `${output}/notebook-desktop-1280x720.png` });
});
