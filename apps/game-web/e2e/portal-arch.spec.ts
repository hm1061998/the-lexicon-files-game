import { expect, test } from '@playwright/test';
import { scenePoint } from './sceneTestData';
import { interactAt, openWorld } from './journeyHelpers';

test('wall arch portals pick their art from the wall and do not re-trigger after arrival', async ({
  page,
}) => {
  await openWorld(page);
  // hallway_door sits in the west wall (a wall along v): the `ne` drawing, not mirrored.
  expect(await page.evaluate(() => window.__lexiconDebug!.portalFacing('hallway_door'))).toBe('ne');

  const door = scenePoint('main_office', 'hallway_door');
  await interactAt(page, door.x, door.y, 'Đến phòng lưu trữ', true);
  await expect
    .poll(() => page.evaluate(() => window.__lexiconDebug!.storeSceneId()))
    .toBe('archive');
  // The archive's return portal is in its east wall: mirrored art.
  expect(
    await page.evaluate(() => window.__lexiconDebug!.portalFacing('PLACEHOLDER_archive_door')),
  ).toBe('ne-flip');

  // Arrival puts the player in front of the return arch; nothing must fire on its own.
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => window.__lexiconDebug!.storeSceneId())).toBe('archive');
  const prompt = page.getByText('Quay lại văn phòng', { exact: true });
  await expect(prompt).toBeVisible();
  // The prompt is steady: it is still the same single element a moment later.
  await page.waitForTimeout(500);
  await expect(prompt).toHaveCount(1);
  expect(await page.evaluate(() => window.__lexiconDebug!.storeSceneId())).toBe('archive');
});
