import { readFileSync } from 'node:fs';
import { expect, type Locator, type Page } from '@playwright/test';
import type { CaseDefinition, GameState, UiStrings } from '@lexicon/shared-types';
import { createCaseState } from '../../../packages/game-core/src/case/createCaseState';
import { createInitialLanguageProfile } from '../../../packages/learning-engine/src/vocabulary/learningReducer';
import { openWorld } from './journeyHelpers';
const content = (file: string) =>
  JSON.parse(
    readFileSync(
      new URL('../../../packages/game-content/cases/case-001/' + file, import.meta.url),
      'utf8',
    ),
  ) as object;
export const definition = {
  ...content('case.json'),
  ...content('objectives.json'),
  ...content('facts.json'),
  ...content('npcs.json'),
  ...content('dialogues.json'),
  ...content('evidences.json'),
  ...content('contradictions.json'),
  ...content('vocabulary.json'),
  scenes: [content('scenes/main_office.json')],
  listeningTasks: [],
} as CaseDefinition;
export const strings = JSON.parse(
  readFileSync(new URL('../../../packages/game-content/ui/vi.json', import.meta.url), 'utf8'),
) as UiStrings;
export async function seedInvestigation(
  page: Page,
  patch: Partial<GameState> = {},
  withVocabulary = false,
): Promise<void> {
  const state = { ...createCaseState(definition), ...patch };
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
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('saves', 'readwrite');
      tx.objectStore('saves').put(
        {
          schemaVersion: 4,
          caseId: state.caseId,
          activeSceneId: 'main_office',
          state,
          updatedAt: Date.now(),
        },
        state.caseId,
      );
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, state);
  if (withVocabulary) {
    const profile = createInitialLanguageProfile();
    for (const word of definition.vocabulary.slice(0, 4)) {
      const evidence = definition.evidences.find((e) =>
        e.vocabularySpans?.some((s) => s.vocabularyId === word.id),
      );
      const tree = definition.dialogues.find((t) =>
        t.nodes.some((n) => n.vocabularySpans?.some((s) => s.vocabularyId === word.id)),
      );
      const node = tree?.nodes.find((n) =>
        n.vocabularySpans?.some((s) => s.vocabularyId === word.id),
      );
      const context = evidence
        ? `evidence:${evidence.id}:description`
        : tree && node
          ? `dialogue:${tree.id}:${node.id}:text`
          : undefined;
      if (!context) continue;
      profile.vocabulary[word.id] = {
        vocabularyId: word.id,
        stage: 'seen',
        encounterCount: 1,
        correctRecognitionCount: 0,
        incorrectRecognitionCount: 0,
        lastSeenAt: '2026-10-01T00:00:00Z',
        contextsSeen: [context],
      };
    }
    await page.evaluate(async (profile) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('lexicon-learning', 1);
        request.onupgradeneeded = () => {
          request.result.createObjectStore('records');
          request.result.createObjectStore('backups', { autoIncrement: true });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('records', 'readwrite');
        tx.objectStore('records').put(
          { schemaVersion: 2, profile, vocabularyTutorialSeen: true, updatedAt: Date.now() },
          'local-profile',
        );
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    }, profile);
  }
  await openWorld(page);
}

/** Wheel/scroll never moves anything inside the dialog and no visible page content leaves its frame. */
export async function expectNoInvestigationScroll(page: Page, dialog: Locator): Promise<void> {
  const offsets = () =>
    dialog.evaluate((el) =>
      Array.from(el.querySelectorAll('*')).map((n) => ({ top: n.scrollTop, left: n.scrollLeft })),
    );
  const before = await offsets();
  await dialog.hover();
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(100);
  expect(await offsets()).toEqual(before);
  const overflow = await dialog.evaluate((el) => {
    const frame = el.getBoundingClientRect();
    return Array.from(
      el.querySelectorAll<HTMLElement>(
        '.page-viewport .page-fragment,button,.page-controls button',
      ),
    )
      .filter((n) => n.getClientRects().length && !n.closest('.page-measurement'))
      .map((n) => ({ box: n.getBoundingClientRect(), text: n.textContent }))
      .filter(
        ({ box }) =>
          box.bottom > frame.bottom + 1 ||
          box.right > frame.right + 1 ||
          box.top < frame.top - 1 ||
          box.left < frame.left - 1,
      )
      .map(({ text }) => text);
  });
  expect(overflow).toEqual([]);
  // Measured pages must really fit: no fragment may run past the bottom of its own page.
  const spill = await dialog.evaluate((el) =>
    Array.from(el.querySelectorAll<HTMLElement>('.page-viewport'))
      .filter((v) => v.getClientRects().length && !v.closest('.page-measurement'))
      .flatMap((v) => {
        const page = v.getBoundingClientRect();
        return Array.from(v.querySelectorAll<HTMLElement>('.page-fragment'))
          .filter((n) => n.getBoundingClientRect().bottom > page.bottom + 1)
          .map((n) => n.textContent?.slice(0, 40) ?? '');
      }),
  );
  expect(spill).toEqual([]);
}

/** Reads every page of one `.measured-page` from the first to the last, then returns to the first. */
export async function readAllPages(scope: Locator): Promise<string> {
  const previous = scope.getByRole('button', { name: /Trang trước/ });
  const next = scope.getByRole('button', { name: /Trang sau/ });
  for (let i = 0; i < 40 && (await previous.isEnabled()); i += 1) await previous.click();
  const pages: string[] = [];
  for (let i = 0; i < 40; i += 1) {
    pages.push(await scope.locator('.page-viewport').innerText());
    if (!(await next.isEnabled())) break;
    await next.click();
  }
  for (let i = 0; i < 40 && (await previous.isEnabled()); i += 1) await previous.click();
  return pages.join(' ');
}

/** Rewinds one `.measured-page` to its first page, then turns forward until `target` is on screen. */
export async function turnToVisible(scope: Locator, target: Locator): Promise<Locator> {
  const previous = scope.getByRole('button', { name: /Trang trước/ });
  const next = scope.getByRole('button', { name: /Trang sau/ });
  if (!(await target.isVisible()))
    for (
      let i = 0;
      i < 40 && (await previous.count()) && (await previous.first().isEnabled());
      i += 1
    )
      await previous.first().click();
  for (let i = 0; i < 40; i += 1) {
    if (await target.isVisible()) return target;
    if (!(await next.count()) || !(await next.first().isEnabled())) break;
    await next.first().click();
  }
  await expect(target).toBeVisible();
  return target;
}

const normalize = (text: string) => text.replace(/\s+/g, ' ').trim();
export { normalize as normalizeText };

/** Recorded statements of one person, in order, merged across page fragments and pages. */
export async function readStatements(scope: Locator): Promise<string[]> {
  const previous = scope.getByRole('button', { name: /Trang trước/ });
  const next = scope.getByRole('button', { name: /Trang sau/ });
  for (let i = 0; i < 40 && (await previous.isEnabled()); i += 1) await previous.click();
  const parts = new Map<string, string[]>();
  for (let i = 0; i < 40; i += 1) {
    const found = await scope
      .locator('.page-viewport .page-fragment[data-block-id*=":statement:"]')
      .evaluateAll((nodes) =>
        nodes.map((n) => ({ id: n.getAttribute('data-block-id')!, text: n.textContent ?? '' })),
      );
    for (const { id, text } of found) parts.set(id, [...(parts.get(id) ?? []), text]);
    if (!(await next.isEnabled())) break;
    await next.click();
  }
  for (let i = 0; i < 40 && (await previous.isEnabled()); i += 1) await previous.click();
  return [...parts.values()].map((chunks) => normalize(chunks.join(' ')));
}
