import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type {
  CaseDefinition,
  GameEventMap,
  LearningAction,
  UiStrings,
} from '@lexicon/shared-types';
import {
  ContentValidationError,
  listCaseCatalogue,
  loadAllVocabulary,
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
import { CoachNote } from '../onboarding/CoachNote';
import { selectCoachNote } from '../onboarding/selectCoachNote';
import { useOnboardingSignals } from '../onboarding/useOnboardingSignals';
import { BriefingMemo } from '../briefing/BriefingMemo';
import { PauseMenu } from '../pause/PauseMenu';
import { HowToInvestigate } from '../onboarding/HowToInvestigate';
import type { InvestigationLearningProps } from '../investigation/RecordedStatements';
import { TitleScreen } from '../title/TitleScreen';
import { SupportPicker } from '../title/SupportPicker';
import { CasePicker } from '../title/CasePicker';
import { selectCaseCards, type CaseCardModel } from '../title/caseCardModel';
import { NewCaseConfirm } from '../title/NewCaseConfirm';
import { SaveRecoveryScreen } from '../title/SaveRecoveryScreen';
import { SettingsPage } from '../title/SettingsPage';
import { nextTitleStage, selectTitleActions, type TitleStage } from '../title/titleModel';
import { usePauseShortcut } from '../pause/usePauseShortcut';
import { DeductionBoard } from '../deduction/DeductionBoard';
import { PaperCueContext } from '../investigation/pagination/PaperCueContext';
import { useDeductionShortcut } from '../deduction/useDeductionShortcut';
import { useNotebookShortcut } from '../notebook/useNotebookShortcut';
import { DialogueLog, groupDialogueLog } from '../dialogue/DialogueLog';
import { useDialogueLogShortcut } from '../dialogue/useDialogueLogShortcut';
import { useMinimapShortcut } from '../hud/useMinimapShortcut';
import { EvidenceModal } from '../evidence/EvidenceModal';
import { NotebookPanel } from '../notebook/NotebookPanel';
import { createGameStore, type GameStore } from '../state/gameStore';
import { getInitialHudVisibility } from '../hud/initialHudVisibility';
import { createWorldCueSource } from '../bridge/worldCueSource';
import { createInteractionEligibilitySource } from '../bridge/interactionEligibility';
import { createPresentationAudio } from '../audio/presentationAudio';
import { PresentationAudioProvider } from '../audio/PresentationAudioContext';
import { connectPresentationAudio } from '../bridge/connectPresentationAudio';
import { GameStoreProvider, useGameStore } from '../state/GameStoreContext';
import { createGame } from './createGame';
import { waitForFonts } from './fontReady';
import {
  createLearningRepository,
  type LearningLoadResult,
} from '../persistence/learningRepository';
import {
  createSettingsRepository,
  type SettingsLoadResult,
} from '../persistence/settingsRepository';
import { createSettingsStore, type SettingsStore } from '../state/settingsStore';
import { createUiSound } from '../audio/uiSound';
import { UI_SOUND_FILES } from '../audio/uiSoundManifest';
import { useUiSoundDelegation } from '../audio/useUiSoundDelegation';
import { SettingsStoreProvider } from '../state/SettingsStoreContext';
import { useMasterVolume } from '../audio/useMasterVolume';
import { useSettingsStore } from '../state/SettingsStoreContext';
import { useTranslationMode } from '../state/useTranslationMode';
import { connectSettingsAutosave } from '../persistence/connectSettingsAutosave';
import { createDefaultLearningRecord } from '../persistence/learningMigration';
import { createLearningStore, type LearningStore } from '../state/learningStore';
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
type ShellContent = { strings: UiStrings; cards: CaseCardModel[] };
type ShellResult = { ok: true; content: ShellContent } | { ok: false; error: Error };

function toError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}

/** Content every case shares: UI strings and the case catalogue shown by the picker. */
function loadShellContent(): ShellResult {
  try {
    const strings = loadUiStrings('vi');
    return { ok: true, content: { strings, cards: selectCaseCards(listCaseCatalogue(), strings) } };
  } catch (err) {
    const error = toError(err);
    console.error('[CaseEngine] failed to load shared content', error);
    return { ok: false, error };
  }
}

function loadCaseContent(caseId: string, strings: UiStrings): LoadResult {
  try {
    const caseDefinition = loadCaseDefinition(caseId);
    const scene = caseDefinition.scenes.find(({ id }) => id === caseDefinition.startSceneId);
    if (!scene?.spawnPoints.default)
      throw new Error(
        `Start scene "${caseDefinition.startSceneId}" or its default spawn is missing`,
      );
    return { ok: true, content: { caseDefinition, strings } };
  } catch (err) {
    const error = toError(err);
    console.error('[CaseEngine] failed to load case content', error);
    return { ok: false, error };
  }
}

function ContentError({ error }: { error: Error }): JSX.Element {
  const issues = error instanceof ContentValidationError ? error.issues : [];
  return (
    <pre role="alert" className="game-load-error">
      {error.message}
      {issues.length > 0 ? `\n\nIssues:\n${issues.map((i) => `- ${i}`).join('\n')}` : ''}
    </pre>
  );
}

const NO_SUBSCRIBE = (): (() => void) => () => undefined;

/** The in-game "reduce motion" setting as render state (false until settings have loaded). */
function useReducedMotion(settings: SettingsStore | null): boolean {
  return useSyncExternalStore(
    settings ? settings.subscribe : NO_SUBSCRIBE,
    () => settings?.getState().settings.reducedMotion ?? false,
    () => false,
  );
}

/** Root attributes: the CSS motion switch (`lexicon-motion-off`) plus the data attribute E2E reads. */
function rootAttributes(reduced: boolean) {
  return {
    className: reduced ? 'game-root lexicon-motion-off' : 'game-root',
    'data-reduced-motion': reduced ? 'true' : 'false',
  } as const;
}

export function GameCanvas({
  commerceConfigProvider = defaultCommerceConfigProvider,
}: {
  commerceConfigProvider?: CommerceConfigProvider;
} = {}) {
  const shell = useMemo(loadShellContent, []);
  const repository = useMemo(createSaveRepository, []);
  const learningRepository = useMemo(createLearningRepository, []);
  const settingsRepository = useMemo(createSettingsRepository, []);
  const bootPromiseRef = useRef<Promise<{
    learning: LearningLoadResult;
    settings: SettingsLoadResult;
  }> | null>(null);
  const [learningLoad, setLearningLoad] = useState<LearningLoadResult | null>(null);
  const [settingsLoad, setSettingsLoad] = useState<SettingsLoadResult | null>(null);
  const [bootError, setBootError] = useState<Error | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const settings = useMemo(
    () => (settingsLoad ? createSettingsStore(settingsLoad.settings) : null),
    [settingsLoad],
  );
  const [settingsWriteError, setSettingsWriteError] = useState<string | null>(null);
  const settingsStrings = shell.ok ? shell.content.strings : null;
  const reducedMotion = useReducedMotion(settings);
  const uiSound = useMemo(
    () =>
      settings
        ? createUiSound({
            files: UI_SOUND_FILES,
            enabled: () => settings.getState().settings.uiSounds,
            volume: () => settings.getState().settings.volume,
          })
        : null,
    [settings],
  );
  useEffect(() => () => uiSound?.dispose(), [uiSound]);
  useUiSoundDelegation(typeof document === 'undefined' ? null : document, uiSound);

  useEffect(() => {
    if (!settings || !settingsLoad || !settingsStrings || settingsLoad.status === 'memory-only')
      return;
    return connectSettingsAutosave(
      settings,
      async (next) => {
        await settingsRepository.saveSettings(next);
        setSettingsWriteError(null);
      },
      () => setSettingsWriteError(settingsStrings.settingsUnavailable),
    );
  }, [settings, settingsLoad, settingsRepository, settingsStrings]);

  useEffect(() => {
    if (!shell.ok) return;
    // One load per mount: StrictMode re-runs effects and a second settings load
    // would hide the "recovered" status of the first. Learning progress is global,
    // so the record is validated against the vocabulary of every registered case.
    if (!bootPromiseRef.current) {
      try {
        const { catalogue, contexts } = loadAllVocabulary();
        bootPromiseRef.current = learningRepository
          .loadLearning(catalogue, contexts)
          .then(async (learning) => {
            const legacy =
              ('legacyTranslationMode' in learning ? learning.legacyTranslationMode : null) ??
              (await learningRepository.findLegacyTranslationMode());
            const settings = await settingsRepository.loadSettings(
              legacy ? { translationMode: legacy } : {},
            );
            return { learning, settings };
          });
      } catch (err) {
        console.error('[Learning] failed to load shared vocabulary', err);
        setBootError(toError(err));
        return;
      }
    }
    let active = true;
    void bootPromiseRef.current.then(({ learning, settings }) => {
      if (!active) return;
      setLearningLoad(learning);
      setSettingsLoad(settings);
    });
    return () => {
      active = false;
    };
  }, [shell, learningRepository, settingsRepository]);

  if (!shell.ok) return <ContentError error={shell.error} />;
  if (bootError) return <ContentError error={bootError} />;
  if (!learningLoad || !settingsLoad || !settings)
    return <div role="status">{shell.content.strings.loadingGame}</div>;

  if (selectedCaseId === null) {
    return (
      <div {...rootAttributes(reducedMotion)}>
        <CasePicker
          strings={shell.content.strings}
          cards={shell.content.cards}
          onSelect={setSelectedCaseId}
        />
      </div>
    );
  }

  return (
    <CaseFlow
      key={selectedCaseId}
      caseId={selectedCaseId}
      strings={shell.content.strings}
      repository={repository}
      learningRepository={learningRepository}
      learningLoad={learningLoad}
      settings={settings}
      settingsLoad={settingsLoad}
      settingsWriteError={settingsWriteError}
      commerceConfigProvider={commerceConfigProvider}
      onChangeCase={() => setSelectedCaseId(null)}
    />
  );
}

/** One chosen case: its own save bootstrap, title flow and game. Remounted per case. */
function CaseFlow({
  caseId,
  strings: sharedStrings,
  repository,
  learningRepository,
  learningLoad,
  settings,
  settingsLoad,
  settingsWriteError,
  commerceConfigProvider,
  onChangeCase,
}: {
  caseId: string;
  strings: UiStrings;
  repository: SaveRepository;
  learningRepository: ReturnType<typeof createLearningRepository>;
  learningLoad: LearningLoadResult;
  settings: SettingsStore;
  settingsLoad: SettingsLoadResult;
  settingsWriteError: string | null;
  commerceConfigProvider: CommerceConfigProvider;
  onChangeCase: () => void;
}) {
  const result = useMemo(() => loadCaseContent(caseId, sharedStrings), [caseId, sharedStrings]);
  const [bootstrap, setBootstrap] = useState<GameBootstrapResult | { status: 'loading' }>({
    status: 'loading',
  });
  const [stage, setStage] = useState<TitleStage>('title');
  const [startMode, setStartMode] = useState<'continue' | 'new'>('continue');
  const [runId, setRunId] = useState(0);
  const [startError, setStartError] = useState<string | null>(null);
  const shellReducedMotion = useReducedMotion(settings);

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
          activeSceneId: result.content.caseDefinition.startSceneId,
          saveAvailability: 'memory-only',
          commerceConfig: FREE_COMMERCE_CONFIG,
          autosaveEnabled: false,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    return () => {
      active = false;
    };
  }, [result, repository, commerceConfigProvider]);

  if (!result.ok) return <ContentError error={result.error} />;

  if (bootstrap.status === 'loading') {
    return <div role="status">{result.content.strings.loadingGame}</div>;
  }

  if (bootstrap.status === 'confirmation-required') {
    return (
      <div {...rootAttributes(shellReducedMotion)}>
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
                  activeSceneId: result.content.caseDefinition.startSceneId,
                  source: 'fresh',
                  saveAvailability: 'missing',
                  commerceConfig: bootstrap.commerceConfig,
                  autosaveEnabled: true,
                });
              })
              .catch((error: unknown) => {
                setBootstrap({
                  status: 'memory-only',
                  initialState: createCaseState(result.content.caseDefinition),
                  activeSceneId: result.content.caseDefinition.startSceneId,
                  saveAvailability: 'memory-only',
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
              activeSceneId: result.content.caseDefinition.startSceneId,
              saveAvailability: 'memory-only',
              commerceConfig: bootstrap.commerceConfig,
              autosaveEnabled: false,
              error: result.content.strings.saveUnavailable,
            })
          }
        />
      </div>
    );
  }

  const strings = result.content.strings;
  const caseDefinition = result.content.caseDefinition;
  const actions = selectTitleActions({
    save: bootstrap.saveAvailability,
    settingsStatus: settingsLoad.status,
  });
  const flow = {
    hasSave: bootstrap.saveAvailability === 'loaded',
    askSupportLevel: actions.askSupportLevel,
  };
  const go = (event: Parameters<typeof nextTitleStage>[1]) =>
    setStage((current) => nextTitleStage(current, event, flow));

  const play = (mode: 'continue' | 'new', replaceSave: boolean): void => {
    setStartError(null);
    if (!replaceSave) {
      setStartMode(mode);
      setRunId((id) => id + 1);
      setStage('playing');
      return;
    }
    void repository
      .startNewCase(caseDefinition.id, caseDefinition)
      .then((initialState) => {
        setBootstrap({
          status: 'ready',
          initialState,
          activeSceneId: result.content.caseDefinition.startSceneId,
          source: 'fresh',
          saveAvailability: 'missing',
          commerceConfig: bootstrap.commerceConfig,
          autosaveEnabled: true,
        });
        setStartMode('new');
        setRunId((id) => id + 1);
        setStage('playing');
      })
      .catch((error: unknown) => {
        setStartError(error instanceof Error ? error.message : String(error));
        setStage('title');
      });
  };

  if (stage !== 'playing') {
    const titleLearning: InvestigationLearningProps = {
      catalogue: caseDefinition.vocabulary,
      strings,
      translationMode: settings.getState().settings.translationMode,
      onEncounter: () => undefined,
      onInspect: () => undefined,
      onRevealTranslation: () => undefined,
    };
    return (
      <div {...rootAttributes(shellReducedMotion)}>
        <SettingsStoreProvider store={settings}>
          {stage === 'title' && (
            <>
              <TitleScreen
                strings={strings}
                caseTitle={caseDefinition.title}
                actions={actions}
                onContinue={() => play('continue', false)}
                onNewCase={() => {
                  if (flow.hasSave) go('newCase');
                  else if (flow.askSupportLevel) go('newCase');
                  else play('new', false);
                }}
                onHowTo={() => go('howTo')}
                onSettings={() => go('settings')}
                onChangeCase={onChangeCase}
              />
              {startError && (
                <aside role="alert" className="learning-recovery-notice">
                  {strings.saveWriteFailed} {startError}
                </aside>
              )}
            </>
          )}
          {stage === 'confirm' && (
            <NewCaseConfirm
              strings={strings}
              onCancel={() => go('back')}
              onAccept={() => {
                if (flow.askSupportLevel) go('confirmed');
                else play('new', true);
              }}
            />
          )}
          {stage === 'support' && (
            <SupportPicker
              strings={strings}
              caseTitle={caseDefinition.title}
              onChoose={(mode) => {
                settings.getState().setTranslationMode(mode);
                play('new', flow.hasSave);
              }}
            />
          )}
          {stage === 'settings' && (
            <SettingsPage
              strings={strings}
              caseTitle={caseDefinition.title}
              onBack={() => go('back')}
            />
          )}
          {stage === 'howto' && (
            <HowToInvestigate learning={titleLearning} onClose={() => go('back')} />
          )}
        </SettingsStoreProvider>
      </div>
    );
  }

  const persistenceWarning =
    bootstrap.status === 'memory-only'
      ? `${strings.saveUnavailable} ${bootstrap.error}`
      : undefined;
  return (
    <GameRoot
      key={runId}
      content={result.content}
      startMode={startMode}
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
      settings={settings}
      settingsLoad={settingsLoad}
      settingsWriteError={settingsWriteError}
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

function GameRoot({
  content,
  startMode,
  initialState,
  initialSceneId,
  autosaveEnabled,
  persistenceWarning,
  repository,
  learningRepository,
  learningRecord,
  settings,
  settingsLoad,
  settingsWriteError,
  learningPersistenceInitiallyEnabled,
  learningRecoveryRequired,
  learningPersistenceError,
}: {
  content: StartContent;
  startMode: 'continue' | 'new';
  initialState: ReturnType<typeof createCaseState>;
  initialSceneId: string;
  autosaveEnabled: boolean;
  persistenceWarning?: string;
  repository: SaveRepository;
  learningRepository: ReturnType<typeof createLearningRepository>;
  learningRecord: ReturnType<typeof createDefaultLearningRecord>;
  settings: SettingsStore;
  settingsLoad: SettingsLoadResult;
  settingsWriteError: string | null;
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
        initialBriefingOpen: startMode === 'new' && Boolean(caseDefinition.briefing),
        initialHudVisibility: getInitialHudVisibility(
          typeof window === 'undefined' ? 1024 : window.innerWidth,
          typeof window === 'undefined' ? 768 : window.innerHeight,
        ),
        ...(persistenceWarning ? { initialPersistenceError: persistenceWarning } : {}),
      }),
      bus: createEventBus<GameEventMap>(),
    }),
    [caseDefinition, initialState, initialSceneId, persistenceWarning, startMode],
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
  const paperCue = useCallback(() => bus.emit('audio:cue', { cue: 'paper' }), [bus]);
  const presentationAudio = useMemo(
    () => createPresentationAudio(caseDefinition),
    [caseDefinition],
  );
  const worldCueSource = useMemo(
    () => createWorldCueSource(store, caseDefinition),
    [store, caseDefinition],
  );
  const interactionEligibility = useMemo(
    () => createInteractionEligibilitySource(store, caseDefinition),
    [store, caseDefinition],
  );
  const reducedMotion = useSyncExternalStore(
    settings.subscribe,
    () => settings.getState().settings.reducedMotion,
    () => false,
  );
  useEffect(() => () => presentationAudio.dispose(), [presentationAudio]);
  usePauseShortcut(store);
  useNotebookShortcut(store);
  useDialogueLogShortcut(store);
  useDeductionShortcut(store);
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
    presentationAudio.activate();
    const removeFirstGestureListeners = () => {
      window.removeEventListener('pointerdown', activateAmbientMusic, true);
      window.removeEventListener('keydown', activateAmbientMusic, true);
    };
    const activateAmbientMusic = (event: Event) => {
      if (!event.isTrusted) return;
      removeFirstGestureListeners();
      presentationAudio.startMusicFromGesture();
    };
    window.addEventListener('pointerdown', activateAmbientMusic, { capture: true, passive: true });
    window.addEventListener('keydown', activateAmbientMusic, true);
    const disconnectPresentationAudio = connectPresentationAudio(
      bus,
      store,
      caseDefinition,
      presentationAudio,
    );
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
    let cancelled = false;
    let game: ReturnType<typeof createGame> | null = null;
    // Canvas text is measured once, so wait (briefly) for the bundled fonts before booting Phaser.
    void waitForFonts(
      document.fonts,
      ['500 20px "IBM Plex Mono"', '400 16px "Literata"'],
      3000,
    ).then((fontResult) => {
      if (cancelled) return;
      if (fontResult === 'timeout' && import.meta.env.DEV)
        console.warn('[Assets] fonts not ready, using fallback');
      game = createGame(container, {
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
        worldCueIds: () => worldCueSource.visibleIds(store.getState().activeSceneId),
        hudInsets: () => store.getState().hudInsets,
        interactionAvailable: interactionEligibility.isAvailable,
      });
    });
    return () => {
      cancelled = true;
      game?.destroy(true);
      disconnect();
      disconnectCaseEngine();
      disconnectPresentationAudio();
      removeFirstGestureListeners();
      disconnectAutosave?.();
    };
  }, [
    scene,
    bus,
    store,
    settings,
    caseDefinition,
    autosaveEnabled,
    repository,
    strings,
    worldCueSource,
    interactionEligibility,
    presentationAudio,
  ]);

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

  const settingsNotice =
    settingsLoad.status === 'memory-only' || settingsWriteError
      ? strings.settingsUnavailable
      : settingsLoad.status === 'recovered'
        ? strings.settingsRecovered
        : null;

  return (
    <div {...rootAttributes(reducedMotion)}>
      <div
        ref={containerRef}
        tabIndex={-1}
        aria-label={strings.caseFile}
        style={{ width: '100%', height: '100%' }}
      />
      {showPaperOverlay && <div className="game-paper-overlay" aria-hidden="true" />}
      <GameStoreProvider store={store}>
        <PresentationAudioProvider audio={presentationAudio}>
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
                            error instanceof Error
                              ? error.message
                              : strings.vocabularyLearningError,
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
              <Hud strings={strings} bus={bus} />
              <CoachLayer strings={strings} bus={bus} store={store} learning={learning} />
              <PersistenceNotice strings={strings} />
              <DialogueLayer strings={strings} returnFocusRef={containerRef} />
              <DialogueLogLayer strings={strings} />
              <PaperCueContext.Provider value={paperCue}>
                <BriefingLayer strings={strings} returnFocusRef={containerRef} />
              </PaperCueContext.Provider>
              <PauseLayer strings={strings} store={store} />
              <EvidenceLayer strings={strings} />
              <PaperCueContext.Provider value={paperCue}>
                <NotebookLayer strings={strings} caseDefinition={caseDefinition} />
                <DeductionLayer strings={strings} caseDefinition={caseDefinition} />
              </PaperCueContext.Provider>
              <CaseSummaryLayer strings={strings} />
            </SettingsStoreProvider>
          </LearningStoreProvider>
        </PresentationAudioProvider>
      </GameStoreProvider>
    </div>
  );
}

/** Applies settings that have no UI of their own (currently master volume). */
function SettingsEffects(): null {
  useMasterVolume(useSettingsStore((state) => state.settings.volume));
  return null;
}

function CoachLayer({
  strings,
  bus,
  store,
  learning,
}: {
  strings: UiStrings;
  bus: ReturnType<typeof createEventBus<GameEventMap>>;
  store: GameStore;
  learning: LearningStore;
}): JSX.Element | null {
  const progress = useOnboardingSignals(bus, store, learning);
  const noteId = selectCoachNote(progress);
  if (noteId === null) return null;
  return (
    <CoachNote
      strings={strings}
      noteId={noteId}
      onDismiss={() => learning.getState().markOnboardingSeen(noteId)}
    />
  );
}

function BriefingLayer({
  strings,
  returnFocusRef,
}: {
  strings: UiStrings;
  returnFocusRef: React.RefObject<HTMLElement | null>;
}): JSX.Element | null {
  const briefingOpen = useGameStore((state) => state.briefingOpen);
  const caseDefinition = useGameStore((state) => state.caseDefinition);
  const closeBriefing = useGameStore((state) => state.closeBriefing);
  const dispatchLearning = useLearningStore((state) => state.dispatchLearning);
  const vocabularyTutorialSeen = useLearningStore((state) => state.vocabularyTutorialSeen);
  const markVocabularyTutorialSeen = useLearningStore((state) => state.markVocabularyTutorialSeen);
  const [translationMode] = useTranslationMode();
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
  if (!briefingOpen || !caseDefinition.briefing) return null;
  return (
    <BriefingMemo
      caseId={caseDefinition.id}
      briefing={caseDefinition.briefing}
      strings={strings}
      vocabulary={caseDefinition.vocabulary}
      translationMode={translationMode}
      vocabularyTutorialSeen={vocabularyTutorialSeen}
      onVocabularyTutorialSeen={markVocabularyTutorialSeen}
      onEncounter={onEncounter}
      onInspect={onInspect}
      onRevealTranslation={onRevealTranslation}
      onAccept={closeBriefing}
      returnFocusRef={returnFocusRef}
    />
  );
}

function DialogueLogLayer({ strings }: { strings: UiStrings }) {
  const open = useGameStore((state) => state.dialogueLogOpen);
  const definition = useGameStore((state) => state.caseDefinition);
  const entries = useGameStore((state) => state.dialogueLog);
  const close = useGameStore((state) => state.closeDialogueLog);
  if (!open) return null;
  return (
    <DialogueLog strings={strings} groups={groupDialogueLog(definition, entries)} onClose={close} />
  );
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
  const [translationMode] = useTranslationMode();
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
  const [translationMode] = useTranslationMode();
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
      reading={store.notebookReading}
      onReadingChange={store.setNotebookReading}
      onClose={() => store.toggleNotebook()}
      profile={learningProfile}
      translationMode={translationMode}
      onRevealTranslation={onRevealTranslation}
      onEncounter={onEncounter}
      onInspect={onInspect}
      onOpenDeduction={() => store.openDeduction()}
      onReviewEvidence={(evidenceId) => store.reviewEvidence(evidenceId)}
    />
  );
}

function DeductionLayer({
  strings,
  caseDefinition,
}: {
  strings: UiStrings;
  caseDefinition: CaseDefinition;
}) {
  const deductionOpen = useGameStore((state) => state.deductionOpen);
  const caseState = useGameStore((state) => state.caseState);
  const store = useGameStore((state) => state);
  const dispatchLearning = useLearningStore((state) => state.dispatchLearning);
  const [translationMode] = useTranslationMode();
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
  if (!deductionOpen) return null;
  return (
    <DeductionBoard
      caseDefinition={caseDefinition}
      caseState={caseState}
      strings={strings}
      onClose={() => store.closeDeduction()}
      translationMode={translationMode}
      onRevealTranslation={onRevealTranslation}
      onEncounter={onEncounter}
      onInspect={onInspect}
      onOpenNotebook={() => store.openNotebook()}
      onPlaceTimelineEvent={(eventId, slotId) => store.placeTimelineEvent(eventId, slotId)}
      onSubmitContradiction={(id, facts) => store.submitContradiction(id, facts)}
      onSubmitAccusation={(id) => store.submitAccusation(id)}
      onReviewEvidence={(evidenceId) => store.reviewEvidence(evidenceId)}
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
  const dispatchLearning = useLearningStore((state) => state.dispatchLearning);
  const [translationMode] = useTranslationMode();
  const catalogue = useGameStore((state) => state.caseDefinition.vocabulary);
  const [howToOpen, setHowToOpen] = useState(false);
  useEffect(() => {
    if (!paused) setHowToOpen(false);
  }, [paused]);
  useEffect(() => {
    if (!howToOpen) return;
    // Esc closes the how-to page first; the pause menu stays open underneath.
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setHowToOpen(false);
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [howToOpen]);
  const learning = useMemo<InvestigationLearningProps>(
    () => ({
      catalogue,
      strings,
      translationMode,
      onEncounter: (vocabularyId: string, contextId: string) =>
        dispatchLearning({ type: 'encounterContext', vocabularyId, contextId }),
      onInspect: (vocabularyId: string, contextId: string) =>
        dispatchLearning({ type: 'inspectVocabulary', vocabularyId, contextId }),
      onRevealTranslation: (vocabularyId: string, contextId: string) =>
        dispatchLearning({ type: 'revealTranslation', vocabularyId, contextId }),
    }),
    [catalogue, strings, translationMode, dispatchLearning],
  );
  if (!paused) return null;
  return (
    <>
      <PauseMenu
        strings={strings}
        onResume={() => store.getState().setPaused(false)}
        onOpenHowTo={() => setHowToOpen(true)}
      />
      {howToOpen && <HowToInvestigate learning={learning} onClose={() => setHowToOpen(false)} />}
    </>
  );
}
