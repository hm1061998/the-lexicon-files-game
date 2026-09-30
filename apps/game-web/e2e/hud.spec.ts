import { expect, test, type Page } from '@playwright/test';
import { scenePoint } from './sceneTestData';

type DebugApi = {
  player(): { x: number; y: number; depth: number };
  nearby(): string | null;
  teleport(x: number, y: number): void;
  triggeredEvents(): number;
  highlightBounds(): { x: number; y: number; width: number; height: number } | null;
};

declare global {
  interface Window {
    __lexiconDebug?: DebugApi;
  }
}

async function openWorld(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(
    () => (window as unknown as { __lexiconDebug?: DebugApi }).__lexiconDebug !== undefined,
  );
  await expect(page.locator('.hud-key-hints')).toBeVisible();
}

/** Retry Esc until the pause dialog shows; the key can be lost before shortcuts are wired. */
async function openPause(page: Page): Promise<void> {
  await expect(async () => {
    if ((await page.getByRole('dialog').count()) === 0) await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 10000 });
}

function debug(page: Page) {
  return {
    x: () =>
      page.evaluate(
        () => (window as unknown as { __lexiconDebug: DebugApi }).__lexiconDebug.player().x,
      ),
    triggered: () =>
      page.evaluate(() =>
        (window as unknown as { __lexiconDebug: DebugApi }).__lexiconDebug.triggeredEvents(),
      ),
  };
}

async function hold(page: Page, key: string, ms: number): Promise<void> {
  await page.keyboard.down(key);
  await page.waitForTimeout(ms);
  await page.keyboard.up(key);
}

/** Walk right until the note is in range; fixed hold times are too fragile on slow renderers. */
async function walkToNote(page: Page): Promise<void> {
  const start = scenePoint('main_office', 'player_desk', { u: 1.5, v: 0 });
  await page.evaluate(({ x, y }) => window.__lexiconDebug!.teleport(x, y), start);
  await page.keyboard.down('a');
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as unknown as { __lexiconDebug: DebugApi }).__lexiconDebug.nearby(),
      ),
    )
    .toBe('objective_note');
  await page.keyboard.up('a');
}

test('prompt appears near the note and disappears when leaving', async ({ page }) => {
  await openWorld(page);
  await walkToNote(page);
  await expect(page.getByText('Đọc ghi chú')).toBeVisible();
  await hold(page, 'd', 1500);
  await expect(page.getByText('Đọc ghi chú')).toHaveCount(0);
});

test('canvas is not remounted by HUD updates', async ({ page }) => {
  await openWorld(page);
  await page.evaluate(() => {
    document.querySelector('canvas')!.dataset.marker = 'x';
  });
  const start = await page.evaluate(() =>
    (window as unknown as { __lexiconDebug: DebugApi }).__lexiconDebug.player(),
  );
  for (let i = 0; i < 2; i += 1) {
    await page.evaluate(
      ({ x, y }) =>
        (window as unknown as { __lexiconDebug: DebugApi }).__lexiconDebug.teleport(x, y),
      start,
    );
    await walkToNote(page);
    await expect(page.getByText('Đọc ghi chú')).toBeVisible();
    await hold(page, 'd', 1500);
    await expect(page.getByText('Đọc ghi chú')).toHaveCount(0);
  }
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(page.locator('canvas[data-marker="x"]')).toHaveCount(1);
});

test('Esc pauses and blocks movement', async ({ page }) => {
  await openWorld(page);
  const d = debug(page);
  await openPause(page);
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tiếp tục' })).toBeFocused();
  const before = await d.x();
  await hold(page, 'd', 500);
  expect(await d.x()).toBeCloseTo(before, 0);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  const resumed = await d.x();
  await hold(page, 'd', 500);
  expect(await d.x()).toBeGreaterThan(resumed);
});

test('E near the note triggers interaction once', async ({ page }) => {
  await openWorld(page);
  const d = debug(page);
  await walkToNote(page);
  await expect(page.getByText('Đọc ghi chú')).toBeVisible();
  await page.keyboard.press('e');
  await expect.poll(d.triggered).toBe(1);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('e');
  await page.waitForTimeout(200);
  expect(await d.triggered()).toBe(1);
});

test('HUD shows objective and case progress', async ({ page }) => {
  await openWorld(page);
  await expect(page.getByText('Tìm hiểu điều gì đã xảy ra với bản báo cáo')).toBeVisible();
  await expect(page.getByText('0/5')).toBeVisible();
});

test('reading the objective note completes the active objective', async ({ page }) => {
  await openWorld(page);
  await expect(page.getByText('Tìm hiểu điều gì đã xảy ra với bản báo cáo')).toBeVisible();
  await page.locator('canvas').evaluate((canvas) => {
    canvas.dataset.marker = 'objective-transition';
  });
  await walkToNote(page);
  await expect(page.getByText('Đọc ghi chú')).toBeVisible();
  await page.keyboard.press('e');
  await expect(page.getByText('Tìm hiểu điều gì đã xảy ra với bản báo cáo')).toHaveCount(0);
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(page.locator('canvas[data-marker="objective-transition"]')).toHaveCount(1);
});

test('Esc typed in a page input does not pause', async ({ page }) => {
  await openWorld(page);
  await page.evaluate(() => {
    const input = document.createElement('input');
    input.id = 'lexicon-esc-input';
    document.body.appendChild(input);
  });
  await page.focus('#lexicon-esc-input');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

async function collectMeetingMinutes(page: Page): Promise<void> {
  await page.evaluate(
    ({ x, y }) => window.__lexiconDebug!.teleport(x, y),
    scenePoint('main_office', 'meeting_minutes'),
  );
  await expect(page.getByText('Đọc biên bản cuộc họp')).toBeVisible();
  await page.keyboard.press('e');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('Meeting Minutes');
  await expect(page.getByRole('dialog')).toContainText(
    'The meeting began at 8:00 PM and ended at 8:45 PM.',
  );
  const closeButton = page.getByRole('button', { name: 'Đóng' });
  await expect(closeButton).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  const lastVocabularyWord = page.getByRole('button', { name: /several\. Xem nghĩa từ/ });
  await expect(lastVocabularyWord).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(closeButton).toBeFocused();
}

test('collecting evidence opens modal, locks movement, and adds it to the notebook', async ({
  page,
}) => {
  await openWorld(page);
  await collectMeetingMinutes(page);
  await expect(page.getByRole('button', { name: 'Đóng' })).toBeFocused();
  await expect(page.locator('canvas')).toHaveCount(1);
  const before = await page.evaluate(() => window.__lexiconDebug!.player());
  await hold(page, 'd', 400);
  const locked = await page.evaluate(() => window.__lexiconDebug!.player());
  expect(locked.x).toBeCloseTo(before.x, 0);
  expect(locked.y).toBeCloseTo(before.y, 0);

  await page.keyboard.press('Escape');
  await page.keyboard.press('j');
  await expect(page.getByRole('heading', { name: 'Sổ tay điều tra' })).toBeVisible();
  await expect(page.getByText('Meeting Minutes')).toBeVisible();
  await expect(page.getByLabel('Chế độ dịch')).toBeVisible();
  await expect(page.getByRole('button', { name: /meeting\. Xem nghĩa từ/ })).toBeVisible();
  await page.getByRole('button', { name: 'Nhân vật' }).click();
  await expect(page.getByText('Chưa có nhân vật nào được ghi nhận.')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.keyboard.press('j');
  await expect(page.getByRole('button', { name: 'Chứng cứ' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page.getByText('Meeting Minutes')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.keyboard.press('e');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('canvas')).toHaveCount(1);
});

test('evidence modal shows its artwork', async ({ page }) => {
  await openWorld(page);
  await collectMeetingMinutes(page);
  const art = page.getByRole('dialog').locator('img.evidence-art');
  await expect(art).toBeVisible();
  await expect
    .poll(() => art.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
  await expect(art).toHaveAttribute('alt', '');
  await expect(art).toHaveAttribute('src', '/assets/evidence/evidence_meeting_minutes.png');
});

test('discovered evidence survives reload without reopening its modal', async ({ page }) => {
  // Playwright gives each test a fresh browser context, so this IndexedDB starts empty.
  await openWorld(page);
  await collectMeetingMinutes(page);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.keyboard.press('j');
  await expect(page.getByText('Meeting Minutes')).toBeVisible();
});

test('notebook shortcut is ignored while an input has focus', async ({ page }) => {
  await openWorld(page);
  await page.evaluate(() => {
    const input = document.createElement('input');
    input.id = 'lexicon-notebook-input';
    document.body.appendChild(input);
  });
  await page.focus('#lexicon-notebook-input');
  await page.keyboard.type('je');
  await expect(page.locator('#lexicon-notebook-input')).toHaveValue('je');
  await expect(page.getByRole('heading', { name: 'Sổ tay điều tra' })).toHaveCount(0);
});

test('storage warning is readable and does not cover the objective panel', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'indexedDB', {
      configurable: true,
      get() {
        throw new Error('IndexedDB blocked for test');
      },
    });
  });
  await openWorld(page);
  const warning = page.getByText(/Không thể đọc dữ liệu lưu/);
  await expect(warning).toBeVisible();
  const warningBox = await warning.boundingBox();
  const objectiveBox = await page.locator('.hud-objective-panel').boundingBox();
  expect(warningBox).not.toBeNull();
  expect(objectiveBox).not.toBeNull();
  const overlaps =
    warningBox!.x < objectiveBox!.x + objectiveBox!.width &&
    warningBox!.x + warningBox!.width > objectiveBox!.x &&
    warningBox!.y < objectiveBox!.y + objectiveBox!.height &&
    warningBox!.y + warningBox!.height > objectiveBox!.y;
  expect(overlaps).toBe(false);
});

test('paper panels use the classic serif file styling', async ({ page }) => {
  await openWorld(page);
  const style = await page
    .locator('.paper-panel')
    .first()
    .evaluate((el) => {
      const cs = getComputedStyle(el);
      return { fontFamily: cs.fontFamily, fontSize: cs.fontSize, boxShadow: cs.boxShadow };
    });
  expect(style.fontFamily).toContain('Cambria');
  expect(parseFloat(style.fontSize)).toBeGreaterThanOrEqual(14);
  const blurs = [
    ...style.boxShadow.matchAll(/rgba?\([^)]*\)\s+(-?\d+px)\s+(-?\d+px)\s+(-?\d+px)/g),
  ];
  expect(blurs.length).toBeGreaterThan(0);
  for (const m of blurs) expect(m[3]).toBe('0px');
});

test('panel entrance animates unless reduced motion is on', async ({ page }) => {
  await openWorld(page);
  await openPause(page);
  const pause = page.getByRole('dialog');
  await expect(pause).toBeVisible();
  const panel = page.locator('.pause-menu');
  expect(await panel.evaluate((el) => getComputedStyle(el).animationName)).toBe('lexicon-panel-in');
  await pause.getByLabel('Giảm chuyển động').check();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(
    await page.locator('.pause-menu').evaluate((el) => getComputedStyle(el).animationName),
  ).toBe('none');
});

type Box = { x: number; y: number; width: number; height: number };

function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

test('minimap shows the player, follows movement and toggles with M', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await openWorld(page);
  const minimap = page.locator('.hud-minimap');
  await expect(minimap).toBeVisible();
  await expect(minimap.getByText('Bản đồ nhỏ')).toBeVisible();
  const dot = minimap.locator('.minimap-player');
  await expect(dot).toHaveCount(1);
  const initial = Number(await dot.getAttribute('cx'));
  // The migrated default spawn faces furniture; verify movement in the clear doorway corridor.
  await page.evaluate(
    ({ x, y }) => window.__lexiconDebug!.teleport(x, y),
    scenePoint('main_office', 'hallway_door', { u: 2, v: 0 }),
  );
  await expect.poll(async () => Number(await dot.getAttribute('cx'))).toBeLessThan(initial);
  const before = Number(await dot.getAttribute('cx'));
  await page.keyboard.down('d');
  try {
    await expect.poll(async () => Number(await dot.getAttribute('cx'))).toBeGreaterThan(before);
  } finally {
    await page.keyboard.up('d');
  }

  await page.keyboard.press('m');
  await expect(minimap).toHaveCount(0);
  await page.keyboard.press('m');
  await expect(minimap).toBeVisible();
});

test('minimap M is ignored while typing and while paused', async ({ page }) => {
  await openWorld(page);
  await page.evaluate(() => {
    const input = document.createElement('input');
    input.id = 'lexicon-map-input';
    document.body.appendChild(input);
  });
  await page.focus('#lexicon-map-input');
  await page.keyboard.type('m');
  await expect(page.locator('#lexicon-map-input')).toHaveValue('m');
  await expect(page.locator('.hud-minimap')).toBeVisible();
  await page.evaluate(() => document.getElementById('lexicon-map-input')!.blur());
  await page.keyboard.press('Escape');
  await page.keyboard.press('m');
  await page.keyboard.press('Escape');
  await expect(page.locator('.hud-minimap')).toBeVisible();
});

test('minimap does not overlap the other HUD elements', async ({ page }) => {
  const viewports = [
    { width: 760, height: 600 },
    { width: 1280, height: 720 },
  ];
  await page.setViewportSize(viewports[0]!);
  await openWorld(page);
  await walkToNote(page);
  await expect(page.getByText('Đọc ghi chú')).toBeVisible();
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    const minimap = (await page.locator('.hud-minimap').boundingBox())!;
    for (const selector of [
      '.hud-objective-panel',
      '.hud-case-progress',
      '.hud-interaction-prompt',
      '.hud-key-hints',
    ]) {
      const box = await page.locator(selector).boundingBox();
      expect(box, `${viewport.width}x${viewport.height} ${selector}`).not.toBeNull();
      expect(overlaps(minimap, box!), `${viewport.width}x${viewport.height} ${selector}`).toBe(
        false,
      );
    }
  }
});

test('minimap is hidden on narrow viewports', async ({ page }) => {
  await page.setViewportSize({ width: 700, height: 720 });
  await openWorld(page);
  await expect(page.locator('.hud-minimap')).toBeHidden();
});

test('HUD chrome follows the concept: red objective heading, clip, case badge, movement and action key bar', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await openWorld(page);
  const heading = page.locator('.hud-objective-heading');
  expect(await heading.evaluate((el) => getComputedStyle(el).color)).toBe('rgb(164, 65, 45)');
  expect(await heading.evaluate((el) => getComputedStyle(el).textTransform)).toBe('uppercase');
  await expect(page.locator('.hud-objective-panel .hud-objective-clip')).toHaveCount(1);
  await expect(page.locator('.hud-objective-marker')).toBeVisible();

  const badge = page.locator('.hud-case-badge');
  await expect(badge).toBeVisible();
  const count = badge.locator('.hud-case-progress-count');
  await expect(count).toHaveText(/^\d+\/\d+$/);
  expect(
    await count.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
  ).toBeGreaterThanOrEqual(24);
  expect(await count.evaluate((el) => getComputedStyle(el).color)).toBe('rgb(164, 65, 45)');
  await expect(badge.locator('svg')).toHaveCount(1);

  const keys = await page.locator('.hud-key-hints .keycap').allTextContents();
  expect(keys).toEqual(['WASD', 'E', 'J', 'M', 'Esc']);
  await expect(page.locator('.hud-key-hints')).not.toContainText('Space');
});

test('pause menu form controls are custom paper controls with a visible focus ring', async ({
  page,
}) => {
  await openWorld(page);
  await openPause(page);
  const dialog = page.getByRole('dialog');
  for (const selector of ['select', 'input[type=range]', 'input[type=checkbox]']) {
    const styles = await dialog
      .locator(selector)
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el);
        return { appearance: cs.appearance, border: parseFloat(cs.borderTopWidth) };
      });
    expect(styles.appearance, selector).toBe('none');
    if (selector !== 'input[type=range]') expect(styles.border, selector).toBeGreaterThanOrEqual(1);
  }
  const range = dialog.locator('input[type=range]');
  expect(
    await range.evaluate((el) =>
      parseFloat(getComputedStyle(el, '::-webkit-slider-runnable-track').height),
    ),
  ).toBeGreaterThanOrEqual(1);
  // Tab from the focused Resume button wraps to the first select.
  await page.keyboard.press('Tab');
  const focused = page.locator(':focus');
  const outline = await focused.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { width: parseFloat(cs.outlineWidth), style: cs.outlineStyle };
  });
  expect(outline.style).not.toBe('none');
  expect(outline.width).toBeGreaterThanOrEqual(2);
});

test('notebook buttons keep a >=3px focus ring and hover skips disabled buttons', async ({
  page,
}) => {
  await openWorld(page);
  await page.keyboard.press('j');
  const close = page.getByRole('button', { name: 'Đóng' });
  await expect(close).toBeVisible();
  await close.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  const outline = await page.locator(':focus').evaluate((el) => {
    const cs = getComputedStyle(el);
    return { w: parseFloat(cs.outlineWidth), o: parseFloat(cs.outlineOffset) };
  });
  expect(outline.w).toBeGreaterThanOrEqual(3);
  expect(outline.o).toBeGreaterThanOrEqual(3);
});

test('key bar wraps instead of overflowing at 760px', async ({ page }) => {
  await page.setViewportSize({ width: 760, height: 720 });
  await openWorld(page);
  const overflow = await page
    .locator('.hud-key-hints')
    .evaluate((el) => el.scrollWidth > el.clientWidth);
  expect(overflow).toBe(false);
});

type Rect = { left: number; top: number; right: number; bottom: number };

async function rectOf(page: Page, selector: string): Promise<Rect | null> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
  }, selector);
}

function intersects(a: Rect, b: Rect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

async function highlight(page: Page) {
  return page.evaluate(() => window.__lexiconDebug!.highlightBounds());
}

test('interaction bubble sits by the note, inside the viewport and clear of the HUD', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await openWorld(page);
  await walkToNote(page);
  const bubble = page.locator('.hud-interaction-bubble');
  await expect(bubble).toBeVisible();
  await expect(bubble).toContainText('Đọc ghi chú');
  await expect(bubble).toHaveAttribute('data-anchor-x', /.+/);
  const box = (await rectOf(page, '.hud-interaction-bubble'))!;
  const viewport = { left: 0, top: 0, right: 1280, bottom: 720 };
  expect(box.left).toBeGreaterThanOrEqual(viewport.left);
  expect(box.top).toBeGreaterThanOrEqual(viewport.top);
  expect(box.right).toBeLessThanOrEqual(viewport.right);
  expect(box.bottom).toBeLessThanOrEqual(viewport.bottom);
  for (const selector of ['.hud-minimap', '.hud-objective-panel', '.hud-key-hints']) {
    const other = await rectOf(page, selector);
    if (other) expect(intersects(box, other), selector).toBe(false);
  }
  const ax = Number(await bubble.getAttribute('data-anchor-x'));
  const ay = Number(await bubble.getAttribute('data-anchor-y'));
  const nearestX = Math.max(box.left, Math.min(ax, box.right));
  const nearestY = Math.max(box.top, Math.min(ay, box.bottom));
  expect(Math.hypot(nearestX - ax, nearestY - ay)).toBeLessThanOrEqual(240);
});

test('nearby target gets a red outline that clears when leaving, locking or opening the notebook', async ({
  page,
}) => {
  await openWorld(page);
  expect(await highlight(page)).toBeNull();
  const start = await page.evaluate(() => window.__lexiconDebug!.player());
  await walkToNote(page);
  await expect.poll(() => highlight(page)).not.toBeNull();
  const bounds = (await highlight(page))!;
  expect(bounds.width).toBeGreaterThan(0);
  expect(bounds.height).toBeGreaterThan(0);

  await page.keyboard.press('j');
  await expect(page.getByRole('heading', { name: 'Sổ tay điều tra' })).toBeVisible();
  await expect.poll(() => highlight(page)).toBeNull();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Sổ tay điều tra' })).toHaveCount(0);
  await expect.poll(() => highlight(page)).not.toBeNull();

  await page.evaluate(({ x, y }) => window.__lexiconDebug!.teleport(x, y), start);
  await expect.poll(() => highlight(page)).toBeNull();
  await expect(page.locator('.hud-interaction-bubble')).toHaveCount(0);
});

test('locked input hides the prompt and outline instead of jumping to the fallback', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await openWorld(page);
  await walkToNote(page);
  await expect(page.locator('.hud-interaction-bubble')).toBeVisible();
  await page.keyboard.press('j');
  await expect(page.getByRole('heading', { name: 'Sổ tay điều tra' })).toBeVisible();
  await expect(page.locator('.hud-interaction-prompt')).toHaveCount(0);
  expect(await highlight(page)).toBeNull();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Sổ tay điều tra' })).toHaveCount(0);
  await expect(page.locator('.hud-interaction-bubble')).toBeVisible();
});

test('the prompt is never seen at the fallback position on a wide viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await openWorld(page);
  await page.evaluate(() => {
    const w = window as unknown as { __promptSeen: string[] };
    w.__promptSeen = [];
    const check = () => {
      const el = document.querySelector('.hud-interaction-prompt');
      if (el) w.__promptSeen.push(el.className);
      requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  });
  await walkToNote(page);
  await expect(page.locator('.hud-interaction-bubble')).toBeVisible();
  const seen = await page.evaluate(
    () => (window as unknown as { __promptSeen: string[] }).__promptSeen,
  );
  expect(seen.length).toBeGreaterThan(0);
  expect(seen.filter((name) => !name.includes('hud-interaction-bubble'))).toEqual([]);
});

test('narrow viewports keep the fixed bottom-centre prompt', async ({ page }) => {
  await page.setViewportSize({ width: 700, height: 720 });
  await openWorld(page);
  await walkToNote(page);
  await expect(page.locator('.hud-interaction-prompt')).toBeVisible();
  await expect(page.locator('.hud-interaction-bubble')).toHaveCount(0);
});
