import { expect, test, type Page } from '@playwright/test';
import { openWorld } from './journeyHelpers';

// Phase 12 §5. Heap needs Chromium's performance.memory and a forced GC to be comparable.
test.use({ launchOptions: { args: ['--js-flags=--expose-gc', '--enable-precise-memory-info'] } });

const LAPS = Number(process.env.PERF_LAPS ?? 10);

type Snapshot = { heap: number; textures: number; listeners: number; domNodes: number };

async function snapshot(page: Page): Promise<Snapshot> {
  return page.evaluate(async () => {
    const w = window as unknown as {
      gc?: () => void;
      performance: Performance & { memory: { usedJSHeapSize: number } };
    };
    // Two passes with a pause let finalizers and detached DOM settle before reading the heap.
    for (let i = 0; i < 2; i++) {
      w.gc?.();
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    const debug = window.__lexiconDebug!;
    return {
      heap: w.performance.memory.usedJSHeapSize,
      textures: debug.textureCount(),
      listeners: debug.listenerCount(),
      domNodes: document.querySelectorAll('*').length,
    };
  });
}

async function transition(page: Page, sceneId: string, spawnId: string): Promise<void> {
  const previous = await page.evaluateHandle(() => window.__lexiconDebug);
  await page.evaluate(
    ([id, spawn]) => window.__lexiconDebug!.requestTransition(id!, spawn!),
    [sceneId, spawnId],
  );
  await page.waitForFunction(
    ([old, id]) =>
      window.__lexiconDebug !== undefined &&
      window.__lexiconDebug !== old &&
      window.__lexiconDebug.storeSceneId() === id,
    [previous, sceneId] as const,
  );
}

test('scene swaps and modals do not leak textures, listeners, DOM or heap', async ({ page }) => {
  test.setTimeout(180_000);
  await openWorld(page);
  // One full lap first so lazily created textures and caches are in the baseline.
  await transition(page, 'archive', 'from_office');
  await transition(page, 'main_office', 'from_archive');
  const before = await snapshot(page);

  for (let lap = 0; lap < LAPS; lap++) {
    await transition(page, 'archive', 'from_office');
    await transition(page, 'main_office', 'from_archive');
    await page.keyboard.press('j');
    await expect(page.getByRole('heading', { name: 'Sổ tay điều tra' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'Sổ tay điều tra' })).toHaveCount(0);
  }

  const after = await snapshot(page);
  const heapRatio = after.heap / before.heap;
  test.info().annotations.push({
    type: 'perf-leak',
    description: JSON.stringify({ laps: LAPS, before, after, heapRatio }),
  });
  console.log('PERF-LEAK', JSON.stringify({ laps: LAPS, before, after, heapRatio }));

  expect(after.textures).toBe(before.textures);
  expect(after.listeners).toBe(before.listeners);
  expect(after.domNodes).toBeLessThanOrEqual(before.domNodes + 5);
  // Measured 1.037-1.062 over 10/30 laps (cache warm-up, not per-lap growth); a 50k-object control
  // leak moves the same reading by ~10%. See docs/superpowers/specs/2026-10-01-phase-12-performance-report.md.
  expect(heapRatio).toBeLessThan(1.1);
});

test('cold load stays within the load budget', async ({ page }) => {
  const start = Date.now();
  await page.goto('/');
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
  const readyMs = Date.now() - start;
  const resources = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .map((entry) => entry as PerformanceResourceTiming)
      .map((entry) => ({
        name: new URL(entry.name).pathname,
        bytes: entry.encodedBodySize || entry.transferSize,
      })),
  );
  const totalBytes = resources.reduce((sum, entry) => sum + entry.bytes, 0);
  const byKind = (pattern: RegExp) =>
    resources.filter((entry) => pattern.test(entry.name)).reduce((sum, e) => sum + e.bytes, 0);
  const summary = {
    readyMs,
    requests: resources.length,
    totalBytes,
    imageBytes: byKind(/\.(png|webp|jpe?g)$/),
    audioBytes: byKind(/\.(ogg|mp3|wav)$/),
    scriptBytes: byKind(/\.(js|ts|tsx|mjs)(\?.*)?$/),
  };
  test.info().annotations.push({ type: 'perf-load', description: JSON.stringify(summary) });
  console.log('PERF-LOAD', JSON.stringify(summary));
  // Budget from the Phase 12 plan: report-and-ask, not an optimisation target (dev server, cold).
  expect(readyMs).toBeLessThan(5000);
  expect(totalBytes).toBeLessThan(25 * 1024 * 1024);
});
