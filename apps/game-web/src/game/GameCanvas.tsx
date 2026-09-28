import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  CaseDefinition,
  GameEventMap,
  SceneDefinition,
  UiStrings,
} from '@lexicon/shared-types';
import {
  ContentValidationError,
  DEFAULT_START,
  loadCaseDefinition,
  loadUiStrings,
} from '@lexicon/game-content';
import { createCaseState } from '@lexicon/game-core';
import { createEventBus } from '../bridge/eventBus';
import { connectBusToStore } from '../bridge/connectBusToStore';
import { connectCaseEngine } from '../bridge/connectCaseEngine';
import { connectAutosave } from '../persistence/connectAutosave';
import { createSaveRepository, type SaveRepository } from '../persistence/saveRepository';
import { loadGameBootstrap, type GameBootstrapResult } from './bootstrapGame';
import { DialogueLayer } from '../dialogue/DialogueLayer';
import { Hud } from '../hud/Hud';
import { PauseMenu } from '../pause/PauseMenu';
import { usePauseShortcut } from '../pause/usePauseShortcut';
import { useNotebookShortcut } from '../notebook/useNotebookShortcut';
import { EvidenceModal } from '../evidence/EvidenceModal';
import { NotebookPanel } from '../notebook/NotebookPanel';
import { createGameStore, type GameStore } from '../state/gameStore';
import { GameStoreProvider, useGameStore } from '../state/GameStoreContext';
import { createGame } from './createGame';

type StartContent = { scene: SceneDefinition; caseDefinition: CaseDefinition; strings: UiStrings };
type LoadResult = { ok: true; content: StartContent } | { ok: false; error: Error };

function loadStartContent(): LoadResult {
  try {
    const caseDefinition = loadCaseDefinition(DEFAULT_START.caseId);
    const scene = caseDefinition.scenes.find(({ id }) => id === DEFAULT_START.sceneId);
    if (!scene) throw new Error(`Start scene "${DEFAULT_START.sceneId}" is missing from case`);
    return {
      ok: true,
      content: {
        scene,
        caseDefinition,
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
  const repository = useMemo(createSaveRepository, []);
  const [bootstrap, setBootstrap] = useState<GameBootstrapResult | { status: 'loading' }>({
    status: 'loading',
  });

  useEffect(() => {
    if (!result.ok) return;
    let active = true;
    void loadGameBootstrap(result.content.caseDefinition, repository)
      .then((loaded) => {
        if (active) setBootstrap(loaded);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setBootstrap({
          status: 'memory-only',
          initialState: createCaseState(result.content.caseDefinition),
          autosaveEnabled: false,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    return () => {
      active = false;
    };
  }, [result, repository]);

  if (!result.ok) {
    const issues = result.error instanceof ContentValidationError ? result.error.issues : [];
    return (
      <pre role="alert" style={{ padding: 16, whiteSpace: 'pre-wrap' }}>
        {result.error.message}
        {issues.length > 0 ? `\n\nIssues:\n${issues.map((i) => `- ${i}`).join('\n')}` : ''}
      </pre>
    );
  }

  if (bootstrap.status === 'loading') {
    return <div role="status">{result.content.strings.loadingGame}</div>;
  }

  if (bootstrap.status === 'confirmation-required') {
    return (
      <SaveRecoveryScreen
        strings={result.content.strings}
        reason={bootstrap.reason}
        onConfirm={() => {
          setBootstrap({ status: 'loading' });
          void repository
            .createFreshSaveAfterConfirmation(
              result.content.caseDefinition.id,
              result.content.caseDefinition,
            )
            .then((initialState) => {
              setBootstrap({ status: 'ready', initialState, autosaveEnabled: true });
            })
            .catch((error: unknown) => {
              setBootstrap({
                status: 'memory-only',
                initialState: createCaseState(result.content.caseDefinition),
                autosaveEnabled: false,
                error: error instanceof Error ? error.message : String(error),
              });
            });
        }}
        onCancel={() =>
          setBootstrap({
            status: 'memory-only',
            initialState: createCaseState(result.content.caseDefinition),
            autosaveEnabled: false,
            error: result.content.strings.saveUnavailable,
          })
        }
      />
    );
  }

  const persistenceWarning =
    bootstrap.status === 'memory-only'
      ? `${result.content.strings.saveUnavailable} ${bootstrap.error}`
      : undefined;
  return (
    <GameRoot
      content={result.content}
      initialState={bootstrap.initialState}
      autosaveEnabled={bootstrap.autosaveEnabled}
      {...(persistenceWarning ? { persistenceWarning } : {})}
      repository={repository}
    />
  );
}

function SaveRecoveryScreen({
  strings,
  reason,
  onConfirm,
  onCancel,
}: {
  strings: UiStrings;
  reason: string;
  onConfirm(): void;
  onCancel(): void;
}): JSX.Element {
  return (
    <main role="alert" style={{ padding: 24 }}>
      <h1>{strings.saveRecoveryTitle}</h1>
      <p>{strings.saveRecoveryBody}</p>
      <p>{reason}</p>
      <button type="button" autoFocus onClick={onConfirm}>
        {strings.createFreshSave}
      </button>
      <button type="button" onClick={onCancel}>
        {strings.cancel}
      </button>
    </main>
  );
}

function GameRoot({
  content,
  initialState,
  autosaveEnabled,
  persistenceWarning,
  repository,
}: {
  content: StartContent;
  initialState: ReturnType<typeof createCaseState>;
  autosaveEnabled: boolean;
  persistenceWarning?: string;
  repository: SaveRepository;
}) {
  const { scene, caseDefinition, strings } = content;
  const containerRef = useRef<HTMLDivElement>(null);
  const { store, bus } = useMemo(
    () => ({
      store: createGameStore({
        caseDefinition,
        initialState,
        ...(persistenceWarning ? { initialPersistenceError: persistenceWarning } : {}),
      }),
      bus: createEventBus<GameEventMap>(),
    }),
    [caseDefinition, initialState, persistenceWarning],
  );
  usePauseShortcut(store);
  useNotebookShortcut(store);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const disconnect = connectBusToStore(bus, store);
    const disconnectCaseEngine = connectCaseEngine(bus, store, caseDefinition);
    const disconnectAutosave = autosaveEnabled
      ? connectAutosave(
          store,
          (state) => repository.saveGameState(state),
          (error) => {
            const detail = error instanceof Error ? error.message : String(error);
            store.getState().setPersistenceError(`${strings.saveWriteFailed} ${detail}`);
          },
        )
      : undefined;
    const game = createGame(container, {
      scene,
      bus,
      input: { isInputLocked: () => store.getState().inputLocked },
    });
    return () => {
      game.destroy(true);
      disconnect();
      disconnectCaseEngine();
      disconnectAutosave?.();
    };
  }, [scene, bus, store, caseDefinition, autosaveEnabled, repository, strings]);

  return (
    <div className="game-root" style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <div
        ref={containerRef}
        tabIndex={-1}
        aria-label={strings.caseFile}
        style={{ width: '100%', height: '100%' }}
      />
      <GameStoreProvider store={store}>
        <Hud strings={strings} />
        <PersistenceNotice strings={strings} />
        <DialogueLayer strings={strings} returnFocusRef={containerRef} />
        <PauseLayer strings={strings} store={store} />
        <EvidenceLayer strings={strings} />
        <NotebookLayer strings={strings} caseDefinition={caseDefinition} />
      </GameStoreProvider>
    </div>
  );
}

function EvidenceLayer({ strings }: { strings: UiStrings }) {
  const activeEvidenceId = useGameStore((state) => state.activeEvidenceId);
  const evidence = useGameStore((state) =>
    state.caseDefinition.evidences.find((item) => item.id === state.activeEvidenceId),
  );
  const store = useGameStore((state) => state);
  if (activeEvidenceId === null || !evidence) return null;
  return (
    <EvidenceModal evidence={evidence} strings={strings} onClose={() => store.closeEvidence()} />
  );
}

function NotebookLayer({
  strings,
  caseDefinition,
}: {
  strings: UiStrings;
  caseDefinition: CaseDefinition;
}) {
  const notebookOpen = useGameStore((state) => state.notebookOpen);
  const caseState = useGameStore((state) => state.caseState);
  const activeTab = useGameStore((state) => state.notebookTab);
  const store = useGameStore((state) => state);
  if (!notebookOpen) return null;
  return (
    <NotebookPanel
      caseDefinition={caseDefinition}
      caseState={caseState}
      activeTab={activeTab}
      strings={strings}
      onSelectTab={(tab) => store.setNotebookTab(tab)}
      onClose={() => store.toggleNotebook()}
    />
  );
}

function PersistenceNotice({ strings }: { strings: UiStrings }): JSX.Element | null {
  const persistenceError = useGameStore((state) => state.persistenceError);
  if (!persistenceError) return null;
  return (
    <div role="status" aria-live="polite" className="hud-persistence-notice">
      {persistenceError || strings.saveUnavailable}
    </div>
  );
}

function PauseLayer({ strings, store }: { strings: UiStrings; store: GameStore }) {
  const paused = useGameStore((state) => state.paused);
  if (!paused) return null;
  return <PauseMenu strings={strings} onResume={() => store.getState().setPaused(false)} />;
}
