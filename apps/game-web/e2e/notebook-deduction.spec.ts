import { test, expect, type Locator } from '@playwright/test';
import {
  definition,
  strings,
  seedInvestigation,
  expectNoInvestigationScroll,
  readAllPages,
  turnToVisible,
} from './investigationFixture';
import { fileURLToPath } from 'node:url';
import { saved } from './journeyHelpers';
test.setTimeout(90_000);
test('notebook selects one dossier and one evidence without changing case progress', async ({
  page,
}) => {
  await seedInvestigation(page, {
    flags: { anna_q1_read: true, leo_q1_read: true },
    evidenceIds: ['meeting_minutes', 'leo_phone_recording'],
  });
  const before = await saved(page);
  await page.keyboard.press('j');
  const notebook = page.locator('.notebook-panel');
  expect((await notebook.boundingBox())!.width).toBeGreaterThan(700);
  await expect(notebook.locator('.notebook-tabs button')).toHaveCount(4);
  await notebook.getByRole('button', { name: strings.people, exact: true }).click();
  await expect(notebook.locator('.notebook-person')).toHaveCount(1);
  await notebook.getByRole('button', { name: 'Leo Tran', exact: true }).click();
  await expect(notebook.locator('.notebook-person .page-viewport h3').first()).toHaveText(
    'Leo Tran',
  );
  expect(await readAllPages(notebook.locator('.notebook-person .measured-page'))).toContain(
    definition.dialogues.find((t) => t.npcId === 'leo')!.nodes.find((n) => n.id === 'answer1')!
      .text,
  );
  await notebook.getByRole('button', { name: strings.evidence, exact: true }).click();
  await notebook.getByRole('button', { name: "Leo's Phone Recording", exact: true }).click();
  expect(
    await readAllPages(notebook.locator('.notebook-evidence-detail .measured-page')),
  ).toContain('A phone recording Leo left at 20:29.');
  expect((await saved(page))?.state).toEqual(before?.state);
  await notebook.getByRole('button', { name: strings.close, exact: true }).click();
  await expect(page.locator('.game-root > [tabindex="-1"]')).toBeFocused();
  await expect(page.locator('canvas')).toHaveCount(1);
});

test('board is separate and supports atomic switching with native keyboard focus', async ({
  page,
}) => {
  await seedInvestigation(page, {
    flags: { anna_q1_read: true, leo_q1_read: true },
    evidenceIds: ['meeting_minutes'],
  });
  const before = await saved(page);
  await page.keyboard.press('b');
  const board = page.locator('.deduction-board');
  await expect(board).toBeVisible();
  const portraitBox = (await board
    .locator('.deduction-card .investigation-portrait')
    .first()
    .boundingBox())!;
  expect(portraitBox.height).toBeGreaterThanOrEqual(portraitBox.width * 1.2);
  const closeBox = (await board
    .getByRole('button', { name: strings.close, exact: true })
    .boundingBox())!;
  expect(closeBox.width).toBeGreaterThanOrEqual(44);
  expect(closeBox.height).toBeGreaterThanOrEqual(44);
  await expect(page.locator('.notebook-panel')).toHaveCount(0);
  await expect(board.getByRole('button', { name: strings.close, exact: true })).toBeFocused();
  await board.getByRole('button', { name: strings.openNotebookFromBoard, exact: true }).click();
  await expect(board).toHaveCount(0);
  await expect(page.locator('.notebook-panel')).toBeVisible();
  await page.keyboard.press('b');
  await expect(board).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(board).toHaveCount(0);
  await expect(page.locator('.game-root > [tabindex="-1"]')).toBeFocused();
  expect((await saved(page))?.state).toEqual(before?.state);
  await expect(page.locator('canvas')).toHaveCount(1);
});

for (const viewport of [
  { width: 1280, height: 720 },
  { width: 760, height: 600 },
  { width: 390, height: 844 },
]) {
  test(`notebook and board fit with keyboard traversal ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await seedInvestigation(
      page,
      {
        flags: {
          anna_q1_read: true,
          anna_q2_read: true,
          anna_q3_read: true,
          leo_q1_read: true,
          david_statement_read: true,
        },
        evidenceIds: definition.evidences.map((e) => e.id),
        discoveredFactIds: definition.facts.map((f) => f.id),
        timelineEventIds: ['report_missing_21_05'],
      },
      true,
    );
    await page.keyboard.press('j');
    const notebook = page.locator('.notebook-panel');
    for (const [tab, label] of [
      ['people', strings.people],
      ['evidence', strings.evidence],
      ['vocabulary', strings.vocabulary],
      ['timeline', strings.timeline],
    ]) {
      await notebook.getByRole('button', { name: label, exact: true }).click();
      await expect(notebook.getByRole('button', { name: label, exact: true })).toHaveCSS(
        'background-color',
        'rgb(116, 48, 38)',
      );
      await expectNoInvestigationScroll(
        page,
        page.getByRole('dialog', { name: strings.notebook, exact: true }),
      );
      await page.screenshot({
        path: fileURLToPath(
          new URL(
            `../../../docs/ai/playtests/2026-10-02-investigation-pagination/${tab}-${viewport.width}.png`,
            import.meta.url,
          ),
        ),
      });
    }
    await page.keyboard.press('b');
    const board = page.locator('.deduction-board');
    await expect(board).toBeVisible();
    // Cards are paginated: turn to the page that holds the evidence card.
    await (
      await turnToVisible(
        board.locator('.clues-cards .measured-page'),
        board.getByRole('button', { name: 'Meeting Minutes', exact: true }),
      )
    ).click();
    await expect(board.locator('.deduction-detail')).toContainText('Meeting Minutes');
    await board.getByRole('button', { name: strings.investigationRelations, exact: true }).click();
    await expect(board.locator('.deduction-detail .page-viewport')).toContainText(
      'Meeting Minutes',
    );
    const box = (await board.boundingBox())!;
    const margin = viewport.width <= 800 ? 8 : 12;
    expect(box.x).toBeGreaterThanOrEqual(margin);
    expect(box.y).toBeGreaterThanOrEqual(margin);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width - margin);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height - margin);
    await expectNoInvestigationScroll(page, board);
    await board.getByRole('button', { name: strings.close, exact: true }).focus();
    const count = await board.locator('button:enabled').count();
    for (let i = 0; i <= count; i++) {
      await page.keyboard.press('Tab');
      expect(await board.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    }
    await page.screenshot({
      path: fileURLToPath(
        new URL(
          `../../../docs/ai/playtests/2026-10-02-investigation-pagination/board-${viewport.width}.png`,
          import.meta.url,
        ),
      ),
    });
    await page.keyboard.press('Escape');
    await expect(board).toHaveCount(0);
    await expect(page.locator('canvas')).toHaveCount(1);
  });
}

test('notebook reveal is scoped to the chosen word and board popover Escape stays on board', async ({
  page,
}) => {
  await seedInvestigation(
    page,
    { flags: { anna_q1_read: true }, evidenceIds: ['meeting_minutes'] },
    true,
  );
  await page.keyboard.press('j');
  const notebook = page.locator('.notebook-panel');
  await notebook.getByRole('button', { name: strings.vocabulary, exact: true }).click();
  const cards = notebook.locator('.notebook-index .page-viewport .notebook-index-card');
  expect(await cards.count()).toBeGreaterThan(1);
  const detail = notebook.locator('.notebook-word-detail .measured-page');
  const translationOf = async (card: Locator) => {
    const lemma = await card.getAttribute('aria-label');
    return definition.vocabulary.find((w) => w.lemma === lemma)!.translationVi;
  };
  const firstTranslation = await translationOf(cards.first());
  const secondTranslation = await translationOf(cards.nth(1));
  expect(await readAllPages(detail)).not.toContain(firstTranslation);
  const reveal = await turnToVisible(
    detail,
    detail.getByRole('button', { name: strings.revealTranslation, exact: true }),
  );
  await reveal.click();
  expect(await readAllPages(detail)).toContain(firstTranslation);
  await cards.nth(1).click();
  const afterSecond = await readAllPages(detail);
  expect(afterSecond).not.toContain(firstTranslation);
  expect(afterSecond).not.toContain(secondTranslation);
  await cards.first().click();
  expect(await readAllPages(detail)).not.toContain(firstTranslation);
  await page.keyboard.press('b');
  const board = page.locator('.deduction-board');
  await board.getByRole('button', { name: 'Meeting Minutes', exact: true }).click();
  const word = board.locator('.vocabulary-word').first();
  await word.click();
  await expect(board.locator('.vocabulary-popover')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(board.locator('.vocabulary-popover')).toHaveCount(0);
  await expect(board).toBeVisible();
  await expect(word).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(board).toHaveCount(0);
  await expect(page.getByRole('dialog', { name: strings.paused })).toHaveCount(0);
});

test('source relations remain reachable in native Tab order with no discovered facts', async ({
  page,
}) => {
  await seedInvestigation(page, { evidenceIds: ['meeting_minutes'] });
  await page.keyboard.press('b');
  const board = page.locator('.deduction-board');
  const relations = board.getByRole('button', {
    name: strings.investigationRelations,
    exact: true,
  });
  let reached = false;
  const count = await board.locator('button:enabled').count();
  for (let i = 0; i <= count + 1; i++) {
    await page.keyboard.press('Tab');
    reached ||= await relations.evaluate((el) => el === document.activeElement);
  }
  expect(reached).toBe(true);
});

test('portrait artwork keeps every character head inside its frame', async ({ page }) => {
  await seedInvestigation(page, {
    flags: { anna_q1_read: true, leo_q1_read: true, david_statement_read: true },
  });
  await page.keyboard.press('b');
  const frames = page.locator(
    '.clues-cards .page-viewport .deduction-card .investigation-portrait',
  );
  await expect(frames).toHaveCount(3);
  for (const frame of await frames.all()) {
    const img = frame.locator('img');
    await expect
      .poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
      .toBe(true);
    const bounds = await frame.evaluate((el) => {
      const image = el.querySelector('img')!;
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d')!;
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let firstRow = canvas.height;
      for (let y = 0; y < canvas.height; y++) {
        if (
          Array.from(
            { length: canvas.width },
            (_, x) => pixels[(y * canvas.width + x) * 4 + 3]!,
          ).some((alpha) => alpha > 100)
        ) {
          firstRow = y;
          break;
        }
      }
      const rect = image.getBoundingClientRect(),
        frame = el.getBoundingClientRect();
      return {
        headTop: rect.top + (firstRow * rect.height) / image.naturalHeight,
        frameTop: frame.top + el.clientTop,
      };
    });
    expect(bounds.headTop).toBeGreaterThanOrEqual(bounds.frameTop);
  }
});
