import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type {
  CaseDefinition,
  GameEventMap,
  LearningAction,
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
import { connectCaseEngine, requestSceneTransition } from '../bridge/connectCaseEngine';
import { connectAutosave } from '../persistence/connectAutosave';
import { createSaveRepository, type SaveRepository } from '../persistence/saveRepository';
import { loadGameBootstrap, type GameBootstrapResult } from './bootstrapGame';
import { DialogueLayer } from '../dialogue/DialogueLayer';
import { Hud } from '../hud/Hud';
import { PauseMenu } from '../pause/PauseMenu';
import { usePauseShortcut } from '../pause/usePauseShortcut';
import { useNotebookShortcut } from '../notebook/useNotebookShortcut';
import { useMinimapShortcut } from '../hud/useMinimapShortcut';
import { EvidenceModal } from '../evidence/EvidenceModal';
import { NotebookPanel } from '../notebook/NotebookPanel';
import { createGameStore, type GameStore } from '../state/gameStore';
import { GameStoreProvider, useGameStore } from '../state/GameStoreContext';
import { createGame } from './createGame';
import {
  createLearningRepository,
  type LearningLoadResult,
} from '../persistence/learningRepository';
import {
  createSettingsRepository,
  type SettingsLoadResult,
  type SettingsRepository,
} from '../persistence/settingsRepository';
import { createSettingsStore } from '../state/settingsStore';
import { SettingsStoreProvider } from '../state/SettingsStoreContext';
import { useMasterVolume } from '../audio/useMasterVolume';
import { useSettingsStore } from '../state/SettingsStoreContext';
import { useTranslationMode } from '../state/useTranslationMode';
import { connectSettingsAutosave } from '../persistence/connectSettingsAutosave';
import { createDefaultLearningRecord } from '../persistence/learningMigration';
import { createLearningStore } from '../state/learningStore';
import { LearningStoreProvider } from '../state/LearningStoreContext';
import { connectLearningAutosave } from '../persistence/connectLearningAutosave';
import { useLearningStore } from '../state/LearningStoreContext';
import { buildCaseReport } from '../conclusion/buildCaseReport';
import { CaseSummaryScreen } from '../conclusion/CaseSummaryScreen';
import {
  defaultCommerceConfigProvider,
  FREE_COMMERCE_CONFIG,
  type CommerceConfigProvider,
} from '../commerce/commerceConfig';

type StartContent = { caseDefinition: CaseDefinition; strings: UiStrings };
type LoadResult = { ok: true; content: StartContent } | { ok: false; error: Error };

function loadStartContent(): LoadResult {
  try {
    const caseDefinition = loadCaseDefinition(DEFAULT_START.caseId);
    const scene = caseDefinition.scenes.find(({ id }) => id === DEFAULT_START.sceneId);
    if (!scene?.spawnPoints.default)
      throw new Error(`Start scene "${DEFAULT_START.sceneId}" or its default spawn is missing`);
    return {
      ok: true,
      content: {
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

export function GameCanvas({
  commerceConfigProvider = defaultCommerceConfigProvider,
}: {
  commerceConfigProvider?: CommerceConfigProvider;
} = {}) {
  const result = useMemo(loadStartContent, []);
  const repository = useMemo(createSaveRepository, []);
  const learningRepository = useMemo(createLearningRepository, []);
  const settingsRepository = useMemo(createSettingsRepository, []);
  const bootPromiseRef = useRef<Promise<{
    learning: LearningLoadResult;
    settings: SettingsLoadResult;
  }> | null>(null);
  const [learningLoad, setLearningLoad] = useState<LearningLoadResult | null>(null);
  const [settingsLoad, setSettingsLoad] = useState<SettingsLoadResult | null>(null);
  const [bootstrap, setBootstrap] = useState<GameBootstrapResult | { status: 'loading' }>({
    status: 'loading',
  });

  useEffect(() => {
    if (!result.ok) return;
    // One load per mount: StrictMode re-runs effects and a second settings load
    // would hide the "recovered" status of the first.
    bootPromiseRef.current ??= learningRepository
      .loadLearning(
        result.content.caseDefinition.vocabulary,
        result.content.caseDefinition.vocabularyContexts,
      )
      .then(async (learning) => {
        const legacy =
          ('legacyTranslationMode' in learning ? learning.legacyTranslationMode : null) ??
          (await learningRepository.findLegacyTranslationMode());
        const settings = await settingsRepository.loadSettings(
          legacy ? { translationMode: legacy } : {},
        );
        return { learning, settings };
      });
    let active = true;
    void bootPromiseRef.current.then(({ learning, settings }) => {
      if (!active) return;
      setLearningLoad(learning);
      setSettingsLoad(settings);
    });
    return () => {
      active = false;
    };
  }, [result, learningRepository, settingsRepository]);

  useEffect(() => {
    if (!result.ok) return;
    let active = true;
    void loadGameBootstrap(result.content.caseDefinition, repository, commerceConfigProvider)
      .then((loaded) => {
        if (active) setBootstrap(loaded);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setBootstrap({
          status: 'memory-only',
          initialState: createCaseState(result.content.caseDefinition),
          activeSceneId: DEFAULT_START.sceneId,
          commerceConfig: FREE_COMMERCE_CONFIG,
          autosaveEnabled: false,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    return () => {
      active = false;
    };
  }, [result, repository, commerceConfigProvider]);

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

  if (!learningLoad || !settingsLoad)
    return <div role="status">{result.content.strings.loadingGame}</div>;

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
              setBootstrap({
                status: 'ready',
                initialState,
                activeSceneId: DEFAULT_START.sceneId,
                commerceConfig: bootstrap.commerceConfig,
                autosaveEnabled: true,
              });
            })
            .catch((error: unknown) => {
              setBootstrap({
                status: 'memory-only',
                initialState: createCaseState(result.content.caseDefinition),
                activeSceneId: DEFAULT_START.sceneId,
                commerceConfig: bootstrap.commerceConfig,
                autosaveEnabled: false,
                error: error instanceof Error ? error.message : String(error),
              });
            });
        }}
        onCancel={() =>
          setBootstrap({
            status: 'memory-only',
            initialState: createCaseState(result.content.caseDefinition),
            activeSceneId: DEFAULT_START.sceneId,
            commerceConfig: bootstrap.commerceConfig,
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
      initialSceneId={bootstrap.activeSceneId}
      autosaveEnabled={bootstrap.autosaveEnabled}
      {...(persistenceWarning ? { persistenceWarning } : {})}
      repository={repository}
      learningRepository={learningRepository}
      learningRecord={
        learningLoad.status === 'confirmation-required'
          ? createDefaultLearningRecord()
          : learningLoad.record
      }
      settingsRepository={settingsRepository}
      settingsLoad={settingsLoad}
      learningPersistenceInitiallyEnabled={
        learningLoad.status === 'loaded' || learningLoad.status === 'missing'
      }
      learningRecoveryRequired={
        learningLoad.status === 'confirmation-required' ? learningLoad.reason : null
      }
      learningPersistenceError={learningLoad.status === 'memory-only' ? learningLoad.error : null}
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
  initialSceneId,
  autosaveEnabled,
  persistenceWarning,
  repository,
  learningRepository,
  learningRecord,
  settingsRepository,
  settingsLoad,
  learningPersistenceInitiallyEnabled,
  learningRecoveryRequired,
  learningPersistenceError,
}: {
  content: StartContent;
  initialState: ReturnType<typeof createCaseState>;
  initialSceneId: string;
  autosaveEnabled: boolean;
  persistenceWarning?: string;
  repository: SaveRepository;
  learningRepository: ReturnType<typeof createLearningRepository>;
  learningRecord: ReturnType<typeof createDefaultLearningRecord>;
  settingsRepository: SettingsRepository;
  settingsLoad: SettingsLoadResult;
  learningPersistenceInitiallyEnabled: boolean;
  learningRecoveryRequired: string | null;
  learningPersistenceError: string | null;
}) {
  const { caseDefinition, strings } = content;
  const scene = caseDefinition.scenes.find(({ id }) => id === initialSceneId);
  if (!scene?.spawnPoints.default)
    throw new Error(`Scene "${initialSceneId}" or its default spawn is missing from case`);
  const containerRef = useRef<HTMLDivElement>(null);
  const [learningPersistenceEnabled, setLearningPersistenceEnabled] = useState(
    learningPersistenceInitiallyEnabled,
  );
  const [showLearningRecovery, setShowLearningRecovery] = useState(
    Boolean(learningRecoveryRequired),
  );
  const [learningWriteError, setLearningWriteError] = useState<string | null>(null);
  const { store, bus } = useMemo(
    () => ({
      store: createGameStore({
        caseDefinition,
        initialState,
        initialSceneId,
        ...(persistenceWarning ? { initialPersistenceError: persistenceWarning } : {}),
      }),
      bus: createEventBus<GameEventMap>(),
    }),
    [caseDefinition, initialState, initialSceneId, persistenceWarning],
  );
  const learning = useMemo(
    () =>
      createLearningStore({
        catalogue: caseDefinition.vocabulary,
        contexts: caseDefinition.vocabularyContexts,
        initialRecord: learningRecord,
        bus,
      }),
    [caseDefinition, learningRecord, bus],
  );
  const settings = useMemo(() => createSettingsStore(settingsLoad.settings), [settingsLoad]);
  const reducedMotion = useSyncExternalStore(
    settings.subscribe,
    () => settings.getState().settings.reducedMotion,
    () => false,
  );
  const [settingsWriteError, setSettingsWriteError] = useState<string | null>(null);
  usePauseShortcut(store);
  useNotebookShortcut(store);
  useMinimapShortcut(store);
  // Dev-only: `?noPaperOverlay` lets perf measurements compare with and without the grain.
  const showPaperOverlay = !(
    import.meta.env.DEV && new URLSearchParams(window.location.search).has('noPaperOverlay')
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const disconnect = connectBusToStore(bus, store);
    const disconnectCaseEngine = connectCaseEngine(bus, store, caseDefinition);
    const disconnectAutosave = autosaveEnabled
      ? connectAutosave(
          store,
          (state, activeSceneId) => repository.saveGameState(state, activeSceneId),
          (error) => {
            const detail = error instanceof Error ? error.message : String(error);
            store.getState().setPersistenceError(`${strings.saveWriteFailed} ${detail}`);
          },
        )
      : undefined;
    const game = createGame(container, {
      caseDefinition,
      scene,
      spawnId: 'default',
      bus,
      input: { isInputLocked: () => store.getState().inputLocked },
      transitions: {
        request: (sceneId, spawnId) => requestSceneTransition(bus, store, sceneId, spawnId),
        activeSceneId: () => store.getState().activeSceneId,
      },
      motion: { reducedMotion: () => settings.getState().settings.reducedMotion },
    });
    return () => {
      game.destroy(true);
      disconnect();
      disconnectCaseEngine();
      disconnectAutosave?.();
    };
  }, [scene, bus, store, settings, caseDefinition, autosaveEnabled, repository, strings]);

  useEffect(() => {
    if (!learningPersistenceEnabled) return;
    return connectLearningAutosave(
      learning,
      (record) => learningRepository.saveLearning(record),
      (error) => {
        const detail = error instanceof Error ? error.message : String(error);
        setLearningWriteError(`${strings.vocabularyLearningError} ${detail}`);
      },
    );
  }, [learning, learningRepository, learningPersistenceEnabled, strings.vocabularyLearningError]);

  useEffect(() => {
    if (settingsLoad.status === 'memory-only') return;
    return connectSettingsAutosave(
      settings,
      async (next) => {
        await settingsRepository.saveSettings(next);
        setSettingsWriteError(null);
      },
      () => setSettingsWriteError(strings.settingsUnavailable),
    );
  }, [settings, settingsRepository, settingsLoad.status, strings.settingsUnavailable]);

  const settingsNotice =
    settingsLoad.status === 'memory-only' || settingsWriteError
      ? strings.settingsUnavailable
      : settingsLoad.status === 'recovered'
        ? strings.settingsRecovered
        : null;

  return (
    <div className="game-root" data-reduced-motion={reducedMotion ? 'true' : 'false'}>
      <div
        ref={containerRef}
        tabIndex={-1}
        aria-label={strings.caseFile}
        style={{ width: '100%', height: '100%' }}
      />
      {showPaperOverlay && <div className="game-paper-overlay" aria-hidden="true" />}
      <GameStoreProvider store={store}>
        <LearningStoreProvider store={learning}>
          <SettingsStoreProvider store={settings}>
            <SettingsEffects />
            {settingsNotice && (
              <aside role="status" className="learning-recovery-notice">
                {settingsNotice}
              </aside>
            )}
            {showLearningRecovery && learningRecoveryRequired && (
              <aside role="alert" className="learning-recovery-notice">
                <p>
                  {strings.vocabularyLearningError} {learningRecoveryRequired}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    void learningRepository
                      .createFreshLearningAfterConfirmation()
                      .then(() => {
                        setLearningPersistenceEnabled(true);
                        setShowLearningRecovery(false);
                        setLearningWriteError(null);
                      })
                      .catch((error: unknown) => {
                        setLearningWriteError(
                          error instanceof Error ? error.message : strings.vocabularyLearningError,
                        );
                      });
                  }}
                >
                  {strings.vocabularyResetTitle}
                </button>
                <button type="button" onClick={() => setShowLearningRecovery(false)}>
                  {strings.cancel}
                </button>
              </aside>
            )}
            {(learningPersistenceError || learningWriteError) && (
              <aside role="status" className="learning-recovery-notice">
                {learningWriteError ??
                  `${strings.vocabularyLearningError} ${learningPersistenceError}`}
              </aside>
            )}
            <Hud strings={strings} />
            <PersistenceNotice strings={strings} />
            <DialogueLayer strings={strings} returnFocusRef={containerRef} />
            <PauseLayer strings={strings} store={store} />
            <EvidenceLayer strings={strings} />
            <NotebookLayer strings={strings} caseDefinition={caseDefinition} />
            <CaseSummaryLayer strings={strings} />
          </SettingsStoreProvider>
        </LearningStoreProvider>
      </GameStoreProvider>
    </div>
  );
}

/** Applies settings that have no UI of their own (currently master volume). */
function SettingsEffects(): null {
  useMasterVolume(useSettingsStore((state) => state.settings.volume));
  return null;
}

function EvidenceLayer({ strings }: { strings: UiStrings }) {
  const activeEvidenceId = useGameStore((state) => state.activeEvidenceId);
  const evidence = useGameStore((state) =>
    state.caseDefinition.evidences.find((item) => item.id === state.activeEvidenceId),
  );
  const store = useGameStore((state) => state);
  const answerListeningTask = useGameStore((state) => state.answerListeningTask);
  const caseState = useGameStore((state) => state.caseState);
  const listeningTask = useGameStore(
    (state) =>
      state.caseDefinition.listeningTasks.find((task) => task.evidenceId === activeEvidenceId) ??
      null,
  );
  const dispatchLearning = useLearningStore((state) => state.dispatchLearning);
  const [translationMode, setTranslationMode] = useTranslationMode();
  const subtitles = useSettingsStore((state) => state.settings.subtitles);
  const vocabularyTutorialSeen = useLearningStore((state) => state.vocabularyTutorialSeen);
  const markVocabularyTutorialSeen = useLearningStore((state) => state.markVocabularyTutorialSeen);
  const onEncounter = useCallback(
    (vocabularyId: string, contextId: string) =>
      dispatchLearning({ type: 'encounterContext', vocabularyId, contextId }),
    [dispatchLearning],
  );
  const onInspect = useCallback(
    (vocabularyId: string, contextId: string) =>
      dispatchLearning({ type: 'inspectVocabulary', vocabularyId, contextId }),
    [dispatchLearning],
  );
  const onRevealTranslation = useCallback(
    (vocabularyId: string, contextId: string) =>
      dispatchLearning({ type: 'revealTranslation', vocabularyId, contextId }),
    [dispatchLearning],
  );
  const onListeningAnswer = useCallback(
    (taskId: string, optionId: string) => answerListeningTask(taskId, optionId),
    [answerListeningTask],
  );
  const onListeningTelemetry = useCallback(
    (
      event: Extract<LearningAction, { type: 'recordListeningEvent' }>['event'],
      elapsedMs?: number,
    ) =>
      dispatchLearning({
        type: 'recordListeningEvent',
        event,
        ...(elapsedMs === undefined ? {} : { elapsedMs }),
      }),
    [dispatchLearning],
  );
  if (activeEvidenceId === null || !evidence) return null;
  return (
    <EvidenceModal
      evidence={evidence}
      strings={strings}
      onClose={() => store.closeEvidence()}
      vocabulary={store.caseDefinition.vocabulary}
      translationMode={translationMode}
      subtitles={subtitles}
      onEncounter={onEncounter}
      onInspect={onInspect}
      onRevealTranslation={onRevealTranslation}
      onTranslationModeChange={setTranslationMode}
      vocabularyTutorialSeen={vocabularyTutorialSeen}
      onVocabularyTutorialSeen={markVocabularyTutorialSeen}
      {...(listeningTask ? { listeningTask } : {})}
      listeningCompleted={Boolean(listeningTask && caseState.flags[listeningTask.completionFlag])}
      onListeningAnswer={onListeningAnswer}
      onListeningTelemetry={onListeningTelemetry}
    />
  );
}

/** Rebuilt from the saved case state and the current profile, so it survives reload. */
function CaseSummaryLayer({ strings }: { strings: UiStrings }): JSX.Element | null {
  const caseDefinition = useGameStore((state) => state.caseDefinition);
  const caseState = useGameStore((state) => state.caseState);
  const profile = useLearningStore((state) => state.profile);
  const report = useMemo(
    () => buildCaseReport(caseDefinition, caseState, profile),
    [caseDefinition, caseState, profile],
  );
  if (caseState.flags.case_closed !== true) return null;
  return <CaseSummaryScreen caseTitle={caseState.caseTitle} report={report} strings={strings} />;
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
  const learningProfile = useLearningStore((state) => state.profile);
  const dispatchLearning = useLearningStore((state) => state.dispatchLearning);
  const [translationMode, setTranslationMode] = useTranslationMode();
  const onEncounter = useCallback(
    (vocabularyId: string, contextId: string) =>
      dispatchLearning({ type: 'encounterContext', vocabularyId, contextId }),
    [dispatchLearning],
  );
  const onInspect = useCallback(
    (vocabularyId: string, contextId: string) =>
      dispatchLearning({ type: 'inspectVocabulary', vocabularyId, contextId }),
    [dispatchLearning],
  );
  const onRevealTranslation = useCallback(
    (vocabularyId: string, contextId: string) =>
      dispatchLearning({ type: 'revealTranslation', vocabularyId, contextId }),
    [dispatchLearning],
  );
  if (!notebookOpen) return null;
  return (
    <NotebookPanel
      caseDefinition={caseDefinition}
      caseState={caseState}
      activeTab={activeTab}
      strings={strings}
      onSelectTab={(tab) => store.setNotebookTab(tab)}
      onClose={() => store.toggleNotebook()}
      profile={learningProfile}
      translationMode={translationMode}
      onRevealTranslation={onRevealTranslation}
      onEncounter={onEncounter}
      onInspect={onInspect}
      onTranslationModeChange={setTranslationMode}
      onPlaceTimelineEvent={(eventId, slotId) => store.placeTimelineEvent(eventId, slotId)}
      onSubmitAccusation={(suspectNpcId) => store.submitAccusation(suspectNpcId)}
      onReviewEvidence={(evidenceId) => store.reviewEvidence(evidenceId)}
      onSubmitContradiction={(contradictionId, factIds) =>
        store.submitContradiction(contradictionId, factIds)
      }
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
