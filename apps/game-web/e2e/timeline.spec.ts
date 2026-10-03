import { test, expect } from '@playwright/test';
import { scenePoint, sceneSpawnPoint } from './sceneTestData';
import { interactAt, openWorld, reopenWorld, saved } from './journeyHelpers';
import { openFace, reveal } from './investigationFixture';

test('Archive, timeline, contradiction, conclusion and case report survive reload', async ({
  page,
}) => {
  test.setTimeout(150000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await openWorld(page);
  await page.keyboard.press('b');

  await openFace(page, 'Dòng thời gian');
  const missingReport = await reveal(page, 'The report was discovered missing.');
  // The slots are on the string from the start but cannot be picked before an event is.
  await expect(page.getByRole('button', { name: 'Mốc 21:05' })).toBeDisabled();
  await missingReport.click();
  await expect(await reveal(page, 'Mốc 21:05')).toBeVisible();
  await (await reveal(page, 'Mốc 20:45')).click();
  await page.getByRole('button', { name: 'Đặt sự kiện' }).click();
  await expect(
    page.locator('.notebook-feedback').filter({ hasText: /inconsistent|ghi vào|doesn't match/ }),
  ).toContainText('Something in the timeline is inconsistent.');
  await (await reveal(page, 'Mốc 21:05')).click();
  await page.getByRole('button', { name: 'Đặt sự kiện' }).click();
  await expect(
    page.locator('.notebook-feedback').filter({ hasText: /inconsistent|ghi vào|doesn't match/ }),
  ).toContainText('Sự kiện đã được ghi vào dòng thời gian.');
  await expect
    .poll(async () => (await saved(page))?.state.timelineEventIds)
    .toEqual(['report_missing_21_05']);
  await page.keyboard.press('Escape');

  await interactAt(
    page,
    scenePoint('main_office', 'hallway_door').x,
    scenePoint('main_office', 'hallway_door').y,
    'Đến phòng lưu trữ',
    true,
  );
  await expect(page.getByText('Quay lại văn phòng', { exact: true })).toBeVisible();
  await interactAt(
    page,
    scenePoint('archive', 'PLACEHOLDER_security_terminal').x,
    scenePoint('archive', 'PLACEHOLDER_security_terminal').y,
    'Kiểm tra nhật ký ra vào',
  );
  await expect
    .poll(async () => (await saved(page))?.state.evidenceIds)
    .toContain('security_access_log');
  await expect
    .poll(async () => (await saved(page))?.state.objectiveStatuses.check_security_records)
    .toBe('completed');
  await page.keyboard.press('Escape');

  await interactAt(
    page,
    scenePoint('archive', 'PLACEHOLDER_archive_door').x,
    scenePoint('archive', 'PLACEHOLDER_archive_door').y,
    'Quay lại văn phòng',
    true,
  );
  await expect(page.getByText('Nói chuyện với David', { exact: true })).toHaveCount(0);
  await page.evaluate(
    ({ x, y }) => window.__lexiconDebug!.teleport(x, y),
    scenePoint('main_office', 'david', { u: 0.3, v: 0.6 }),
  );
  await expect(page.getByText('Nói chuyện với David', { exact: true })).toBeVisible();
  await page.locator('canvas').click({ position: { x: 400, y: 300 } });
  await page.keyboard.press('e');
  const dialogue = page.getByRole('dialog');
  await expect(dialogue).toContainText("I didn't enter the meeting room after eight.");
  await expect
    .poll(async () => (await saved(page))?.state.discoveredFactIds)
    .toContain('david_statement_no_entry_after_20_00');
  await page.keyboard.press('Escape');

  await page.keyboard.press('b');
  await openFace(page, 'Đối chiếu');
  const statementName = "David says he didn't enter the meeting room after eight.";
  const annaName = 'Anna Reed left the meeting room at 20:18.';
  const davidEntryName = 'David Cole entered the meeting room at 20:32.';
  await expect(await reveal(page, statementName)).toBeVisible();
  await expect(await reveal(page, davidEntryName)).toBeVisible();
  await (await reveal(page, statementName)).focus();
  await page.keyboard.press('Enter');
  await (await reveal(page, annaName)).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Kiểm tra mâu thuẫn' }).focus();
  await page.keyboard.press('Enter');
  await expect(
    page.locator('.notebook-feedback').filter({ hasText: /inconsistent|ghi vào|doesn't match/ }),
  ).toContainText("This interpretation doesn't match the evidence.");
  await (await reveal(page, annaName)).click();
  await (await reveal(page, davidEntryName)).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Kiểm tra mâu thuẫn' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.contradiction-confirmed')).toContainText(
    'Mâu thuẫn đã được xác nhận.',
  );
  await expect
    .poll(async () => (await saved(page))?.state.contradictionIds)
    .toContain('david_statement_vs_access_log');
  await expect
    .poll(async () => (await saved(page))?.state.flags.david_contradiction_found)
    .toBe(true);
  await expect
    .poll(async () => (await saved(page))?.state.objectiveStatuses.compare_david_statement)
    .toBe('completed');
  await page.keyboard.press('Escape');

  await page.evaluate(
    ({ x, y }) => window.__lexiconDebug!.teleport(x, y),
    scenePoint('main_office', 'david', { u: 0.3, v: 0.6 }),
  );
  await expect(page.getByText('Nói chuyện với David', { exact: true })).toBeVisible();
  await page.locator('canvas').click({ position: { x: 400, y: 300 } });
  await page.keyboard.press('e');
  await expect(
    page.getByRole('button', { name: "Are you sure you didn't enter the room?" }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', {
      name: 'But the security log shows that you entered at 8:32.',
    }),
  ).toBeVisible();
  await page.getByRole('button', { name: "Are you sure you didn't enter the room?" }).click();
  await expect(page.getByRole('dialog')).toContainText('...I may have gone in for a moment.');
  await page.keyboard.press('Escape');

  await interactAt(
    page,
    scenePoint('main_office', 'hallway_door').x,
    scenePoint('main_office', 'hallway_door').y,
    'Đến phòng lưu trữ',
    true,
  );
  await expect(page.getByText('Quay lại văn phòng', { exact: true })).toBeVisible();
  const recordBeforeReload = await saved(page);
  expect(recordBeforeReload).toMatchObject({
    schemaVersion: 4,
    activeSceneId: 'archive',
    state: {
      evidenceIds: ['security_access_log'],
      discoveredFactIds: expect.arrayContaining([
        'david_statement_no_entry_after_20_00',
        'david_entry_20_32',
      ]),
      timelineEventIds: ['report_missing_21_05'],
      contradictionIds: ['david_statement_vs_access_log'],
      flags: { david_contradiction_found: true },
      objectiveStatuses: {
        check_security_records: 'completed',
        compare_david_statement: 'completed',
        submit_your_conclusion: 'locked',
      },
    },
  });

  await reopenWorld(page);
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect
    .poll(() => page.evaluate(() => window.__lexiconDebug!.player()))
    .toMatchObject(sceneSpawnPoint(recordBeforeReload!.activeSceneId));
  expect(await saved(page)).toMatchObject(recordBeforeReload);

  // Phase 9: confession opens the conclusion; a wrong accusation changes nothing.
  await interactAt(
    page,
    scenePoint('archive', 'PLACEHOLDER_archive_door').x,
    scenePoint('archive', 'PLACEHOLDER_archive_door').y,
    'Quay lại văn phòng',
    true,
  );
  await page.evaluate(
    ({ x, y }) => window.__lexiconDebug!.teleport(x, y),
    scenePoint('main_office', 'david', { u: 0.3, v: 0.6 }),
  );
  await expect(page.getByText('Nói chuyện với David', { exact: true })).toBeVisible();
  await page.locator('canvas').click({ position: { x: 400, y: 300 } });
  await page.keyboard.press('e');
  await page
    .getByRole('button', { name: 'But the security log shows that you entered at 8:32.' })
    .click();
  await expect(page.getByRole('dialog')).toContainText('I only went in to collect a folder.');
  await page.getByRole('button', { name: 'Which folder?' }).click();
  await expect(page.getByRole('dialog')).toContainText('The Quarterly Risk Report.');
  await expect
    .poll(async () => (await saved(page))?.state.objectiveStatuses.submit_your_conclusion)
    .toBe('active');
  await page.keyboard.press('Escape');

  await page.keyboard.press('b');
  await openFace(page, 'Kết luận');
  const submit = page.getByRole('button', { name: 'Nộp kết luận' });
  await expect(submit).toBeDisabled();
  const beforeWrong = await saved(page);
  const anna = page.locator('.accusation-panel').getByRole('button', { name: 'Anna Reed' });
  await anna.focus();
  await page.keyboard.press('Enter');
  await expect(anna).toHaveAttribute('aria-pressed', 'true');
  await submit.click();
  // The paged feedback also renders an aria-hidden measurement copy, so match on containment.
  await expect(page.getByRole('status').filter({ hasText: 'Review the timeline.' })).toContainText(
    "The evidence doesn't fully support this conclusion. Review the timeline.",
  );
  expect(await saved(page)).toEqual(beforeWrong);

  // Feedback replaces the choice pages; go back to the suspects before choosing again.
  await page.locator('.accusation-panel').getByRole('button', { name: 'Quay lại' }).click();
  await (await reveal(page, 'David Cole')).click();
  await submit.click();
  await expect(page.getByText('CASE CLOSED', { exact: true })).toBeVisible();
  await expect(page.getByText('toàn hồ sơ', { exact: false })).toBeVisible();
  await expect.poll(async () => (await saved(page))?.state.flags.case_closed).toBe(true);
  // A closed case never shows the interaction prompt or the red target outline.
  await expect(page.locator('.hud-interaction-prompt')).toHaveCount(0);
  expect(await page.evaluate(() => window.__lexiconDebug!.highlightBounds())).toBeNull();
  await expect(page.getByRole('button', { name: 'Nộp kết luận' })).toHaveCount(0);
  await page.keyboard.press('j');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Dòng thời gian' })).toHaveCount(0);
  await expect(page.getByRole('dialog', { name: /tạm dừng/i })).toHaveCount(0);
  const closedRecord = await saved(page);
  expect(closedRecord?.state.objectiveStatuses.submit_your_conclusion).toBe('completed');

  await reopenWorld(page);
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
  await expect(page.getByText('CASE CLOSED', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nộp kết luận' })).toHaveCount(0);
  expect(await saved(page)).toEqual(closedRecord);
  expect(errors).toEqual([]);
});
