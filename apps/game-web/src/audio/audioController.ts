import { Howl, type HowlOptions } from 'howler';

export type AudioPlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';

export type AudioController = {
  getSnapshot(): AudioPlaybackState;
  /** Played share of the recording, 0..1 (0 when unknown, 1 once it has ended). */
  getProgress(): number;
  /** Length of the recording in seconds (0 until it is known). */
  getDuration(): number;
  subscribe(listener: () => void): () => void;
  play(): void;
  pause(): void;
  replay(): void;
  dispose(): void;
};

export type HowlFactory = (options: HowlOptions) => Howl;

type HowlEvent = 'play' | 'pause' | 'end' | 'loaderror' | 'playerror';
type HowlEventCallback = (soundId: number, error?: unknown) => void;

export function createAudioController(
  src: string,
  factory: HowlFactory = (options) => new Howl(options),
): AudioController {
  let state: AudioPlaybackState = 'idle';
  let disposed = false;
  let generation = 0;
  let howl: Howl | null = null;
  let registeredListeners: Array<{ event: HowlEvent; callback: HowlEventCallback }> = [];
  const subscribers = new Set<() => void>();

  const publish = (next: AudioPlaybackState) => {
    if (disposed || state === next) return;
    state = next;
    subscribers.forEach((subscriber) => subscriber());
  };

  const releaseHowl = () => {
    if (!howl) return;
    registeredListeners.forEach(({ event, callback }) => howl?.off(event, callback));
    registeredListeners = [];
    howl.stop();
    howl.unload();
    howl = null;
  };

  const createHowl = () => {
    releaseHowl();
    generation += 1;
    const currentGeneration = generation;
    const instance = factory({ src: [src], preload: false, html5: true });
    howl = instance;
    const bind = (event: HowlEvent, callback: HowlEventCallback) => {
      const guarded: HowlEventCallback = (soundId, error) => {
        if (disposed || currentGeneration !== generation) return;
        callback(soundId, error);
      };
      registeredListeners.push({ event, callback: guarded });
      instance.on(event, guarded);
    };
    bind('play', () => publish('playing'));
    bind('pause', () => publish('paused'));
    bind('end', () => publish('ended'));
    bind('loaderror', () => publish('error'));
    bind('playerror', () => publish('error'));
  };

  const play = () => {
    if (disposed) return;
    try {
      if (!howl || state === 'error') createHowl();
      publish('loading');
      howl?.play();
    } catch {
      publish('error');
    }
  };

  return {
    getSnapshot: () => state,
    getDuration() {
      if (disposed || !howl) return 0;
      try {
        const duration = howl.duration();
        return duration > 0 ? duration : 0;
      } catch {
        return 0;
      }
    },
    getProgress() {
      if (disposed || !howl) return 0;
      if (state === 'ended') return 1;
      try {
        const duration = howl.duration();
        const position = howl.seek();
        if (!(duration > 0) || typeof position !== 'number') return 0;
        return Math.min(1, Math.max(0, position / duration));
      } catch {
        return 0;
      }
    },
    subscribe(listener) {
      subscribers.add(listener);
      return () => subscribers.delete(listener);
    },
    play,
    pause() {
      if (disposed || !howl || (state !== 'playing' && state !== 'loading')) return;
      try {
        howl.pause();
        publish('paused');
      } catch {
        publish('error');
      }
    },
    replay() {
      if (disposed) return;
      try {
        if (!howl || state === 'error') {
          play();
          return;
        }
        howl.seek(0);
        publish('loading');
        howl.play();
      } catch {
        publish('error');
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      generation += 1;
      releaseHowl();
      state = 'idle';
      subscribers.clear();
    },
  };
}
