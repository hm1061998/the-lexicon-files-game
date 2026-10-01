import { describe, expect, it, vi } from 'vitest';
import type { HowlOptions } from 'howler';
import { createPresentationAudio, type AudioHowl } from './presentationAudio';

function mockHowl() {
  type Callback = (soundId: number, error?: unknown) => void;
  const callbacks = new Map<string, Callback[]>();
  const howl = {
    on: (event: string, fn: Callback) => {
      callbacks.set(event, [...(callbacks.get(event) ?? []), fn]);
      return howl;
    },
    off: vi.fn(),
    play: vi.fn().mockReturnValue(1),
    pause: vi.fn(),
    stop: vi.fn(),
    unload: vi.fn(),
    seek: vi.fn().mockReturnValue(0),
    volume: vi.fn().mockReturnThis(),
    emit: (event: string) => callbacks.get(event)?.forEach((fn) => fn(1)),
  };
  return howl;
}

const definition = {
  audio: {
    sfx: {
      footstep: ['/audio/footstep-01.ogg', '/audio/footstep-02.ogg'],
      paper: ['/audio/paper.wav'],
      ui: ['/audio/ui.wav'],
      evidence: ['/audio/evidence.wav'],
      door: ['/audio/door.wav'],
      dialogue: ['/audio/dialogue.wav'],
    },
    music: '/audio/ambience.ogg',
  },
} as never;

describe('presentation audio', () => {
  it('starts one looping ambience only after a user gesture and ducks it for voice/listening', () => {
    const created: ReturnType<typeof mockHowl>[] = [];
    const options: HowlOptions[] = [];
    const audio = createPresentationAudio(definition, ((input: HowlOptions) => {
      options.push(input);
      const howl = mockHowl();
      created.push(howl);
      return howl as unknown as AudioHowl;
    }) as (input: HowlOptions) => AudioHowl);

    expect(created).toHaveLength(0);
    audio.startMusicFromGesture();
    audio.startMusicFromGesture();
    expect(created).toHaveLength(1);
    expect(options[0]).toMatchObject({ src: ['/audio/ambience.ogg'], loop: true, volume: 0.07 });

    audio.setListeningActive(true);
    expect(created[0]?.volume).toHaveBeenLastCalledWith(0.025);
    audio.setListeningActive(false);
    expect(created[0]?.volume).toHaveBeenLastCalledWith(0.07);
    audio.playVoice('voice', '/audio/voice.wav');
    created[1]?.emit('play');
    expect(created[0]?.volume).toHaveBeenLastCalledWith(0.025);
    audio.stopVoice();
    expect(created[0]?.volume).toHaveBeenLastCalledWith(0.07);

    audio.setPaused(true);
    expect(created[0]?.pause).toHaveBeenCalledOnce();
    audio.setPaused(false);
    expect(created[0]?.play).toHaveBeenCalledTimes(2);
    audio.dispose();
    expect(created[0]?.unload).toHaveBeenCalledOnce();
  });

  it('does not retry a music playback blocked by the browser', () => {
    const created: ReturnType<typeof mockHowl>[] = [];
    const audio = createPresentationAudio(definition, (() => {
      const howl = mockHowl();
      howl.play.mockImplementation(() => {
        throw new Error('autoplay blocked');
      });
      created.push(howl);
      return howl as unknown as AudioHowl;
    }) as (options: HowlOptions) => AudioHowl);

    audio.startMusicFromGesture();
    audio.startMusicFromGesture();
    expect(created).toHaveLength(1);
    audio.dispose();
  });

  it('alternates local cue variants, ducks effects for listening, and unloads every Howl', () => {
    const created: ReturnType<typeof mockHowl>[] = [];
    const audio = createPresentationAudio(definition, (() => {
      const howl = mockHowl();
      created.push(howl);
      return howl as unknown as AudioHowl;
    }) as (options: HowlOptions) => AudioHowl);
    audio.playCue('footstep');
    audio.playCue('footstep');
    expect(created).toHaveLength(2);
    audio.setListeningActive(true);
    expect(created[0]?.volume).toHaveBeenCalledWith(0.06);
    audio.setListeningActive(false);
    expect(created[0]?.volume).toHaveBeenLastCalledWith(0.18);
    audio.dispose();
    expect(created.every((howl) => howl.unload.mock.calls.length === 1)).toBe(true);
  });

  it('replaces the active voice and ignores end/error callbacks from stale clips', () => {
    const created: ReturnType<typeof mockHowl>[] = [];
    const audio = createPresentationAudio(definition, (() => {
      const howl = mockHowl();
      created.push(howl);
      return howl as unknown as AudioHowl;
    }) as (options: HowlOptions) => AudioHowl);
    const states: string[] = [];
    audio.subscribeVoice(({ status }) => states.push(status));
    audio.playVoice('one', '/audio/a.wav');
    audio.playVoice('two', '/audio/b.wav');
    created[0]?.emit('end');
    expect(audio.getVoiceState()).toEqual({ status: 'loading', key: 'two' });
    created[1]?.emit('play');
    expect(audio.getVoiceState()).toEqual({ status: 'playing', key: 'two' });
    audio.replayVoice();
    expect(created).toHaveLength(3);
    expect(created[1]?.stop).toHaveBeenCalledOnce();
    expect(created[1]?.unload).toHaveBeenCalledOnce();
    expect(created[2]?.play).toHaveBeenCalledOnce();
    expect(states).not.toContain('ended');
    created[2]?.emit('loaderror');
    expect(audio.getVoiceState()).toEqual({ status: 'error', key: 'two' });
    audio.replayVoice();
    expect(created).toHaveLength(4);
    expect(created[3]?.play).toHaveBeenCalledOnce();
    audio.dispose();
  });

  it('can be reactivated after a development StrictMode cleanup', () => {
    const created: ReturnType<typeof mockHowl>[] = [];
    const audio = createPresentationAudio(definition, (() => {
      const howl = mockHowl();
      created.push(howl);
      return howl as unknown as AudioHowl;
    }) as (options: HowlOptions) => AudioHowl);
    audio.dispose();
    audio.playCue('ui');
    expect(created).toHaveLength(0);
    audio.activate();
    audio.playCue('ui');
    expect(created).toHaveLength(1);
    audio.dispose();
  });
});
