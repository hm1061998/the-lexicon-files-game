import { describe, expect, it, vi } from 'vitest';
import { createStore } from 'zustand/vanilla';
import { loadCaseDefinition } from '@lexicon/game-content';
import type { GameEventMap } from '@lexicon/shared-types';
import { createEventBus } from '../bridge/eventBus';
import { createGameStore } from '../state/gameStore';
import { createOnboardingSignals, type OnboardingLearning } from './useOnboardingSignals';
import { allOnboardingSeen, type OnboardingSeen, type CoachNoteId } from './onboardingTypes';

function setup(options: { briefing?: boolean; seen?: OnboardingSeen } = {}) {
  const bus = createEventBus<GameEventMap>();
  const store = createGameStore({
    caseDefinition: loadCaseDefinition('case-001'),
    initialBriefingOpen: options.briefing === true,
  });
  const marks: CoachNoteId[] = [];
  const learningStore = createStore<{
    onboardingSeen: OnboardingSeen;
    markOnboardingSeen(id: CoachNoteId): void;
  }>((set) => ({
    onboardingSeen: options.seen ?? allOnboardingSeen(false),
    markOnboardingSeen(id) {
      marks.push(id);
      set((state) =>
        state.onboardingSeen[id]
          ? state
          : { onboardingSeen: { ...state.onboardingSeen, [id]: true } },
      );
    },
  }));
  const learning: OnboardingLearning = learningStore;
  const signals = createOnboardingSignals(bus, store, learning);
  const listener = vi.fn();
  const unsubscribe = signals.subscribe(listener);
  const listenerCount = () => {
    // The bus has no public count: a probe emit shows whether anything still reacts.
    const before = signals.getSnapshot();
    bus.emit('interaction:nearby', { interactableId: 'probe', prompt: 'probe' });
    return signals.getSnapshot() !== before;
  };
  return { bus, store, marks, signals, listener, unsubscribe, listenerCount };
}
const at = (x: number, y = 0) => ({ coordinateSpace: 'screen' as const, x, y });

describe('createOnboardingSignals', () => {
  it('does not count the first position as movement, only a later change beyond the threshold', () => {
    const { bus, signals } = setup();
    bus.emit('player:moved', at(100));
    expect(signals.getSnapshot().moved).toBe(false);
    bus.emit('player:moved', at(104));
    expect(signals.getSnapshot().moved).toBe(false);
    bus.emit('player:moved', at(120));
    expect(signals.getSnapshot().moved).toBe(true);
  });
  it('measures logical positions in tile units', () => {
    const { bus, signals } = setup();
    const logical = (x: number) => ({ coordinateSpace: 'logical' as const, x, y: 5 });
    bus.emit('player:moved', logical(5));
    bus.emit('player:moved', logical(5.1));
    expect(signals.getSnapshot().moved).toBe(false);
    bus.emit('player:moved', logical(5.5));
    expect(signals.getSnapshot().moved).toBe(true);
  });
  it('marks a performed move as seen so the note never appears late', () => {
    const { bus, marks } = setup();
    bus.emit('player:moved', at(0));
    bus.emit('player:moved', at(50));
    expect(marks).toEqual(['move']);
  });
  it('ignores movement while the briefing is open and re-baselines when it closes', () => {
    const { bus, store, signals } = setup({ briefing: true });
    bus.emit('player:moved', at(0));
    bus.emit('player:moved', at(500));
    expect(signals.getSnapshot().moved).toBe(false);
    store.getState().closeBriefing();
    bus.emit('player:moved', at(500));
    expect(signals.getSnapshot().moved).toBe(false);
    bus.emit('player:moved', at(600));
    expect(signals.getSnapshot().moved).toBe(true);
  });
  it('tracks nearby and interaction events', () => {
    const { bus, signals } = setup();
    bus.emit('interaction:nearby', { interactableId: 'x', prompt: 'p' });
    expect(signals.getSnapshot()).toMatchObject({ nearbyShown: true, interacted: false });
    bus.emit('interaction:triggered', { interactableId: 'x' });
    expect(signals.getSnapshot().interacted).toBe(true);
  });
  it('marks the notebook note exactly once when the notebook opens', () => {
    const { store, marks } = setup();
    store.getState().openNotebook();
    store.getState().toggleNotebook();
    store.getState().openNotebook();
    expect(marks.filter((id) => id === 'notebook')).toEqual(['notebook']);
  });
  it('reports modalOpen from the store', () => {
    const { store, signals } = setup();
    expect(signals.getSnapshot().modalOpen).toBe(false);
    store.getState().setPaused(true);
    expect(signals.getSnapshot().modalOpen).toBe(true);
  });
  it('stops reacting after the last subscriber leaves', () => {
    const { bus, store, signals, unsubscribe, marks, listenerCount } = setup();
    expect(listenerCount()).toBe(true);
    unsubscribe();
    const before = signals.getSnapshot();
    bus.emit('interaction:triggered', { interactableId: 'x' });
    store.getState().openNotebook();
    expect(signals.getSnapshot()).toBe(before);
    expect(marks).toEqual([]);
  });
});
