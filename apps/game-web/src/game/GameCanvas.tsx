import { useEffect, useMemo, useRef } from 'react';
import type { GameEventMap, SceneDefinition } from '@lexicon/shared-types';
import { ContentValidationError, DEFAULT_START, loadSceneDefinition } from '@lexicon/game-content';
import { createEventBus } from '../bridge/eventBus';
import { createGame } from './createGame';

type LoadResult = { ok: true; scene: SceneDefinition } | { ok: false; error: Error };

function loadStartScene(): LoadResult {
  try {
    return { ok: true, scene: loadSceneDefinition(DEFAULT_START.caseId, DEFAULT_START.sceneId) };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('[CaseEngine] failed to load start scene', error);
    return { ok: false, error };
  }
}

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const result = useMemo(loadStartScene, []);
  const scene = result.ok ? result.scene : null;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !scene) return;
    const bus = createEventBus<GameEventMap>();
    const game = createGame(container, { scene, bus });
    return () => {
      game.destroy(true);
    };
  }, [scene]);

  if (!result.ok) {
    const issues = result.error instanceof ContentValidationError ? result.error.issues : [];
    return (
      <pre role="alert" style={{ padding: 16, whiteSpace: 'pre-wrap' }}>
        {result.error.message}
        {issues.length > 0 ? `\n\nIssues:\n${issues.map((i) => `- ${i}`).join('\n')}` : ''}
      </pre>
    );
  }

  return <div ref={containerRef} style={{ width: '100vw', height: '100vh' }} />;
}
