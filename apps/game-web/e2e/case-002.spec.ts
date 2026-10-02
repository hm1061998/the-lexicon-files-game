import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import type { UiStrings } from '@lexicon/shared-types';
import { scenePoint } from './sceneTestData';
import {
  chooseCase,
  interactAt,
  openWorld,
  reopenWorld,
  saved,
  type SavedRecord,
} from './journeyHelpers';
import { openFace, reveal } from './investigationFixture';

const strings = JSON.parse(
  readFileSync(new URL('../../../packages/game-content/ui/vi.json', import.meta.url), 'utf8'),
) as UiStrings;

const CASE = 'case-002';
const at = (sceneId: string, id: string, offset?: { u: number; v: number }) =>
  scenePoint(sceneId, id, offset, CASE);

/** Walk to an evidence point, read it and close the evidence modal. */
async function collect(page: Page, sceneId: string, id: string, prompt: string): Promise<void> {
  const point = at(sceneId, id);
  await interactAt(page, point.x, point.y, prompt);
  await expect(page.getByRole('dialog')).toBeVisible();
  // Case #002 declares no listening tasks: the evidence modal must not render a listening panel.
  await expect(page.locator('.listening-task')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

async function goThrough(page: Page, sceneId: string, id: string, prompt: string): Promise<void> {
  const point = at(sceneId, id);
  await interactAt(page, point.x, point.y, prompt, true);
}

async function talkTo(page: Page, sceneId: string, npc: string, prompt: string): Promise<void> {
  const point = at(sceneId, npc, { u: 0.3, v: 0.6 });
  await page.locator('canvas').click({ position: { x: 400, y: 300 } });
  await interactAt(page, point.x, point.y, prompt);
  await expect(page.getByRole('dialog')).toBeVisible();
}

async function closeDialogue(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

/** Board choices are paginated and `reveal` only turns forward, so rewind to the first page first. */
async function revealFromStart(page: Page, name: string) {
  const previous = page.getByRole('button', { name: /Trang trước/ });
  while ((await previous.count()) && (await previous.first().isEnabled()))
    await previous.first().click();
  return reveal(page, name);
}

async function compare(page: Page, first: string, second: string): Promise<void> {
  await openFace(page, 'Đối chiếu');
  await openFace(page, 'Dữ kiện đã thu thập');
  await (await revealFromStart(page, first)).click();
  await (await revealFromStart(page, second)).click();
  await page.getByRole('button', { name: 'Kiểm tra mâu thuẫn' }).click();
}

test.describe('Case picker', () => {
  test('picker lists two cases with difficulty and computed counts', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: strings.titleChooseCase })).toBeVisible();
    const cards = page.locator('.case-card');
    await expect(cards).toHaveCount(2);
    await expect(cards.nth(0)).toContainText('The Missing Report');
    await expect(cards.nth(0)).toContainText(strings.caseTierEasy);
    await expect(cards.nth(0)).toContainText(`${strings.caseStatClues}: 5`);
    await expect(cards.nth(1)).toContainText('The Wrong Delivery');
    await expect(cards.nth(1)).toContainText(strings.caseTierMedium);
    await expect(cards.nth(1)).toContainText(`${strings.caseStatClues}: 6`);
    await expect(cards.nth(1)).toContainText(`${strings.caseStatContradictions}: 2`);
  });

  test('recommended case is flagged and the other is not', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(strings.caseRecommended)).toHaveCount(1);
    await expect(page.locator('.case-card').nth(0)).toContainText(strings.caseRecommended);
    await expect(page.locator('.case-card').nth(1)).not.toContainText(strings.caseRecommended);
  });

  for (const viewport of [
    { name: '1280x720', width: 1280, height: 720 },
    { name: '760x600', width: 760, height: 600 },
    { name: '390x844', width: 390, height: 844 },
  ]) {
    test(`picker and cards fit ${viewport.name} without horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await expect(page.locator('.case-card')).toHaveCount(2);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
      for (const card of await page.locator('.case-card').all()) {
        const box = await card.boundingBox();
        expect(box!.width).toBeGreaterThanOrEqual(43.5);
        expect(box!.height).toBeGreaterThanOrEqual(43.5);
        expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
      }
    });
  }
});

test.describe.serial('Case #002 journey', () => {
  test.setTimeout(120_000);
  let page: Page;
  let case001Before: SavedRecord | undefined;
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

  test('case-001 progress exists before case-002 is started', async () => {
    await openWorld(page);
    await interactAt(
      page,
      scenePoint('main_office', 'meeting_minutes').x,
      scenePoint('main_office', 'meeting_minutes').y,
      'Đọc biên bản cuộc họp',
    );
    await expect
      .poll(async () => (await saved(page))?.state.evidenceIds)
      .toContain('meeting_minutes');
    await page.keyboard.press('Escape');
    case001Before = await saved(page);
    expect(case001Before?.state.evidenceIds).toEqual(['meeting_minutes']);
  });

  test('collect all six evidences across three scenes in a non-linear order', async () => {
    await reopenWorld(page, { caseId: CASE, mode: 'new' });
    await expect(page.locator('canvas')).toHaveCount(1);
    await collect(page, 'main_office', 'chat_messages', 'Đọc tin nhắn');
    await goThrough(page, 'main_office', 'door_to_reception', 'Đến quầy lễ tân');
    await collect(page, 'reception', 'courier_receipt', 'Đọc biên nhận chuyển phát');
    await collect(
      page,
      'reception',
      'client_complaint_email',
      'Đọc email khiếu nại của khách hàng',
    );
    await goThrough(page, 'reception', 'door_to_office_from_reception', 'Quay lại văn phòng');
    await goThrough(page, 'main_office', 'door_to_mail_room', 'Đến phòng thư');
    await collect(page, 'mail_room', 'mailroom_access_log', 'Đọc nhật ký ra vào phòng thư');
    await collect(page, 'mail_room', 'label_printer_log', 'Đọc nhật ký máy in nhãn');
    await goThrough(page, 'mail_room', 'door_to_office', 'Quay lại văn phòng');
    await collect(page, 'main_office', 'delivery_note', 'Đọc phiếu giao hàng');
    await expect.poll(async () => (await saved(page, CASE))?.state.evidenceIds.length).toBe(6);
  });

  test('talk to Anna, Leo and David', async () => {
    await talkTo(page, 'main_office', 'anna', 'Nói chuyện với Anna');
    await page.getByRole('button', { name: 'What address did you check at 16:10?' }).click();
    await page.getByRole('button', { name: 'Continue asking' }).click();
    await page.getByRole('button', { name: 'What was the delivery schedule?' }).click();
    await page.getByRole('button', { name: 'Continue asking' }).click();
    await page.getByRole('button', { name: 'Your message says 14. Can you confirm that?' }).click();
    await closeDialogue(page);

    await talkTo(page, 'main_office', 'leo', 'Nói chuyện với Leo');
    await page.getByRole('button', { name: 'Where were you this afternoon?' }).click();
    await page.getByRole('button', { name: 'Continue asking' }).click();
    await page.getByRole('button', { name: 'Was your sample ready for the client?' }).click();
    await page.getByRole('button', { name: 'Continue asking' }).click();
    await page
      .getByRole('button', {
        name: 'The access log shows you entered the mail room at 16:40. Why?',
      })
      .click();
    await expect(page.getByRole('dialog')).toContainText('Anna wrote the wrong house number');
    await closeDialogue(page);

    await goThrough(page, 'main_office', 'door_to_reception', 'Đến quầy lễ tân');
    await talkTo(page, 'reception', 'david', 'Nói chuyện với David');
    await page.getByRole('button', { name: 'When did you ask for the package?' }).click();
    await page.getByRole('button', { name: 'Continue asking' }).click();
    await page.getByRole('button', { name: 'Why did you want it early?' }).click();
    // The "question done" flag is written by the Continue choice, not by closing the dialogue.
    await page.getByRole('button', { name: 'Continue asking' }).click();
    await closeDialogue(page);
    await goThrough(page, 'reception', 'door_to_office_from_reception', 'Quay lại văn phòng');

    await expect
      .poll(async () => (await saved(page, CASE))?.state.discoveredFactIds)
      .toEqual(
        expect.arrayContaining([
          'anna_checked_address_16_10',
          'leo_statement_at_desk_all_afternoon',
          'leo_blames_anna_wrong_number',
          'david_asked_early_16_25',
        ]),
      );
    // Objective completion conditions are reconciled after dialogue choices, so both chain here.
    await expect
      .poll(async () => (await saved(page, CASE))?.state.objectiveStatuses)
      .toMatchObject({ review_the_records: 'completed', speak_to_everyone: 'completed' });
  });

  test("compare Leo's two statements with the records", async () => {
    await page.keyboard.press('b');
    await compare(
      page,
      'Leo says he was at his desk all afternoon.',
      'Leo entered the mail room at 16:40.',
    );
    await expect(page.locator('.contradiction-confirmed')).toContainText(
      'Mâu thuẫn đã được xác nhận.',
    );
    await compare(
      page,
      'Leo says Anna wrote the wrong house number.',
      "A label for 41 Bridge Street was printed from Leo's account at 16:44.",
    );
    await expect(page.locator('.contradiction-confirmed')).toContainText(
      'Mâu thuẫn đã được xác nhận.',
    );
    await expect
      .poll(async () => (await saved(page, CASE))?.state.contradictionIds)
      .toEqual(expect.arrayContaining(['leo_desk_vs_access_log', 'leo_blame_vs_label_log']));
    await expect
      .poll(async () => (await saved(page, CASE))?.state.objectiveStatuses.submit_your_conclusion)
      .toBe('active');
  });

  test('accusing the wrong suspect does not reset progress', async () => {
    await openFace(page, 'Kết luận');
    const submit = page.getByRole('button', { name: 'Nộp kết luận' });
    await expect(submit).toBeDisabled();
    const beforeWrong = await saved(page, CASE);
    await page.locator('.accusation-panel').getByRole('button', { name: 'Anna Reed' }).click();
    await submit.click();
    await expect(
      page
        .getByRole('status')
        .filter({ hasText: /Review the timeline|doesn't match the evidence/ }),
    ).toBeVisible();
    expect(await saved(page, CASE)).toEqual(beforeWrong);
    expect(beforeWrong?.state.evidenceIds).toHaveLength(6);
  });

  test('accusing Leo completes the case', async () => {
    await page.locator('.accusation-panel').getByRole('button', { name: 'Quay lại' }).click();
    await (await reveal(page, 'Leo Tran')).click();
    await page.getByRole('button', { name: 'Nộp kết luận' }).click();
    await expect(page.getByText('CASE CLOSED', { exact: true })).toBeVisible();
    await expect.poll(async () => (await saved(page, CASE))?.state.flags.case_closed).toBe(true);
  });

  test('case-001 and case-002 saves coexist after a reload', async () => {
    const closed = await saved(page, CASE);
    await reopenWorld(page, { caseId: 'case-001' });
    await page.waitForFunction(() => window.__lexiconDebug !== undefined);
    expect(await saved(page, 'case-001')).toEqual(case001Before);
    expect(await saved(page, CASE)).toEqual(closed);

    await reopenWorld(page, { caseId: CASE });
    await page.waitForFunction(() => window.__lexiconDebug !== undefined);
    await expect(page.getByText('CASE CLOSED', { exact: true })).toBeVisible();
    expect(await saved(page, CASE)).toEqual(closed);
    expect(await saved(page, 'case-001')).toEqual(case001Before);
  });

  test('case-002 raised no console errors', async () => {
    expect(errors).toEqual([]);
  });
});

test.describe('Shell reduced motion', () => {
  test('the in-game setting levels the title cover and the picker cards', async ({ page }) => {
    await page.goto('/');
    await chooseCase(page);
    await page.getByRole('button', { name: 'Cài đặt', exact: true }).click();
    await page.getByLabel('Giảm chuyển động').check();
    await expect(page.locator('.game-root')).toHaveClass(/lexicon-motion-off/);
    await page.getByRole('button', { name: 'Quay lại', exact: true }).click();
    const cover = await page
      .locator('.folder-cover')
      .evaluate((el) => getComputedStyle(el).animationName);
    expect(cover).toBe('none');
    await page.getByRole('button', { name: 'Đổi hồ sơ', exact: true }).click();
    const card = page.locator('.case-card').first();
    await expect(card).toBeVisible();
    const style = await card.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { animationName: cs.animationName, rotate: cs.rotate };
    });
    expect(style.animationName).toBe('none');
    expect(style.rotate).toBe('none');
  });
});
