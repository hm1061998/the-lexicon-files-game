import { describe, expect, it, vi } from 'vitest';
import { createUiSound, sfxForEvent } from './uiSound';
import type { AudioHowl, PresentationHowlFactory } from './presentationAudio';

type FakeHowl = AudioHowl & {
  options: Parameters<PresentationHowlFactory>[0];
  plays: number;
  volumes: number[];
  stopped: boolean;
  unloaded: boolean;
};

function fakeFactory() {
  const created: FakeHowl[] = [];
  const factory: PresentationHowlFactory = (options) => {
    const howl = {
      options,
      plays: 0,
      volumes: [] as number[],
      stopped: false,
      unloaded: false,
      on: () => howl,
      off: () => howl,
      play() {
        howl.plays += 1;
        return 1;
      },
      pause: () => howl,
      stop() {
        howl.stopped = true;
        return howl;
      },
      unload() {
        howl.unloaded = true;
        return howl;
      },
      seek: () => 0,
      volume(value?: number) {
        if (value !== undefined) {
          howl.volumes.push(value);
          return howl;
        }
        return howl.volumes.at(-1) ?? 1;
      },
    } as FakeHowl;
    created.push(howl);
    return howl;
  };
  return { factory, created };
}

const files = { press: '/audio/ui/press.ogg', 'tape-loop': '/audio/ui/tape-loop.ogg' };

function element(sfx: string | null, extra: Record<string, unknown> = {}) {
  const el = {
    ...extra,
    getAttribute: (name: string) => (name === 'data-sfx' ? sfx : (extra[name] as string | null)),
  };
  return { closest: (selector: string) => (selector === '[data-sfx]' && sfx !== null ? el : null) };
}

describe('sfxForEvent', () => {
  it('reads the nearest data-sfx', () => {
    expect(sfxForEvent(element('stamp'))).toBe('stamp');
  });

  it('is silent for elements without data-sfx and for no target', () => {
    expect(sfxForEvent(element(null))).toBeNull();
    expect(sfxForEvent(null)).toBeNull();
    expect(sfxForEvent({})).toBeNull();
  });

  it('is silent for disabled and aria-disabled buttons', () => {
    expect(sfxForEvent(element('press', { disabled: true }))).toBeNull();
    expect(sfxForEvent(element('press', { 'aria-disabled': 'true' }))).toBeNull();
    expect(sfxForEvent(element('press', { 'aria-disabled': 'false' }))).toBe('press');
  });
});

describe('createUiSound', () => {
  it('plays at the master volume times 0.6', () => {
    const { factory, created } = fakeFactory();
    const sound = createUiSound({ files, factory, enabled: () => true, volume: () => 50 });
    sound.play('press');
    expect(created).toHaveLength(1);
    expect(created[0]!.plays).toBe(1);
    expect(created[0]!.volumes.at(-1) ?? created[0]!.options.volume).toBeCloseTo(0.3);
  });

  it('reuses one Howl per sound and follows the volume at play time', () => {
    const { factory, created } = fakeFactory();
    let volume = 100;
    const sound = createUiSound({ files, factory, enabled: () => true, volume: () => volume });
    sound.play('press');
    volume = 20;
    sound.play('press');
    expect(created).toHaveLength(1);
    expect(created[0]!.plays).toBe(2);
    expect(created[0]!.volumes.at(-1)).toBeCloseTo(0.12);
  });

  it('is silent when disabled, when the volume is 0, or when the sound has no file', () => {
    const { factory, created } = fakeFactory();
    let enabled = false;
    let volume = 80;
    const sound = createUiSound({ files, factory, enabled: () => enabled, volume: () => volume });
    sound.play('press');
    enabled = true;
    volume = 0;
    sound.play('press');
    volume = 80;
    sound.play('stamp');
    expect(created).toHaveLength(0);
    sound.startLoop('tape-loop');
    volume = 0;
    sound.stopLoop();
    sound.startLoop('tape-loop');
    expect(created.filter((h) => h.plays > 0)).toHaveLength(1);
  });

  it('starts one looping Howl however often startLoop is called', () => {
    const { factory, created } = fakeFactory();
    const sound = createUiSound({ files, factory, enabled: () => true, volume: () => 80 });
    sound.startLoop('tape-loop');
    sound.startLoop('tape-loop');
    expect(created).toHaveLength(1);
    expect(created[0]!.options.loop).toBe(true);
    expect(created[0]!.plays).toBe(1);
  });

  it('stopLoop and dispose stop and unload', () => {
    const { factory, created } = fakeFactory();
    const sound = createUiSound({ files, factory, enabled: () => true, volume: () => 80 });
    sound.startLoop('tape-loop');
    sound.stopLoop();
    expect(created[0]!.stopped).toBe(true);
    expect(created[0]!.unloaded).toBe(true);
    sound.startLoop('tape-loop');
    sound.play('press');
    sound.dispose();
    expect(created.every((h) => h.unloaded)).toBe(true);
    sound.play('press');
    expect(created).toHaveLength(3);
  });

  it('survives a Howl that throws on play', () => {
    const factory: PresentationHowlFactory = () => {
      throw new Error('no audio device');
    };
    const sound = createUiSound({ files, factory, enabled: () => true, volume: () => 80 });
    expect(() => sound.play('press')).not.toThrow();
    expect(() => sound.startLoop('tape-loop')).not.toThrow();
  });

  it('does not call the factory at all for an empty manifest', () => {
    const factory = vi.fn();
    const sound = createUiSound({
      files: {},
      factory: factory as unknown as PresentationHowlFactory,
      enabled: () => true,
      volume: () => 80,
    });
    sound.play('press');
    sound.startLoop('tape-loop');
    expect(factory).not.toHaveBeenCalled();
  });
});
