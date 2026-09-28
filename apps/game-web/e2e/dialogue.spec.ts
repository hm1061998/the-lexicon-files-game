import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import type { CaseDefinition } from '@lexicon/shared-types';
import { createCaseState } from '../../../packages/game-core/src/case/createCaseState';
function content(path: string): unknown {
  return JSON.parse(
    readFileSync(
      new URL('../../../packages/game-content/cases/case-001/' + path, import.meta.url),
      'utf8',
    ),
  );
}
const definition = {
  ...(content('case.json') as object),
  scenes: [content('scenes/main_office.json')],
  ...(content('npcs.json') as object),
  ...(content('dialogues.json') as object),
  ...(content('objectives.json') as object),
  ...(content('facts.json') as object),
  ...(content('evidences.json') as object),
} as CaseDefinition;
type RecordSave = {
  schemaVersion: number;
  caseId: string;
  updatedAt: number;
  state: ReturnType<typeof createCaseState>;
};
async function openWorld(page: Page) {
  await page.goto('/');
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
}
async function saved(page: Page): Promise<RecordSave | undefined> {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open('lexicon-game-saves', 1);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    try {
      return await new Promise<RecordSave | undefined>((resolve, reject) => {
        const r = db.transaction('saves').objectStore('saves').get('case-001');
        r.onsuccess = () => resolve(r.result as RecordSave | undefined);
        r.onerror = () => reject(r.error);
      });
    } finally {
      db.close();
    }
  });
}
async function seed(page: Page, record: RecordSave) {
  await openWorld(page);
  await page.evaluate(async (record) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open('lexicon-game-saves', 1);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('saves', 'readwrite');
        tx.objectStore('saves').put(record, record.caseId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } finally {
      db.close();
    }
  }, record);
  await page.reload();
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
}
async function talk(page: Page, npc: string) {
  const asset = definition.scenes[0]!.assets.find((a) => a.id === npc)!;
  await page.evaluate(({ x, y }) => window.__lexiconDebug!.teleport(x + 50, y + 30), asset);
  await expect(page.getByText(asset.interaction!.prompt, { exact: true })).toBeVisible();
  await page.keyboard.press('e');
  await expect(page.getByRole('dialog')).toBeVisible();
}
function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}
test('three interviews complete the objective and survive reload with one canvas', async ({
  page,
}) => {
  test.setTimeout(60000);
  const errors = watchErrors(page);
  await openWorld(page);
  await page.locator('canvas').evaluate((c) => {
    c.dataset.marker = 'dialogue';
  });
  for (const npc of definition.npcs) {
    await talk(page, npc.id);
    const tree = definition.dialogues.find((t) => t.id === npc.dialogueTreeId)!;
    const entry = tree.nodes.find((n) => n.id === tree.entryNodeId)!;
    for (const i of [1, 2, 3]) {
      await page
        .getByRole('button', {
          name: entry.choices.find((c) => c.id === 'q' + i)!.text,
          exact: true,
        })
        .click();
      await page.getByRole('button', { name: 'Tiếp tục hỏi', exact: true }).click();
    }
    await page.keyboard.press('Escape');
  }
  await expect
    .poll(async () => (await saved(page))?.state.objectiveStatuses.talk_to_everyone)
    .toBe('completed');
  await expect(page.locator('canvas[data-marker="dialogue"]')).toHaveCount(1);
  await page.reload();
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect((await saved(page))?.state.flags).toMatchObject({
    anna_interviewed: true,
    leo_interviewed: true,
    david_interviewed: true,
  });
  expect(errors).toEqual([]);
});
for (const gate of [undefined, false, true])
  test(`David conditional branch with contradiction flag ${String(gate)}`, async ({ page }) => {
    const errors = watchErrors(page);
    const state = createCaseState(definition);
    const record = {
      schemaVersion: 2,
      caseId: definition.id,
      updatedAt: 42,
      state: { ...state, flags: gate === undefined ? {} : { david_contradiction_found: gate } },
    };
    await seed(page, record);
    await talk(page, 'david');
    const q = "Are you sure you didn't enter the room?";
    await page.getByRole('button', { name: q, exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText(
      gate ? '...I may have gone in for a moment.' : "Yes. I'm certain.",
    );
    await page.getByRole('button', { name: 'Tiếp tục hỏi', exact: true }).click();
    const challenge = page.getByRole('button', {
      name: 'But the security log shows that you entered at 8:32.',
      exact: true,
    });
    if (gate) {
      await challenge.click();
      await expect
        .poll(async () =>
          (await saved(page))?.state.discoveredFactIds.includes('david_collected_folder'),
        )
        .toBe(true);
      expect((await saved(page))?.state.discoveredFactIds).not.toContain('david_took_report');
      await page.getByRole('button', { name: 'Which folder?', exact: true }).click();
      await expect(page.getByRole('dialog')).toContainText(
        'I took it to correct it before anyone noticed.',
      );
      await expect
        .poll(async () =>
          (await saved(page))?.state.discoveredFactIds.includes('david_took_report'),
        )
        .toBe(true);
    } else {
      await expect(challenge).toHaveCount(0);
      expect((await saved(page))?.state.discoveredFactIds).not.toContain('david_took_report');
    }
    expect(errors).toEqual([]);
  });
test('legacy Phase 4 save migrates without losing evidence or objective progress', async ({
  page,
}) => {
  await seed(page, {
    schemaVersion: 1,
    caseId: definition.id,
    updatedAt: 42,
    state: {
      ...createCaseState(definition),
      objectiveStatuses: { find_what_happened: 'completed' },
      evidenceIds: ['meeting_minutes'],
      discoveredFactIds: ['meeting_started'],
      flags: {},
    },
  });
  await expect.poll(async () => (await saved(page))?.schemaVersion).toBe(2);
  await page.keyboard.press('j');
  await expect(page.getByText('Meeting Minutes', { exact: true })).toBeVisible();
  expect((await saved(page))?.state.objectiveStatuses).toEqual({
    find_what_happened: 'completed',
    talk_to_everyone: 'active',
  });
});
test('dialogue traps focus, blocks gameplay, restores focus and fits desktop viewports', async ({
  page,
}) => {
  const errors = watchErrors(page);
  await page.setViewportSize({ width: 1280, height: 720 });
  await openWorld(page);
  await talk(page, 'anna');
  await expect(page.locator('.dialogue-text')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Đóng', exact: true })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(
    page.getByRole('button', { name: 'Who was still in the room?', exact: true }),
  ).toBeFocused();
  const before = await page.evaluate(() => window.__lexiconDebug!.player());
  await page.keyboard.down('d');
  await page.waitForTimeout(300);
  await page.keyboard.up('d');
  await page.keyboard.press('j');
  await page.keyboard.press('e');
  expect(await page.evaluate(() => window.__lexiconDebug!.player())).toEqual(before);
  await expect(page.getByRole('dialog')).toHaveCount(1);
  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(viewport);
    const box = await page.locator('.dialogue-panel').boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
    await page.screenshot({
      path: `../../.superpowers/sdd/2026-09-28-phase-5-dialogue/dialogue-${viewport.width}.png`,
    });
  }
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('[tabindex="-1"][aria-label="Hồ sơ"]')).toBeFocused();
  const start = await page.evaluate(() => window.__lexiconDebug!.player());
  await page.keyboard.down('d');
  await page.waitForTimeout(300);
  await page.keyboard.up('d');
  expect((await page.evaluate(() => window.__lexiconDebug!.player())).x).toBeGreaterThan(start.x);
  expect(errors).toEqual([]);
});
test('closing an unread branch and reloading does not complete an interview', async ({ page }) => {
  await openWorld(page);
  await talk(page, 'david');
  await page.getByRole('button', { name: 'Where were you?', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect.poll(async () => (await saved(page))?.state.flags.david_statement_read).toBe(true);
  await page.reload();
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
  expect((await saved(page))?.state.flags.david_q1_read).toBeUndefined();
  expect((await saved(page))?.state.flags.david_interviewed).toBeUndefined();
});

test('physical double clicks cannot skip responses or select the next question', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await openWorld(page);
  await talk(page, 'anna');
  await page
    .getByRole('button', { name: 'Who was still in the room?', exact: true })
    .dblclick({ delay: 120 });
  await expect(page.getByRole('button', { name: 'Tiếp tục hỏi', exact: true })).toBeVisible();
  expect((await saved(page))?.state.flags.anna_q3_read).toBeUndefined();
  await page.getByRole('button', { name: 'Tiếp tục hỏi', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await saved(page))?.state.flags.anna_q3_read).toBe(true);

  await seed(page, {
    schemaVersion: 2,
    caseId: definition.id,
    updatedAt: 42,
    state: { ...createCaseState(definition), flags: { david_contradiction_found: true } },
  });
  await talk(page, 'david');
  await page
    .getByRole('button', {
      name: 'But the security log shows that you entered at 8:32.',
      exact: true,
    })
    .dblclick({ delay: 120 });
  const folder = page.getByRole('button', { name: 'Which folder?', exact: true });
  await expect(folder).toBeVisible();
  await expect
    .poll(async () =>
      (await saved(page))?.state.discoveredFactIds.includes('david_collected_folder'),
    )
    .toBe(true);
  expect((await saved(page))?.state.discoveredFactIds).not.toContain('david_took_report');
  await folder.focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('dialog')).toContainText(
    'I took it to correct it before anyone noticed.',
  );
});
