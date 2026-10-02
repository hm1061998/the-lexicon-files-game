import { expect, test, type Page } from '@playwright/test';
import { scenePoint, sceneSpawnPoint } from './sceneTestData';
import { interactAt, openWorld, saved, talkToDavid } from './journeyHelpers';

// Roadmap §31 E2E, one test per step on a shared page so each step builds on the last save.
test.describe.serial('Case #001 journey', () => {
  test.setTimeout(90_000);
  let page: Page;
  const errors: string[] = [];

  test.beforeAll(async ({ browser }, testInfo) => {
    const context = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
    page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
  });

  test.afterAll(async () => {
    await page.context().close();
  });

  test('start case', async () => {
    await openWorld(page);
    await expect(page.locator('canvas')).toHaveCount(1);
    await expect(page.locator('.hud-objective-panel')).toBeVisible();
  });

  test('collect evidence', async () => {
    await interactAt(
      page,
      scenePoint('main_office', 'meeting_minutes').x,
      scenePoint('main_office', 'meeting_minutes').y,
      'Đọc biên bản cuộc họp',
    );
    await expect(page.getByRole('dialog')).toContainText('Meeting Minutes');
    await expect
      .poll(async () => (await saved(page))?.state.evidenceIds)
      .toContain('meeting_minutes');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('find security log', async () => {
    await interactAt(
      page,
      scenePoint('main_office', 'hallway_door').x,
      scenePoint('main_office', 'hallway_door').y,
      'Đến phòng lưu trữ',
      true,
    );
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
  });

  test('talk to NPC', async () => {
    await talkToDavid(page);
    await expect(page.getByRole('dialog')).toContainText(
      "I didn't enter the meeting room after eight.",
    );
    await expect
      .poll(async () => (await saved(page))?.state.discoveredFactIds)
      .toContain('david_statement_no_entry_after_20_00');
    await page.keyboard.press('Escape');
  });

  test('find contradiction', async () => {
    await page.keyboard.press('b');
    await page.getByRole('button', { name: 'The report was discovered missing.' }).click();
    await page.getByRole('button', { name: 'Mốc 21:05' }).click();
    await page.getByRole('button', { name: 'Đặt sự kiện' }).click();
    await expect
      .poll(async () => (await saved(page))?.state.timelineEventIds)
      .toEqual(['report_missing_21_05']);

    const statementFact = page.getByRole('button', {
      name: "David says he didn't enter the meeting room after eight.",
    });
    const annaFact = page.getByRole('button', {
      name: 'Anna Reed left the meeting room at 20:18.',
    });
    const davidFact = page.getByRole('button', {
      name: 'David Cole entered the meeting room at 20:32.',
    });
    await statementFact.click();
    await annaFact.click();
    await page.getByRole('button', { name: 'Kiểm tra mâu thuẫn' }).click();
    await expect(
      page
        .locator('.notebook-feedback')
        .filter({ hasText: "This interpretation doesn't match the evidence." }),
    ).toBeVisible();
    await annaFact.click();
    await davidFact.click();
    await page.getByRole('button', { name: 'Kiểm tra mâu thuẫn' }).click();
    await expect(page.locator('.contradiction-confirmed')).toContainText(
      'Mâu thuẫn đã được xác nhận.',
    );
    await expect
      .poll(async () => (await saved(page))?.state.contradictionIds)
      .toContain('david_statement_vs_access_log');
    await expect
      .poll(async () => (await saved(page))?.state.flags.david_contradiction_found)
      .toBe(true);
    await page.keyboard.press('Escape');
  });

  test('accuse David', async () => {
    // Reload mid-journey: the save must come back identical and the case must stay playable.
    const beforeReload = await saved(page);
    await page.reload();
    await page.waitForFunction(() => window.__lexiconDebug !== undefined);
    expect(await saved(page)).toEqual(beforeReload);
    await talkToDavid(page);
    await page.getByRole('button', { name: "Are you sure you didn't enter the room?" }).click();
    await expect(page.getByRole('dialog')).toContainText('...I may have gone in for a moment.');
    await page.keyboard.press('Escape');
    await talkToDavid(page);
    await page
      .getByRole('button', { name: 'But the security log shows that you entered at 8:32.' })
      .click();
    await page.getByRole('button', { name: 'Which folder?' }).click();
    await expect(page.getByRole('dialog')).toContainText('The Quarterly Risk Report.');
    await expect
      .poll(async () => (await saved(page))?.state.objectiveStatuses.submit_your_conclusion)
      .toBe('active');
    await page.keyboard.press('Escape');

    await page.keyboard.press('b');
    const submit = page.getByRole('button', { name: 'Nộp kết luận' });
    await expect(submit).toBeDisabled();
    const beforeWrong = await saved(page);
    await page.locator('.accusation-panel').getByRole('button', { name: 'Anna Reed' }).click();
    await submit.click();
    await expect(
      page.getByRole('status').filter({ hasText: 'Review the timeline.' }),
    ).toBeVisible();
    expect(await saved(page)).toEqual(beforeWrong);
  });

  test('complete case', async () => {
    await page.locator('.accusation-panel').getByRole('button', { name: 'David Cole' }).click();
    await page.getByRole('button', { name: 'Nộp kết luận' }).click();
    await expect(page.getByText('CASE CLOSED', { exact: true })).toBeVisible();
    await expect.poll(async () => (await saved(page))?.state.flags.case_closed).toBe(true);
    await expect
      .poll(async () => (await saved(page))?.state.objectiveStatuses.submit_your_conclusion)
      .toBe('completed');
    await expect(page.getByRole('button', { name: 'Nộp kết luận' })).toHaveCount(0);
  });

  test('reload preserves the save', async () => {
    const closed = await saved(page);
    expect(closed?.state.evidenceIds).toEqual(
      expect.arrayContaining(['meeting_minutes', 'security_access_log']),
    );
    expect(closed?.state.contradictionIds).toEqual(['david_statement_vs_access_log']);
    await page.reload();
    await page.waitForFunction(() => window.__lexiconDebug !== undefined);
    await expect(page.getByText('CASE CLOSED', { exact: true })).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => window.__lexiconDebug!.player()))
      .toMatchObject(sceneSpawnPoint(closed!.activeSceneId));
    expect(await saved(page)).toEqual(closed);
    expect(errors).toEqual([]);
  });
});
