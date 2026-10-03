import type { SfxId } from '@lexicon/ui';
import type { AudioHowl, PresentationHowlFactory } from './presentationAudio';
import { Howl } from 'howler';

export type UiSoundId = SfxId | 'tape-loop';

export type UiSound = {
  play(id: UiSoundId): void;
  startLoop(id: 'tape-loop'): void;
  stopLoop(): void;
  dispose(): void;
};

/** UI sounds sit under the case audio: master volume times this. */
const UI_GAIN = 0.6;

type SfxElement = { getAttribute(name: string): string | null; disabled?: boolean };
type SfxTarget = { closest?(selector: string): SfxElement | null };

/** The sound id of the nearest `[data-sfx]` control, or null (none, disabled or aria-disabled). */
export function sfxForEvent(target: unknown): SfxId | null {
  const element = (target as SfxTarget | null)?.closest?.('[data-sfx]');
  if (!element) return null;
  if (element.disabled === true || element.getAttribute('aria-disabled') === 'true') return null;
  return element.getAttribute('data-sfx') as SfxId | null;
}

export function createUiSound(options: {
  files: Partial<Record<UiSoundId, string>>;
  factory?: PresentationHowlFactory;
  enabled: () => boolean;
  volume: () => number;
}): UiSound {
  const {
    files,
    factory = (howlOptions) => new Howl(howlOptions) as unknown as AudioHowl,
    enabled,
    volume,
  } = options;
  const howls = new Map<UiSoundId, AudioHowl>();
  let loop: AudioHowl | null = null;
  let disposed = false;

  const stopLoop = () => {
    if (!loop) return;
    const current = loop;
    loop = null;
    current.stop();
    current.unload();
  };
  const level = () => (Math.max(0, Math.min(100, volume())) / 100) * UI_GAIN;
  const audible = (id: UiSoundId) => !disposed && enabled() && volume() > 0 && !!files[id];

  return {
    play(id) {
      if (!audible(id)) return;
      try {
        let howl = howls.get(id);
        if (!howl) {
          howl = factory({ src: [files[id]!], preload: true, html5: false, volume: level() });
          howls.set(id, howl);
        }
        howl.volume(level());
        howl.play();
      } catch {
        /* A sound failure must never interrupt the interface. */
      }
    },
    startLoop(id) {
      if (loop || !audible(id)) return;
      try {
        loop = factory({
          src: [files[id]!],
          preload: true,
          html5: false,
          loop: true,
          volume: level(),
        });
        loop.play();
      } catch {
        loop = null;
      }
    },
    stopLoop,
    dispose() {
      stopLoop();
      disposed = true;
      howls.forEach((howl) => {
        howl.stop();
        howl.unload();
      });
      howls.clear();
    },
  };
}
