import { expect, test } from '@playwright/test';

test('app boots with exactly one Phaser canvas', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/');

  await expect(page.locator('canvas')).toHaveCount(1);
  expect(errors).toEqual([]);
});
