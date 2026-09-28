import { useEffect, useMemo, useRef } from 'react';
import type { CaseSummary, GameEventMap, SceneDefinition, UiStrings } from '@lexicon/shared-types';
import {
  ContentValidationError,
  DEFAULT_START,
  loadCaseSummary,
  loadSceneDefinition,
  loadUiStrings,
} from '@lexicon/game-content';
import { createEventBus } from '../bridge/eventBus';
import { connectBusToStore } from '../bridge/connectBusToStore';
import { Hud } from '../hud/Hud';
import { PauseMenu } from '../pause/PauseMenu';
import { usePauseShortcut } from '../pause/usePauseShortcut';
import { createGameStore, type GameStore } from '../state/gameStore';
import { GameStoreProvider, useGameStore } from '../state/GameStoreContext';
import { createGame } from './createGame';

type StartContent = { scene: SceneDefinition; caseSummary: CaseSummary; strings: UiStrings };
type LoadResult = { ok: true; content: StartContent } | { ok: false; error: Error };

function loadStartContent(): LoadResult {
  try {
    return {
      ok: true,
      content: {
        scene: loadSceneDefinition(DEFAULT_START.caseId, DEFAULT_START.sceneId),
        caseSummary: loadCaseSummary(DEFAULT_START.caseId),
        strings: loadUiStrings('vi'),
      },
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('[CaseEngine] failed to load start content', error);
    return { ok: false, error };
  }
}

export function GameCanvas() {
  const result = useMemo(loadStartContent, []);

  if (!result.ok) {
    const issues = result.error instanceof ContentValidationError ? result.error.issues : [];
    return (
      <pre role="alert" style={{ padding: 16, whiteSpace: 'pre-wrap' }}>
        {result.error.message}
        {issues.length > 0 ? `\n\nIssues:\n${issues.map((i) => `- ${i}`).join('\n')}` : ''}
      </pre>
    );
  }

  return <GameRoot content={result.content} />;
}

function GameRoot({ content }: { content: StartContent }) {
  const { scene, caseSummary, strings } = content;
  const containerRef = useRef<HTMLDivElement>(null);
  const { store, bus } = useMemo(
    () => ({ store: createGameStore({ caseSummary }), bus: createEventBus<GameEventMap>() }),
    [caseSummary],
  );
  usePauseShortcut(store);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const disconnect = connectBusToStore(bus, store);
    const game = createGame(container, {
      scene,
      bus,
      input: { isInputLocked: () => store.getState().inputLocked },
    });
    return () => {
      game.destroy(true);
      disconnect();
    };
  }, [scene, bus, store]);

  return (
    <div className="game-root" style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <GameStoreProvider store={store}>
        <Hud strings={strings} />
        <PauseLayer strings={strings} store={store} />
      </GameStoreProvider>
    </div>
  );
}

function PauseLayer({ strings, store }: { strings: UiStrings; store: GameStore }) {
  const paused = useGameStore((state) => state.paused);
  if (!paused) return null;
  return <PauseMenu strings={strings} onResume={() => store.getState().setPaused(false)} />;
}
