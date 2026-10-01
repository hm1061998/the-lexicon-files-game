import { Howl, type HowlOptions } from 'howler';
import type { AudioCue, CaseDefinition, DialogueAudio } from '@lexicon/shared-types';

export type VoiceState = {
  status: 'idle' | 'loading' | 'playing' | 'ended' | 'blocked' | 'error';
  key: string | null;
};
type HowlEvent = 'play' | 'end' | 'loaderror' | 'playerror';
type Callback = (soundId: number, error?: unknown) => void;
export interface AudioHowl {
  on(event: HowlEvent, callback: Callback): AudioHowl;
  off(event: HowlEvent, callback?: Callback): AudioHowl;
  play(): number;
  pause(): AudioHowl;
  stop(): AudioHowl;
  unload(): AudioHowl;
  seek(position?: number): number | AudioHowl;
  volume(value?: number): number | AudioHowl;
}
export type PresentationHowlFactory = (options: HowlOptions) => AudioHowl;
export type PresentationAudio = {
  activate(): void;
  startMusicFromGesture(): void;
  setPaused(paused: boolean): void;
  playCue(cue: AudioCue): void;
  setListeningActive(active: boolean): void;
  stopVoice(): void;
  playVoice(key: string, audio: DialogueAudio): void;
  replayVoice(): void;
  getVoiceState(): VoiceState;
  subscribeVoice(listener: (state: VoiceState) => void): () => void;
  dispose(): void;
};

const CUE_GAIN: Record<AudioCue, number> = {
  footstep: 0.18,
  paper: 0.22,
  ui: 0.2,
  evidence: 0.3,
  door: 0.28,
  dialogue: 0.12,
};
const MUSIC_GAIN = 0.07;
const DUCKED_MUSIC_GAIN = 0.025;

export function createPresentationAudio(
  definition: CaseDefinition,
  factory: PresentationHowlFactory = (options) => new Howl(options) as unknown as AudioHowl,
): PresentationAudio {
  const urls = definition.audio?.sfx;
  const musicUrl = definition.audio?.music;
  const howls = new Map<string, AudioHowl>();
  const nextVariant = new Map<AudioCue, number>();
  const voiceListeners = new Set<(state: VoiceState) => void>();
  let listening = false,
    disposed = false,
    voiceGeneration = 0,
    voiceHowl: AudioHowl | null = null;
  let voiceCallbacks: Array<{ event: HowlEvent; callback: Callback }> = [];
  let voiceState: VoiceState = { status: 'idle', key: null };
  let currentVoice: { key: string; audio: DialogueAudio } | null = null;
  let musicHowl: AudioHowl | null = null;
  let musicAttempted = false;
  let paused = false;
  const updateMusicVolume = () => {
    if (!musicHowl) return;
    const voiceActive = voiceState.status === 'playing' || voiceState.status === 'loading';
    musicHowl.volume(listening || voiceActive ? DUCKED_MUSIC_GAIN : MUSIC_GAIN);
  };
  const updateCueVolumes = () => {
    for (const [url, howl] of howls) {
      const cue = (Object.keys(urls ?? {}) as AudioCue[]).find((key) => urls?.[key].includes(url));
      if (cue) howl.volume(volumeFor(cue));
    }
    updateMusicVolume();
  };
  const publishVoice = (next: VoiceState) => {
    voiceState = next;
    voiceListeners.forEach((listener) => listener(next));
    updateCueVolumes();
  };
  const releaseVoice = () => {
    if (!voiceHowl) return;
    voiceCallbacks.forEach(({ event, callback }) => voiceHowl?.off(event, callback));
    voiceCallbacks = [];
    voiceHowl.stop();
    voiceHowl.unload();
    voiceHowl = null;
  };
  const volumeFor = (cue: AudioCue) =>
    cue === 'footstep' && (listening || voiceState.status === 'playing') ? 0.06 : CUE_GAIN[cue];
  const playCue = (cue: AudioCue) => {
    if (disposed || !urls) return;
    const choices = urls[cue];
    if (!choices?.length) return;
    const index = nextVariant.get(cue) ?? 0;
    nextVariant.set(cue, (index + 1) % choices.length);
    const url = choices[index]!;
    let howl = howls.get(url);
    if (!howl) {
      howl = factory({ src: [url], preload: true, html5: false, volume: volumeFor(cue) });
      howls.set(url, howl);
    }
    howl.volume(volumeFor(cue));
    try {
      howl.play();
    } catch {
      /* Local effect failure must not interrupt investigation. */
    }
  };
  const startVoice = (key: string, audio: DialogueAudio) => {
    if (disposed) return;
    releaseVoice();
    voiceGeneration++;
    const generation = voiceGeneration;
    currentVoice = { key, audio };
    publishVoice({ status: 'loading', key });
    try {
      const howl = factory({ src: [audio.url], preload: true, html5: false, volume: 0.48 });
      voiceHowl = howl;
      const bind = (event: HowlEvent, fn: Callback) => {
        const guarded: Callback = (id, error) => {
          if (!disposed && generation === voiceGeneration) fn(id, error);
        };
        voiceCallbacks.push({ event, callback: guarded });
        howl.on(event, guarded);
      };
      bind('play', () => publishVoice({ status: 'playing', key }));
      bind('end', () => publishVoice({ status: 'ended', key }));
      bind('loaderror', () => publishVoice({ status: 'error', key }));
      bind('playerror', () => publishVoice({ status: 'blocked', key }));
      howl.play();
    } catch {
      publishVoice({ status: 'error', key });
    }
  };
  const playVoice = (key: string, audio: DialogueAudio) => {
    if (disposed || currentVoice?.key === key) return;
    startVoice(key, audio);
  };
  const stopVoice = () => {
    voiceGeneration++;
    releaseVoice();
    currentVoice = null;
    if (!disposed) publishVoice({ status: 'idle', key: null });
  };
  return {
    activate() {
      disposed = false;
    },
    startMusicFromGesture() {
      if (disposed || musicAttempted || !musicUrl) return;
      musicAttempted = true;
      try {
        musicHowl = factory({
          src: [musicUrl],
          preload: true,
          html5: false,
          loop: true,
          volume: MUSIC_GAIN,
        });
        updateMusicVolume();
        if (!paused) musicHowl.play();
      } catch {
        /* Audio playback is optional; a rejected browser gesture never blocks gameplay. */
      }
    },
    setPaused(nextPaused) {
      if (disposed || paused === nextPaused) return;
      paused = nextPaused;
      if (!musicHowl) return;
      if (paused) musicHowl.pause();
      else musicHowl.play();
    },
    playCue,
    setListeningActive(active) {
      if (disposed || listening === active) return;
      listening = active;
      updateCueVolumes();
    },
    stopVoice,
    playVoice,
    replayVoice() {
      if (disposed || !currentVoice) return;
      startVoice(currentVoice.key, currentVoice.audio);
    },
    getVoiceState: () => voiceState,
    subscribeVoice(listener) {
      voiceListeners.add(listener);
      return () => voiceListeners.delete(listener);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      voiceGeneration++;
      releaseVoice();
      for (const howl of howls.values()) {
        howl.stop();
        howl.unload();
      }
      howls.clear();
      if (musicHowl) {
        musicHowl.stop();
        musicHowl.unload();
        musicHowl = null;
      }
      currentVoice = null;
      voiceListeners.clear();
      voiceState = { status: 'idle', key: null };
    },
  };
}
