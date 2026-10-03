import { expect, type Page } from '@playwright/test';
import { definition, seedInvestigation, strings } from './investigationFixture';
import { createCaseState } from '../../../packages/game-core/src/case/createCaseState';
import type { Screen } from './shellScreens';

const allFlags = {
  david_confession_read: true,
  anna_q1_read: true,
  anna_q2_read: true,
  anna_q3_read: true,
  leo_q1_read: true,
  leo_q2_read: true,
  david_statement_read: true,
  david_q1_read: true,
  david_q2_read: true,
};

/** A full investigation: every evidence, fact and flag, vocabulary on, one timeline event placed. */
async function seedFull(page: Page): Promise<void> {
  await seedInvestigation(
    page,
    {
      flags: allFlags,
      objectiveStatuses: {
        ...createCaseState(definition).objectiveStatuses,
        submit_your_conclusion: 'active',
      },
      evidenceIds: definition.evidences.map((e) => e.id),
      discoveredFactIds: definition.facts.map((f) => f.id),
      timelineEventIds: ['report_missing_21_05'],
    },
    true,
  );
}

const notebookTab =
  (name: string): Screen['reach'] =>
  async (page) => {
    await seedFull(page);
    await page.keyboard.press('j');
    const dialog = page.getByRole('dialog', { name: strings.notebook, exact: true });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name, exact: true }).click();
  };

const boardFace =
  (name: string): Screen['reach'] =>
  async (page) => {
    await seedFull(page);
    await page.keyboard.press('b');
    const board = page.locator('.deduction-board');
    await expect(board).toBeVisible();
    await board.getByRole('button', { name, exact: true }).click();
  };

/** Notebook (J) tabs and deduction board (B) faces; seeded so none of them is empty. */
export const investigationScreens: readonly Screen[] = [
  { name: 'notebook-people', reach: notebookTab(strings.people) },
  { name: 'notebook-evidence', reach: notebookTab(strings.evidence) },
  { name: 'notebook-vocabulary', reach: notebookTab(strings.vocabulary) },
  { name: 'notebook-timeline', reach: notebookTab(strings.timeline) },
  { name: 'board-clues', reach: boardFace(strings.deductionCluesFace) },
  { name: 'board-timeline', reach: boardFace(strings.deductionTimelineFace) },
  { name: 'board-compare', reach: boardFace(strings.deductionCompareFace) },
  { name: 'board-conclusion', reach: boardFace(strings.deductionConclusionFace) },
];
