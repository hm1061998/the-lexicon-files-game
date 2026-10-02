import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
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
