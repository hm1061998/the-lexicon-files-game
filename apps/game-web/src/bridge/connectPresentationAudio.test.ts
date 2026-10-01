import { describe, expect, it, vi } from 'vitest';
import { loadCaseDefinition } from '@lexicon/game-content';
import type { PresentationAudio } from '../audio/presentationAudio';
import { connectCaseEngine } from './connectCaseEngine';
import { createGameStore } from '../state/gameStore';
import { connectPresentationAudio } from './connectPresentationAudio';
import { createEventBus } from './eventBus';

function setup() {
  const definition = loadCaseDefinition('case-001');
  const store = createGameStore({ caseDefinition: definition });
  const bus = createEventBus();
  const cues: string[] = [];
  const voices: string[] = [];
  const audio = {
    playCue: (cue: string) => cues.push(cue),
    setListeningActive: vi.fn(),
    setPaused: vi.fn(),
    startMusicFromGesture: vi.fn(),
    stopVoice: vi.fn(),
    playVoice: (key: string) => voices.push(key),
    replayVoice: vi.fn(),
    getVoiceState: () => ({ status: 'idle', key: null }),
    subscribeVoice: () => () => undefined,
    dispose: vi.fn(),
  } as unknown as PresentationAudio;
  const disconnectEngine = connectCaseEngine(bus, store, definition);
  const disconnectAudio = connectPresentationAudio(bus, store, definition, audio);
  const disconnect = () => {
    disconnectEngine();
    disconnectAudio();
  };
  return { definition, store, bus, audio, cues, voices, disconnect };
}

describe('presentation cue bridge', () => {
  it('pauses and resumes presentation music with the game pause state', () => {
    const { store, audio, disconnect } = setup();
    store.getState().togglePause();
    expect(audio.setPaused).toHaveBeenLastCalledWith(true);
    store.getState().togglePause();
    expect(audio.setPaused).toHaveBeenLastCalledWith(false);
    disconnect();
  });

  it('emits one UI cue for a visibility action and ignores rejected locked actions', () => {
    const { store, cues, disconnect } = setup();
    store.getState().toggleMinimap();
    store.getState().togglePause();
    store.getState().toggleObjective();
    expect(cues).toEqual(['ui', 'ui']);
    disconnect();
  });

  it('plays the current node voice once and stops it when dialogue closes', () => {
    const { store, voices, audio, disconnect } = setup();
    expect(store.getState().startDialogue('anna')).toBe(true);
    expect(voices).toHaveLength(1);
    const session = store.getState().dialogueSession!;
    store
      .getState()
      .chooseDialogue({ nodeId: session.nodeId, revision: session.revision, choiceId: 'q1' });
    expect(voices).toHaveLength(2);
    expect(voices[1]).toContain('answer1');
    store.getState().closeDialogue();
    expect(audio.stopVoice).toHaveBeenCalled();
    disconnect();
  });

  it('plays one door cue for a successful scene transition interaction', () => {
    const { bus, cues, audio, store, disconnect } = setup();
    bus.emit('interaction:triggered', { interactableId: 'hallway_door' });
    expect(cues).toEqual(['door']);
    expect(store.getState().activeSceneId).toBe('archive');
    expect(audio.stopVoice).toHaveBeenCalled();
    disconnect();
  });
});
