import { fileURLToPath } from 'node:url';
import { test, expect, type Locator, type Page } from '@playwright/test';
import {
  definition,
  expectNoInvestigationScroll,
  normalizeText,
  readAllPages,
  readStatements,
  seedInvestigation,
  strings,
  turnToVisible,
} from './investigationFixture';

test.setTimeout(180_000);

const VIEWPORTS = [
  { width: 1280, height: 720 },
  { width: 760, height: 600 },
  { width: 390, height: 844 },
  { width: 1280, height: 540 },
  { width: 844, height: 390 },
] as const;

const shots = (name: string) =>
  fileURLToPath(
    new URL(
      `../../../docs/ai/playtests/2026-10-02-investigation-pagination/${name}.png`,
      import.meta.url,
    ),
  );

const allFlags = {
  anna_q1_read: true,
  anna_q2_read: true,
  anna_q3_read: true,
  leo_q1_read: true,
  leo_q2_read: true,
  david_statement_read: true,
  david_q1_read: true,
  david_q2_read: true,
};

async function seedFull(page: Page): Promise<void> {
  await seedInvestigation(
    page,
    {
      flags: allFlags,
      evidenceIds: definition.evidences.map((e) => e.id),
      discoveredFactIds: definition.facts.map((f) => f.id),
      timelineEventIds: ['report_missing_21_05'],
    },
    true,
  );
}

const notebook = (page: Page) => page.getByRole('dialog', { name: strings.notebook, exact: true });

/** Cards that open a detail; on narrow screens the detail view replaces the contents view. */
async function openCard(dialog: Locator, name: string): Promise<void> {
  const card = dialog.getByRole('button', { name, exact: true });
  if (!(await card.isVisible())) {
    // Narrow screens show one view at a time: return to the contents list first.
    const back = dialog.getByRole('button', { name: strings.notebookBackToContents, exact: true });
    if (await back.isVisible()) await back.click();
  }
  await turnToVisible(dialog.locator('.notebook-index .measured-page'), card);
  await card.click();
}

for (const viewport of VIEWPORTS) {
  const label = `${viewport.width}x${viewport.height}`;

  test(`notebook reads every tab in full without scrolling ${label}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize(viewport);
    await seedFull(page);
    await page.keyboard.press('j');
    const dialog = notebook(page);
    await expect(dialog).toBeVisible();

    // People: every recorded statement of every person is reachable and complete.
    await dialog.getByRole('button', { name: strings.people, exact: true }).click();
    await expectNoInvestigationScroll(page, dialog);
    for (const npc of definition.npcs) {
      const card = dialog.getByRole('button', { name: npc.name, exact: true });
      if (!(await card.count())) continue;
      await openCard(dialog, npc.name);
      const known = new Set(
        definition.dialogues
          .filter((tree) => tree.npcId === npc.id)
          .flatMap((tree) => tree.nodes.map((n) => normalizeText(n.text))),
      );
      const statements = await readStatements(dialog.locator('.notebook-person .measured-page'));
      expect(statements.length).toBeGreaterThan(0);
      for (const statement of statements) expect(known.has(statement)).toBe(true);
      await expectNoInvestigationScroll(page, dialog);
    }
    await page.screenshot({ path: shots(`people-${label}`) });

    // Evidence: each description appears whole after turning its pages.
    await dialog.getByRole('button', { name: strings.evidence, exact: true }).click();
    for (const evidence of definition.evidences) {
      await openCard(dialog, evidence.name);
      const text = normalizeText(
        await readAllPages(dialog.locator('.notebook-evidence-detail .measured-page')),
      );
      expect(text).toContain(normalizeText(evidence.description));
    }
    await expectNoInvestigationScroll(page, dialog);
    await page.screenshot({ path: shots(`evidence-${label}`) });

    // Vocabulary: the definition of each collected word is complete.
    await dialog.getByRole('button', { name: strings.vocabulary, exact: true }).click();
    const wordCards = dialog.locator('.notebook-index .page-viewport .notebook-index-card');
    expect(await wordCards.count()).toBeGreaterThan(0);
    const lemma = (await wordCards.first().getAttribute('aria-label'))!;
    await wordCards.first().click();
    const word = definition.vocabulary.find((w) => w.lemma === lemma)!;
    expect(
      normalizeText(await readAllPages(dialog.locator('.notebook-word-detail .measured-page'))),
    ).toContain(normalizeText(word.definitionEn));
    await expectNoInvestigationScroll(page, dialog);
    await page.screenshot({ path: shots(`vocabulary-${label}`) });

    // Timeline: the placed event is listed.
    await dialog.getByRole('button', { name: strings.timeline, exact: true }).click();
    expect(
      await readAllPages(dialog.locator('.notebook-timeline-detail .measured-page')),
    ).toContain('21:05');
    await expectNoInvestigationScroll(page, dialog);
    await page.screenshot({ path: shots(`timeline-${label}`) });

    const close = (await dialog
      .getByRole('button', { name: strings.close, exact: true })
      .boundingBox())!;
    expect(close.x + close.width).toBeLessThanOrEqual(viewport.width);
    expect(close.y + close.height).toBeLessThanOrEqual(viewport.height);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('canvas')).toHaveCount(1);
    expect(errors).toEqual([]);
  });

  test(`board keeps four faces inside the screen ${label}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize(viewport);
    await seedFull(page);
    await page.keyboard.press('b');
    const board = page.locator('.deduction-board');
    await expect(board).toBeVisible();
    const faces = [
      ['clues', strings.deductionCluesFace],
      ['timeline', strings.deductionTimelineFace],
      ['compare', strings.deductionCompareFace],
      ['conclusion', strings.deductionConclusionFace],
    ] as const;
    for (const [id, name] of faces) {
      await board.getByRole('button', { name, exact: true }).click();
      // Only visible page surfaces matter: the wide-screen case file is hidden on narrow ones.
      await expect(
        board.locator('.page-viewport:visible').filter({ hasText: strings.pagePreparing }),
      ).toHaveCount(0);
      await expectNoInvestigationScroll(page, board);
      const box = (await board.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
      await page.screenshot({ path: shots(`board-${id}-${label}`) });
    }
    // Compare face: every discovered fact is reachable and the pair can be picked.
    await board.getByRole('button', { name: strings.deductionCompareFace, exact: true }).click();
    const facts = board.locator('.deduction-facts');
    for (const fact of definition.facts.slice(0, 2)) {
      const button = board.getByRole('button', { name: fact.text, exact: true });
      await (await turnToVisible(facts.locator('.measured-page'), button)).click();
    }
    await expect(board.locator('.deduction-selection-count')).toContainText('2/2');
    await page.keyboard.press('Escape');
    await expect(board).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test('reduced motion turns pages without the paper animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 844, height: 390 });
  await seedFull(page);
  await page.keyboard.press('j');
  const dialog = notebook(page);
  await dialog.getByRole('button', { name: strings.evidence, exact: true }).click();
  await openCard(dialog, definition.evidences[0]!.name);
  const decoration = dialog.locator('.page-turn-decoration').first();
  await expect(decoration).toHaveCSS('display', 'none');
  const pager = dialog.locator('.notebook-detail .page-controls span');
  const next = dialog.locator('.notebook-detail').getByRole('button', { name: /Trang sau/ });
  expect(await next.isEnabled()).toBe(true);
  const before = await pager.innerText();
  await next.click();
  await expect(pager).not.toHaveText(before, { timeout: 150 });
});

test('rapid page turns then closing leave no stuck input', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 844, height: 390 });
  await seedFull(page);
  await page.keyboard.press('j');
  const dialog = notebook(page);
  await dialog.getByRole('button', { name: strings.people, exact: true }).click();
  await openCard(dialog, definition.npcs[0]!.name);
  const next = dialog.locator('.notebook-detail').getByRole('button', { name: /Trang sau/ });
  for (let i = 0; i < 6 && (await next.isEnabled()); i += 1) await next.click({ delay: 0 });
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('.game-root > [tabindex="-1"]')).toBeFocused();
  await page.keyboard.press('j');
  await expect(notebook(page)).toBeVisible();
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]);
});

test('resizing while reading keeps the reading position', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await seedFull(page);
  await page.keyboard.press('j');
  const dialog = notebook(page);
  await dialog.getByRole('button', { name: strings.people, exact: true }).click();
  await openCard(dialog, definition.npcs[0]!.name);
  const scope = dialog.locator('.notebook-person .measured-page');
  const next = scope.getByRole('button', { name: /Trang sau/ });
  expect(await next.isEnabled()).toBe(true);
  await next.click();
  const anchor = await scope
    .locator('.page-viewport .page-fragment')
    .first()
    .evaluate((n) => ({
      id: n.getAttribute('data-block-id')!,
      start: Number(n.getAttribute('data-start')),
    }));
  await page.setViewportSize({ width: 1280, height: 720 });
  await expect
    .poll(async () =>
      scope
        .locator('.page-viewport .page-fragment')
        .evaluateAll(
          (nodes, a) =>
            nodes.some(
              (n) =>
                n.getAttribute('data-block-id') === a.id &&
                Number(n.getAttribute('data-start')) <= a.start &&
                a.start < Number(n.getAttribute('data-end')) + 1,
            ),
          anchor,
        ),
    )
    .toBe(true);
});

test('a missing evidence image does not break reading', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route(/\/assets\/.*evidence.*\.(png|webp|jpg)$/i, (route) => route.abort());
  await page.setViewportSize({ width: 760, height: 600 });
  await seedFull(page);
  await page.keyboard.press('j');
  const dialog = notebook(page);
  await dialog.getByRole('button', { name: strings.evidence, exact: true }).click();
  await openCard(dialog, definition.evidences[0]!.name);
  expect(
    normalizeText(await readAllPages(dialog.locator('.notebook-evidence-detail .measured-page'))),
  ).toContain(normalizeText(definition.evidences[0]!.description));
  await expectNoInvestigationScroll(page, dialog);
  await expect(page.locator('canvas')).toHaveCount(1);
  expect(errors).toEqual([]);
});
