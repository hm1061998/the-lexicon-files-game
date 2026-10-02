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

export type OpenWorldOptions = {
  /** `auto` continues a saved case, otherwise starts one; `new` always starts a new case. */
  mode?: 'auto' | 'new' | 'continue';
  /** `seen` pre-dismisses the coach notes so they never cover the UI under test. */
  coach?: 'seen' | 'fresh';
};

const LEARNING_RECORD_KEY = 'local-profile';

/** Writes an all-seen V3 learning record only when none exists, on a page that does not boot the app. */
export async function seedOnboardingSeen(page: Page): Promise<void> {
  // The app has no favicon; a seed page must not add a console 404 that boot checks would see.
  await page.route('**/favicon.ico', (route) => route.fulfill({ status: 204 }));
  await page.goto('/@vite/env');
  await page.evaluate(async (key) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('lexicon-learning', 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('records');
        request.result.createObjectStore('backups', { autoIncrement: true });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('records', 'readwrite');
        const store = tx.objectStore('records');
        const existing = store.get(key);
        existing.onsuccess = () => {
          if (existing.result !== undefined) return;
          store.put(
            {
              schemaVersion: 3,
              profile: {
                cefrEstimate: 'A1',
                vocabulary: {},
                grammar: {},
                skills: { vocabulary: 0, grammar: 0, reading: 0, listening: 0, communication: 0 },
                assistance: { translations: 0, hints: 0, transcriptOpens: 0, audioReplays: 0 },
                listening: {
                  subtitleUses: 0,
                  correctAnswers: 0,
                  incorrectAnswers: 0,
                  totalTimeToExtractFactMs: 0,
                  timedFacts: 0,
                },
              },
              vocabularyTutorialSeen: false,
              onboardingSeen: { move: true, interact: true, notebook: true, board: true },
              updatedAt: Date.now(),
            },
            key,
          );
        };
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } finally {
      db.close();
    }
  }, LEARNING_RECORD_KEY);
}

/**
 * Enters the world through the real title flow: Continue when a save exists, otherwise a new
 * case (default support level, confirmation and briefing are accepted when they appear).
 */
export async function openWorld(page: Page, options: OpenWorldOptions = {}): Promise<void> {
  const { coach = 'seen' } = options;
  if (coach === 'seen') await seedOnboardingSeen(page);
  await page.goto('/');
  await passTitle(page, options);
}

/** Reloads the page and walks back through the title flow (Continue when a save exists). */
export async function reopenWorld(page: Page, options: OpenWorldOptions = {}): Promise<void> {
  await page.reload();
  await passTitle(page, options);
}

async function passTitle(page: Page, options: OpenWorldOptions): Promise<void> {
  const { mode = 'auto' } = options;
  const ready = () => page.evaluate(() => window.__lexiconDebug !== undefined);
  const continueButton = page.getByRole('button', { name: 'Tiếp tục điều tra' });
  const newCaseButton = page.getByRole('button', { name: 'Vụ án mới', exact: true });
  await expect(continueButton.or(newCaseButton).first()).toBeVisible();
  if (mode !== 'new' && (await continueButton.isVisible())) {
    await continueButton.click();
  } else if (mode === 'continue') {
    throw new Error('openWorld(continue): there is no saved case to continue');
  } else {
    await newCaseButton.click();
    const defaultSupport = page.getByRole('button', { name: 'Dùng mặc định' });
    const confirm = page.getByRole('button', { name: 'Bắt đầu lại', exact: true });
    await expect(defaultSupport.or(confirm).or(page.locator('canvas')).first()).toBeVisible();
    if (await confirm.isVisible()) {
      await confirm.click();
      await expect(defaultSupport.or(page.locator('canvas')).first()).toBeVisible();
    }
    if (await defaultSupport.isVisible()) await defaultSupport.click();
  }
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
  const accept = page.getByRole('button', { name: 'Nhận hồ sơ' });
  if (await accept.isVisible()) await accept.click();
  await expect(accept).toBeHidden();
  expect(await ready()).toBe(true);
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
