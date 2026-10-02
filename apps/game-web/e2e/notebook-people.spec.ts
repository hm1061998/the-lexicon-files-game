import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Locator, type Page } from '@playwright/test';
import type { CaseDefinition, GameState, LanguageProfile, UiStrings } from '@lexicon/shared-types';
import { createCaseState } from '../../../packages/game-core/src/case/createCaseState';
import { interactAt, openWorld, reopenWorld, saved } from './journeyHelpers';
import { scenePoint } from './sceneTestData';
import {
  expectNoInvestigationScroll,
  normalizeText,
  readAllPages,
  readStatements,
  turnToVisible,
} from './investigationFixture';

test.setTimeout(90_000);
const personPages = (panel: Locator) => panel.locator('.notebook-person .measured-page');
function content(path: string): object {
  return JSON.parse(
    readFileSync(
      new URL('../../../packages/game-content/cases/case-001/' + path, import.meta.url),
      'utf8',
    ),
  ) as object;
}
const definition = {
  ...content('case.json'),
  ...content('npcs.json'),
  ...content('dialogues.json'),
  ...content('objectives.json'),
  ...content('facts.json'),
  ...content('evidences.json'),
  ...content('contradictions.json'),
  ...content('vocabulary.json'),
  scenes: [content('scenes/main_office.json')],
  listeningTasks: [],
} as CaseDefinition;
const strings = JSON.parse(
  readFileSync(new URL('../../../packages/game-content/ui/vi.json', import.meta.url), 'utf8'),
) as UiStrings;
const tree = (npcId: string) => definition.dialogues.find((item) => item.npcId === npcId)!;
const node = (npcId: string, nodeId: string) =>
  tree(npcId).nodes.find((item) => item.id === nodeId)!;

async function seed(page: Page, state: GameState): Promise<void> {
  // A same-origin document without app startup avoids autosave races with the fixture.
  await page.goto('/@vite/env');
  await page.evaluate(async (state) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('lexicon-game-saves', 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('saves');
        request.result.createObjectStore('backups', { autoIncrement: true });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction('saves', 'readwrite');
        transaction.objectStore('saves').put(
          {
            schemaVersion: 4,
            caseId: state.caseId,
            activeSceneId: 'main_office',
            state,
            updatedAt: Date.now(),
          },
          state.caseId,
        );
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } finally {
      db.close();
    }
  }, state);
  await openWorld(page);
}

async function profile(page: Page): Promise<LanguageProfile | undefined> {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('lexicon-learning', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise<LanguageProfile | undefined>((resolve, reject) => {
        const request = db.transaction('records').objectStore('records').get('local-profile');
        request.onsuccess = () =>
          resolve((request.result as { profile: LanguageProfile } | undefined)?.profile);
        request.onerror = () => reject(request.error);
      });
    } finally {
      db.close();
    }
  });
}

async function people(page: Page): Promise<Locator> {
  await page.keyboard.press('j');
  const panel = page.locator('.notebook-panel');
  await expect(panel).toBeVisible();
  await expect(
    panel.locator('.notebook-header').getByRole('button', { name: strings.close, exact: true }),
  ).toBeFocused();
  await panel.getByRole('button', { name: strings.people, exact: true }).click();
  return panel;
}
async function closePeople(page: Page): Promise<void> {
  await page
    .locator('.notebook-header')
    .getByRole('button', { name: strings.close, exact: true })
    .click();
  await expect(page.locator('.notebook-panel')).toHaveCount(0);
}
async function talk(page: Page, npcId: string): Promise<void> {
  const point = scenePoint('main_office', npcId, { u: 0.3, v: 0.6 });
  const asset = definition.scenes[0]!.assets.find(({ id }) => id === npcId)!;
  await interactAt(page, point.x, point.y, asset.interaction!.prompt);
  await expect(page.locator('.dialogue-panel')).toBeVisible();
}
async function ask(page: Page, npcId: string, choiceId: string): Promise<void> {
  const choice = node(npcId, 'entry').choices.find(({ id }) => id === choiceId)!;
  await page
    .locator('.dialogue-panel')
    .getByRole('button', { name: choice.text, exact: true })
    .click();
  await expect(page.locator('.dialogue-text')).toContainText(node(npcId, choice.nextNodeId).text);
  await page
    .locator('.dialogue-panel')
    .getByRole('button', { name: node(npcId, choice.nextNodeId).choices[0]!.text, exact: true })
    .click();
}
async function closeDialogue(page: Page): Promise<void> {
  await page
    .locator('.dialogue-panel')
    .getByRole('button', { name: strings.close, exact: true })
    .click();
}

test('records partial interview and survives reload', async ({ page }) => {
  await openWorld(page);
  await talk(page, 'anna');
  await closeDialogue(page);
  let panel = await people(page);
  await expect(panel).toContainText(strings.notebookEmptyPeople);
  await closePeople(page);
  await talk(page, 'anna');
  await ask(page, 'anna', 'q1');
  await closeDialogue(page);
  panel = await people(page);
  await expect(
    panel.getByRole('heading', { name: definition.npcs[0]!.name, exact: true }),
  ).toBeVisible();
  expect(await readStatements(personPages(panel))).toEqual(
    [node('anna', 'entry').text, node('anna', 'answer1').text].map(normalizeText),
  );
  await expect(panel).toContainText(strings.notebookInterviewInProgress);
  await expect.poll(async () => (await saved(page))?.state.flags.anna_q1_read).toBe(true);
  await reopenWorld(page);
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
  panel = await people(page);
  expect(await readStatements(personPages(panel))).toEqual(
    [node('anna', 'entry').text, node('anna', 'answer1').text].map(normalizeText),
  );
  await closePeople(page);
  await talk(page, 'anna');
  await ask(page, 'anna', 'q2');
  await ask(page, 'anna', 'q3');
  await closeDialogue(page);
  panel = await people(page);
  await expect(panel).toContainText(strings.notebookInterviewComplete);
  expect(await readStatements(personPages(panel))).toHaveLength(4);
  await expect(page.locator('canvas')).toHaveCount(1);
});

test('keeps branch history and legacy progress', async ({ page }) => {
  const state = {
    ...createCaseState(definition),
    evidenceIds: ['meeting_minutes'],
    discoveredFactIds: [
      'meeting_started',
      'david_statement_no_entry_after_20_00',
      'meeting_ended_20_45',
    ],
    flags: {
      david_statement_read: true,
      david_q1_read: true,
      david_q2_read: true,
      david_q3_read: true,
      david_interviewed: true,
      david_contradiction_found: true,
    },
  };
  await seed(page, state);
  const beforePeople = (await saved(page))!.state;
  let panel = await people(page);
  await expect(
    panel.getByRole('heading', { name: definition.npcs[2]!.name, exact: true }),
  ).toBeVisible();
  expect(await readStatements(personPages(panel))).toEqual(
    ['entry', 'answer1', 'answer2'].map((id) => normalizeText(node('david', id).text)),
  );
  await expect(panel).toContainText(strings.notebookInterviewComplete);
  const before = (await saved(page))!.state;
  expect(before).toEqual(beforePeople);
  expect(before.evidenceIds).toEqual(state.evidenceIds);
  expect(before.discoveredFactIds).toEqual(state.discoveredFactIds);
  expect(before.flags.david_interviewed).toBe(true);
  await closePeople(page);
  await talk(page, 'david');
  await ask(page, 'david', 'q3_unlocked');
  await closeDialogue(page);
  panel = await people(page);
  await expect(panel).toContainText(node('david', 'answer3_unlocked').text);
  await expect(panel).not.toContainText(node('david', 'answer3').text);
  await expect(panel).not.toContainText(node('david', 'collect_folder').text);
  await expect(panel).not.toContainText(node('david', 'confession').text);
  await expect
    .poll(async () => (await saved(page))?.state.flags.david_answer3_unlocked_recorded)
    .toBe(true);
  const after = (await saved(page))!.state;
  expect(after.evidenceIds).toEqual(before.evidenceIds);
  expect(after.discoveredFactIds).toEqual(before.discoveredFactIds);
  expect(after.objectiveStatuses).toEqual(before.objectiveStatuses);
  await seed(page, { ...state, flags: { ...state.flags, david_answer3_recorded: true } });
  panel = await people(page);
  await expect(panel).toContainText(node('david', 'answer3').text);
  await expect(panel).not.toContainText(node('david', 'answer3_unlocked').text);
  await seed(page, {
    ...state,
    flags: { ...state.flags, david_answer3_recorded: true, david_answer3_unlocked_recorded: true },
  });
  panel = await people(page);
  expect(await readStatements(personPages(panel))).toEqual(
    ['entry', 'answer1', 'answer2', 'answer3', 'answer3_unlocked'].map((id) =>
      normalizeText(node('david', id).text),
    ),
  );
  await expect(panel).not.toContainText(node('david', 'collect_folder').text);
  await expect(panel).not.toContainText(node('david', 'confession').text);
});

test('reuses vocabulary context without encounter inflation', async ({ page }) => {
  await openWorld(page);
  await talk(page, 'anna');
  await ask(page, 'anna', 'q1');
  await closeDialogue(page);
  const encounterSnapshot = async () =>
    Object.fromEntries(
      Object.entries((await profile(page))?.vocabulary ?? {}).map(([id, item]) => [
        id,
        { count: item.encounterCount, contexts: item.contextsSeen },
      ]),
    );
  await expect
    .poll(async () => Object.keys((await profile(page))?.vocabulary ?? {}).sort())
    .toEqual(['client', 'early', 'leave', 'meeting']);
  const initial = await encounterSnapshot();
  expect(initial.leave).toEqual({ count: 1, contexts: ['dialogue:anna_initial:entry:text'] });
  for (let i = 0; i < 2; i++) {
    await people(page);
    await closePeople(page);
  }
  await reopenWorld(page);
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
  let panel = await people(page);
  expect(await encounterSnapshot()).toEqual(initial);
  const word = await turnToVisible(
    personPages(panel),
    panel.getByRole('button', { name: /left\. Xem nghĩa từ/ }),
  );
  await word.click();
  await expect(panel.getByRole('dialog', { name: 'leave', exact: true })).toBeFocused();
  await panel.getByRole('button', { name: strings.revealTranslation, exact: true }).click();
  await expect(panel.getByRole('dialog', { name: 'leave', exact: true })).toContainText('rời đi');
  await expect.poll(async () => (await profile(page))?.assistance.translations).toBe(1);
  await page.keyboard.press('Escape');
  await expect(word).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(panel.getByRole('dialog', { name: 'leave', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  expect(await encounterSnapshot()).toEqual(initial);
  for (const mode of ['Beginner', 'Immersion', 'Learning']) {
    await closePeople(page);
    await page.keyboard.press('Escape');
    await page.getByLabel(strings.vocabularyMode).selectOption(mode);
    await page
      .locator('.pause-menu')
      .getByRole('button', { name: strings.resume, exact: true })
      .click();
    panel = await people(page);
    await expect(panel.getByLabel(strings.vocabularyMode)).toHaveCount(0);
    const pagesText = normalizeText(await readAllPages(personPages(panel)));
    const entryTranslation = normalizeText(node('anna', 'entry').translationVi!);
    if (mode === 'Beginner') expect(pagesText).toContain(entryTranslation);
    else expect(pagesText).not.toContain(entryTranslation);
    expect(await encounterSnapshot()).toEqual(initial);
  }
});

async function stableFocus(page: Page, panel: Locator): Promise<void> {
  expect(
    await page.evaluate(() => ({
      y: window.scrollY,
      x: window.scrollX,
      root: document.querySelector('.game-root')!.scrollTop,
    })),
  ).toEqual({ y: 0, x: 0, root: 0 });
  const focusInfo = await panel.evaluate((element) => {
    const focus = document.activeElement!;
    const rect = focus.getBoundingClientRect();
    const panelRect = element.getBoundingClientRect();
    return {
      active: focus.outerHTML.slice(0, 250),
      contains: element.contains(focus),
      topInside: rect.top >= panelRect.top + element.clientTop,
      bottomInside: rect.bottom <= panelRect.top + element.clientTop + element.clientHeight,
      leftInside: rect.left >= panelRect.left,
      rightInside: rect.right <= panelRect.right,
      viewportInside: rect.top >= 0 && rect.bottom <= innerHeight,
      focusRect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right },
      panelRect: {
        top: panelRect.top,
        bottom: panelRect.bottom,
        left: panelRect.left,
        right: panelRect.right,
      },
    };
  });
  expect(focusInfo, JSON.stringify(focusInfo)).toMatchObject({
    contains: true,
    topInside: true,
    bottomInside: true,
    leftInside: true,
    rightInside: true,
    viewportInside: true,
  });
}

for (const viewport of [
  { width: 1280, height: 720 },
  { width: 760, height: 600 },
]) {
  test(`keeps focus and four tabs visible ${viewport.width}`, async ({ page }) => {
    // Native Tab/Shift+Tab traversal of every control with a focus-bounds check each step is slow.
    test.setTimeout(180_000);
    await page.setViewportSize(viewport);
    const initial = createCaseState(definition);
    const flags = {
      anna_q1_read: true,
      anna_q2_read: true,
      anna_q3_read: true,
      anna_interviewed: true,
      leo_q1_read: true,
      leo_q2_read: true,
      leo_q3_read: true,
      leo_interviewed: true,
      david_statement_read: true,
      david_q1_read: true,
      david_q2_read: true,
      david_interviewed: true,
      david_answer3_recorded: true,
      david_answer3_unlocked_recorded: true,
      david_folder_statement_read: true,
      david_confession_read: true,
      david_contradiction_found: true,
    };
    await seed(page, {
      ...initial,
      flags,
      objectiveStatuses: { ...initial.objectiveStatuses, submit_your_conclusion: 'active' },
    });
    const panel = await people(page);
    await expect(panel.locator('.notebook-tabs button')).toHaveCount(4);
    await expect(panel.locator('.notebook-person')).toHaveCount(1);
    await page.screenshot({
      path: fileURLToPath(
        new URL(
          `../../../docs/ai/playtests/2026-10-02-investigation-pagination/people-${viewport.width}.png`,
          import.meta.url,
        ),
      ),
    });
    await expectNoInvestigationScroll(
      page,
      page.getByRole('dialog', { name: strings.notebook, exact: true }),
    );
    const close = panel
      .locator('.notebook-header')
      .getByRole('button', { name: strings.close, exact: true });
    await close.focus();
    let scrolled = false;
    let openedWord = false;
    const forward = new Set<string>();
    const backward = new Set<string>();
    // Hidden measurement copies also contain buttons; only visible controls are tab stops.
    const steps = await panel.locator('button:visible').count();
    for (const [key, visited] of [
      ['Tab', forward],
      ['Shift+Tab', backward],
    ] as const) {
      for (let i = 0; i <= steps; i++) {
        await page.keyboard.press(key);
        await stableFocus(page, panel);
        const focus = page.locator(':focus');
        visited.add((await focus.getAttribute('aria-label')) ?? (await focus.innerText()));
        scrolled ||= (await panel.locator('.notebook-content').evaluate((el) => el.scrollTop)) > 0;
        if (
          !openedWord &&
          (await focus.evaluate((el) => el.classList.contains('vocabulary-word')))
        ) {
          await page.keyboard.press('Enter');
          await expect(panel.locator('.vocabulary-popover')).toBeVisible();
          await stableFocus(page, panel);
          await page.keyboard.press('Escape');
          await stableFocus(page, panel);
          openedWord = true;
        }
      }
    }
    for (const label of [
      strings.people,
      strings.evidence,
      strings.vocabulary,
      strings.timeline,
      strings.openDeductionBoard,
      strings.close,
    ]) {
      expect(forward.has(label)).toBe(true);
      expect(backward.has(label)).toBe(true);
    }
    expect(scrolled).toBe(false);
    expect(openedWord).toBe(true);
    await panel.getByRole('button', { name: strings.openDeductionBoard, exact: true }).click();
    const board = page.locator('.deduction-board');
    await board.getByRole('button', { name: strings.deductionConclusionFace, exact: true }).click();
    await expect(
      board.getByRole('button', { name: strings.conclusionSubmit, exact: true }),
    ).toBeVisible();
    const conclusionSteps = await board.locator('button:enabled:visible').count();
    for (let i = 0; i <= conclusionSteps; i++) {
      await page.keyboard.press('Tab');
      await stableFocus(page, board);
    }
    await board.getByRole('button', { name: strings.openNotebookFromBoard, exact: true }).click();
    await panel.getByRole('button', { name: strings.people, exact: true }).click();
    await closePeople(page);
    await people(page);
    // Native traversal returns to Close; Enter uses the real control.
    for (
      let i = 0;
      i <= steps && !(await close.evaluate((el) => el === document.activeElement));
      i++
    ) {
      await page.keyboard.press('Shift+Tab');
      await stableFocus(page, panel);
    }
    await expect(close).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(panel).toHaveCount(0);
    await expect(page.locator('.game-root > [tabindex="-1"]')).toBeFocused();
    await expect(page.locator('canvas')).toHaveCount(1);
  });
}
