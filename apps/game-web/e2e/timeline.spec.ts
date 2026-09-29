import { expect, test, type Page } from '@playwright/test';

type DebugApi = {
  player(): { x: number; y: number; depth: number };
  teleport(x: number, y: number): void;
};

type SavedRecord = {
  schemaVersion: number;
  activeSceneId: string;
  state: {
    evidenceIds: string[];
    discoveredFactIds: string[];
    timelineEventIds: string[];
    contradictionIds: string[];
    flags: Record<string, boolean>;
    objectiveStatuses: Record<string, string>;
  };
};

declare global {
  interface Window {
    __lexiconDebug?: DebugApi;
  }
}

async function openWorld(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
}

async function interactAt(page: Page, x: number, y: number, prompt: string): Promise<void> {
  await page.evaluate(({ x, y }) => window.__lexiconDebug!.teleport(x, y), { x, y });
  await expect(page.getByText(prompt, { exact: true })).toBeVisible();
  await page.keyboard.press('e');
}

async function saved(page: Page): Promise<SavedRecord | undefined> {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('lexicon-game-saves', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise<SavedRecord | undefined>((resolve, reject) => {
        const request = db.transaction('saves').objectStore('saves').get('case-001');
        request.onsuccess = () => resolve(request.result as SavedRecord | undefined);
        request.onerror = () => reject(request.error);
      });
    } finally {
      db.close();
    }
  });
}

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
  await page.keyboard.press('j');
  await page.getByRole('button', { name: 'Dòng thời gian' }).click();

  const missingReport = page.getByRole('button', { name: 'The report was discovered missing.' });
  await expect(missingReport).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mốc 21:05' })).toHaveCount(0);
  await missingReport.click();
  await expect(page.getByRole('button', { name: 'Mốc 21:05' })).toBeVisible();
  await page.getByRole('button', { name: 'Mốc 20:45' }).click();
  await page.getByRole('button', { name: 'Đặt sự kiện' }).click();
  await expect(page.locator('.notebook-feedback')).toContainText(
    'Something in the timeline is inconsistent.',
  );
  await page.getByRole('button', { name: 'Mốc 21:05' }).click();
  await page.getByRole('button', { name: 'Đặt sự kiện' }).click();
  await expect(page.locator('.notebook-feedback')).toContainText(
    'Sự kiện đã được ghi vào dòng thời gian.',
  );
  await expect
    .poll(async () => (await saved(page))?.state.timelineEventIds)
    .toEqual(['report_missing_21_05']);
  await page.keyboard.press('Escape');

  await interactAt(page, 2100, 700, 'Ra hành lang');
  await expect(page.getByText('Quay lại Main Office', { exact: true })).toBeVisible();
  await interactAt(page, 1500, 1000, 'Kiểm tra nhật ký ra vào');
  await expect
    .poll(async () => (await saved(page))?.state.evidenceIds)
    .toContain('security_access_log');
  await expect
    .poll(async () => (await saved(page))?.state.objectiveStatuses.check_security_records)
    .toBe('completed');
  await page.keyboard.press('Escape');

  await interactAt(page, 420, 700, 'Quay lại Main Office');
  await expect(page.getByText('Nói chuyện với David', { exact: true })).toHaveCount(0);
  await page.evaluate(() => window.__lexiconDebug!.teleport(1900, 900));
  await expect(page.getByText('Nói chuyện với David', { exact: true })).toBeVisible();
  await page.locator('canvas').click({ position: { x: 400, y: 300 } });
  await page.keyboard.press('e');
  const dialogue = page.getByRole('dialog');
  await expect(dialogue).toContainText("I didn't enter the meeting room after eight.");
  await expect
    .poll(async () => (await saved(page))?.state.discoveredFactIds)
    .toContain('david_statement_no_entry_after_20_00');
  await page.keyboard.press('Escape');

  await page.keyboard.press('j');
  await page.getByRole('button', { name: 'Dòng thời gian' }).click();
  const statementFact = page.getByRole('button', {
    name: "David says he didn't enter the meeting room after eight.",
  });
  const annaFact = page.getByRole('button', { name: 'Anna Reed left the meeting room at 20:18.' });
  await expect(statementFact).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'David Cole entered the meeting room at 20:32.' }),
  ).toBeVisible();
  await statementFact.click();
  await annaFact.click();
  await page.getByRole('button', { name: 'Kiểm tra mâu thuẫn' }).click();
  await expect(page.locator('.notebook-feedback')).toContainText(
    "This interpretation doesn't match the evidence.",
  );
  await annaFact.click();
  await page.getByRole('button', { name: 'David Cole entered the meeting room at 20:32.' }).click();
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
  await expect
    .poll(async () => (await saved(page))?.state.objectiveStatuses.compare_david_statement)
    .toBe('completed');
  await page.keyboard.press('Escape');

  await page.evaluate(() => window.__lexiconDebug!.teleport(1900, 900));
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

  await interactAt(page, 2100, 700, 'Ra hành lang');
  await expect(page.getByText('Quay lại Main Office', { exact: true })).toBeVisible();
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

  await page.reload();
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect
    .poll(() => page.evaluate(() => window.__lexiconDebug!.player()))
    .toMatchObject({ x: 1200, y: 1100 });
  expect(await saved(page)).toMatchObject(recordBeforeReload);

  // Phase 9: confession opens the conclusion; a wrong accusation changes nothing.
  await interactAt(page, 420, 700, 'Quay lại Main Office');
  await page.evaluate(() => window.__lexiconDebug!.teleport(1900, 900));
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

  await page.keyboard.press('j');
  await page.getByRole('button', { name: 'Kết luận' }).click();
  const submit = page.getByRole('button', { name: 'Nộp kết luận' });
  await expect(submit).toBeDisabled();
  const beforeWrong = await saved(page);
  const anna = page.getByRole('button', { name: 'Anna Reed' });
  await anna.focus();
  await page.keyboard.press('Enter');
  await expect(anna).toHaveAttribute('aria-pressed', 'true');
  await submit.click();
  await expect(page.getByRole('status').filter({ hasText: 'Review the timeline.' })).toHaveText(
    "The evidence doesn't fully support this conclusion. Review the timeline.",
  );
  expect(await saved(page)).toEqual(beforeWrong);

  await page.getByRole('button', { name: 'David Cole' }).click();
  await submit.click();
  await expect(page.getByText('CASE CLOSED', { exact: true })).toBeVisible();
  await expect(page.getByText('toàn hồ sơ', { exact: false })).toBeVisible();
  await expect.poll(async () => (await saved(page))?.state.flags.case_closed).toBe(true);
  await expect(page.getByRole('button', { name: 'Nộp kết luận' })).toHaveCount(0);
  await page.keyboard.press('j');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Dòng thời gian' })).toHaveCount(0);
  await expect(page.getByRole('dialog', { name: /tạm dừng/i })).toHaveCount(0);
  const closedRecord = await saved(page);
  expect(closedRecord?.state.objectiveStatuses.submit_your_conclusion).toBe('completed');

  await page.reload();
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
  await expect(page.getByText('CASE CLOSED', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nộp kết luận' })).toHaveCount(0);
  expect(await saved(page)).toEqual(closedRecord);
  expect(errors).toEqual([]);
});
