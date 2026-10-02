import { useMemo, useSyncExternalStore } from 'react';
import type { EventBus, GameEventMap } from '@lexicon/shared-types';
import type { GameStore } from '../state/gameStore';
import { completedNotes, type CoachProgress } from './selectCoachNote';
import type { CoachNoteId, OnboardingSeen } from './onboardingTypes';

/** Movement beyond this many units from the baseline counts as the player moving. */
export const MOVE_THRESHOLD = 8;

export interface OnboardingLearning {
  getState(): { onboardingSeen: OnboardingSeen; markOnboardingSeen(id: CoachNoteId): void };
  subscribe(listener: () => void): () => void;
}

export interface OnboardingSignals {
  subscribe(listener: () => void): () => void;
  getSnapshot(): CoachProgress;
}

type Position = { coordinateSpace: 'screen' | 'logical'; x: number; y: number };

/**
 * Derives coach progress from shared events and store state. Listeners are attached while at
 * least one subscriber exists and fully removed afterwards.
 */
export function createOnboardingSignals(
  bus: EventBus<GameEventMap>,
  store: GameStore,
  learning: OnboardingLearning,
): OnboardingSignals {
  const flags = {
    moved: false,
    nearbyShown: false,
    interacted: false,
    notebookOpened: false,
    boardOpened: false,
  };
  let baseline: Position | null = null;
  let wasBriefing = store.getState().briefingOpen;
  const subscribers = new Set<() => void>();
  let detach: (() => void) | null = null;

  const compute = (): CoachProgress => {
    const game = store.getState();
    return {
      seen: learning.getState().onboardingSeen,
      ...flags,
      hasEvidence: game.caseState.evidenceIds.length > 0,
      hasFacts: game.caseState.discoveredFactIds.length > 0,
      modalOpen:
        game.paused ||
        game.briefingOpen ||
        game.dialogueSession !== null ||
        game.activeEvidenceId !== null ||
        game.notebookOpen ||
        game.deductionOpen,
    };
  };
  const same = (a: CoachProgress, b: CoachProgress): boolean =>
    (Object.keys(a) as (keyof CoachProgress)[]).every((key) =>
      key === 'seen' ? a.seen === b.seen : a[key] === b[key],
    );

  let snapshot = compute();
  const refresh = (): void => {
    const next = compute();
    for (const id of completedNotes(next)) learning.getState().markOnboardingSeen(id);
    const after = compute();
    if (same(snapshot, after)) return;
    snapshot = after;
    subscribers.forEach((listener) => listener());
  };

  const attach = (): (() => void) => {
    const offMoved = bus.on('player:moved', (position) => {
      const game = store.getState();
      if (game.briefingOpen) {
        baseline = null;
        return;
      }
      if (flags.moved) return;
      if (baseline === null || baseline.coordinateSpace !== position.coordinateSpace) {
        baseline = position;
        return;
      }
      if (Math.hypot(position.x - baseline.x, position.y - baseline.y) > MOVE_THRESHOLD) {
        flags.moved = true;
        refresh();
      }
    });
    const offNearby = bus.on('interaction:nearby', () => {
      if (flags.nearbyShown) return;
      flags.nearbyShown = true;
      refresh();
    });
    const offTriggered = bus.on('interaction:triggered', () => {
      if (flags.interacted) return;
      flags.interacted = true;
      refresh();
    });
    const offStore = store.subscribe((state) => {
      if (wasBriefing && !state.briefingOpen) baseline = null;
      wasBriefing = state.briefingOpen;
      if (state.notebookOpen) flags.notebookOpened = true;
      if (state.deductionOpen) flags.boardOpened = true;
      refresh();
    });
    const offLearning = learning.subscribe(refresh);
    return () => {
      offMoved();
      offNearby();
      offTriggered();
      offStore();
      offLearning();
    };
  };

  return {
    subscribe(listener) {
      subscribers.add(listener);
      detach ??= attach();
      return () => {
        subscribers.delete(listener);
        if (subscribers.size === 0) {
          detach?.();
          detach = null;
        }
      };
    },
    getSnapshot: () => snapshot,
  };
}

export function useOnboardingSignals(
  bus: EventBus<GameEventMap>,
  store: GameStore,
  learning: OnboardingLearning,
): CoachProgress {
  const signals = useMemo(
    () => createOnboardingSignals(bus, store, learning),
    [bus, store, learning],
  );
  return useSyncExternalStore(signals.subscribe, signals.getSnapshot, signals.getSnapshot);
}
