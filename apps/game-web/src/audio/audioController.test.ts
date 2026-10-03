import { describe, expect, it, vi } from 'vitest';
import type { Howl } from 'howler';
import { createAudioController, type AudioPlaybackState } from './audioController';

type FakeCallback = (...args: unknown[]) => void;

function fakeHowl() {
  const callbacks = new Map<string, FakeCallback>();
  const howl = {
    on: vi.fn((event: string, callback: FakeCallback) => {
      callbacks.set(event, callback);
      return howl;
    }),
    off: vi.fn((event: string) => {
      callbacks.delete(event);
      return howl;
    }),
    play: vi.fn(() => 1),
    pause: vi.fn(() => howl),
    stop: vi.fn(() => howl),
    position: 0,
    length: 0,
    seek: vi.fn((to?: number) => {
      if (to === undefined) return howl.position;
      howl.position = to;
      return howl;
    }),
    duration: vi.fn(() => howl.length),
    unload: vi.fn(() => null),
    callbacks,
  };
  return { howl: howl as unknown as Howl, ...howl, callbacks };
}

function setup() {
  const fake = fakeHowl();
  const factory = vi.fn(() => fake.howl);
  const controller = createAudioController('/audio/recording.wav', factory);
  const snapshot = (): AudioPlaybackState => controller.getSnapshot();
  return { controller, fake, factory, snapshot };
}

describe('createAudioController progress', () => {
  it('is 0 before anything plays and when the length is unknown', () => {
    const { controller, fake } = setup();
    expect(controller.getProgress()).toBe(0);
    controller.play();
    expect(controller.getProgress()).toBe(0);
    fake.howl.seek(5);
    expect(controller.getProgress()).toBe(0);
  });

  it('is the played share of the recording, kept inside 0..1', () => {
    const { controller, fake } = setup();
    controller.play();
    (fake.howl as unknown as { length: number }).length = 4;
    fake.howl.seek(1);
    expect(controller.getProgress()).toBeCloseTo(0.25);
    fake.howl.seek(9);
    expect(controller.getProgress()).toBe(1);
  });

  it('is 1 once the recording has ended and 0 after dispose', () => {
    const { controller, fake } = setup();
    controller.play();
    fake.callbacks.get('end')?.(1);
    expect(controller.getProgress()).toBe(1);
    controller.dispose();
    expect(controller.getProgress()).toBe(0);
  });
});

describe('createAudioController', () => {
  it('starts idle and moves from loading to playing after a user request', () => {
    const { controller, fake, snapshot } = setup();

    expect(snapshot()).toBe('idle');
    controller.play();
    expect(snapshot()).toBe('loading');
    fake.callbacks.get('play')?.(1);
    expect(snapshot()).toBe('playing');
  });

  it('pauses playback and replays from the beginning', () => {
    const { controller, fake, snapshot } = setup();
    controller.play();
    fake.callbacks.get('play')?.(1);

    controller.pause();
    fake.callbacks.get('pause')?.(1);
    expect(snapshot()).toBe('paused');

    controller.replay();
    expect(fake.seek).toHaveBeenCalledWith(0);
    expect(fake.play).toHaveBeenCalledTimes(2);
    fake.callbacks.get('play')?.(1);
    expect(snapshot()).toBe('playing');
  });

  it('tracks ended and recoverable load or play errors', () => {
    const { controller, fake, snapshot } = setup();
    controller.play();
    fake.callbacks.get('play')?.(1);
    fake.callbacks.get('end')?.(1);
    expect(snapshot()).toBe('ended');

    controller.replay();
    fake.callbacks.get('playerror')?.(1, new Error('play failed'));
    expect(snapshot()).toBe('error');

    controller.play();
    fake.callbacks.get('loaderror')?.(1, new Error('load failed'));
    expect(snapshot()).toBe('error');
  });

  it('recreates the Howl instance when the player retries after an error', () => {
    const { controller, fake, factory, snapshot } = setup();
    controller.play();
    fake.callbacks.get('loaderror')?.(1, new Error('load failed'));
    expect(snapshot()).toBe('error');

    controller.play();

    expect(factory).toHaveBeenCalledTimes(2);
    expect(snapshot()).toBe('loading');
  });

  it('stops and unloads on dispose and ignores callbacks after disposal', () => {
    const { controller, fake, snapshot } = setup();
    controller.play();
    fake.callbacks.get('play')?.(1);
    const stalePlay = fake.callbacks.get('play');

    controller.dispose();
    stalePlay?.(1);

    expect(fake.stop).toHaveBeenCalledOnce();
    expect(fake.unload).toHaveBeenCalledOnce();
    expect(snapshot()).toBe('idle');
  });

  it('unloads when disposed while loading and ignores late play callbacks', () => {
    const { controller, fake, snapshot } = setup();
    controller.play();
    const stalePlay = fake.callbacks.get('play');

    controller.dispose();
    stalePlay?.(1);

    expect(fake.stop).toHaveBeenCalledOnce();
    expect(fake.unload).toHaveBeenCalledOnce();
    expect(snapshot()).toBe('idle');
  });
});
