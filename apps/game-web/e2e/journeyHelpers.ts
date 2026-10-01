import { expect, type Page } from '@playwright/test';
import { scenePoint } from './sceneTestData';

type DebugApi = {
  player(): { x: number; y: number; depth: number };
  teleport(x: number, y: number): void;
  highlightBounds(): { x: number; y: number; width: number; height: number } | null;
};

export type SavedRecord = {
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

export async function openWorld(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
}

/** Hold E across a few frames: an instant keyup can clear JustDown before the scene reads it. */
export async function pressInteract(page: Page): Promise<void> {
  await page.keyboard.down('e');
  await page.waitForTimeout(120);
  await page.keyboard.up('e');
}

export async function interactAt(
  page: Page,
  x: number,
  y: number,
  prompt: string,
  sceneSwap = false,
): Promise<void> {
  await page.evaluate(({ x, y }) => window.__lexiconDebug!.teleport(x, y), { x, y });
  await expect(page.getByText(prompt, { exact: true })).toBeVisible();
  const previous = await page.evaluateHandle(() => window.__lexiconDebug);
  await pressInteract(page);
  // Scene transitions fade out first; wait until the new scene has installed its debug hook.
  if (sceneSwap) {
    await page.waitForFunction(
      (old) => window.__lexiconDebug !== undefined && window.__lexiconDebug !== old,
      previous,
    );
  }
}

export async function saved(page: Page): Promise<SavedRecord | undefined> {
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

export async function talkToDavid(page: Page): Promise<void> {
  await page.evaluate(
    ({ x, y }) => window.__lexiconDebug!.teleport(x, y),
    scenePoint('main_office', 'david', { u: 0.3, v: 0.6 }),
  );
  await expect(page.getByText('Nói chuyện với David', { exact: true })).toBeVisible();
  await page.locator('canvas').click({ position: { x: 400, y: 300 } });
  await pressInteract(page);
}
