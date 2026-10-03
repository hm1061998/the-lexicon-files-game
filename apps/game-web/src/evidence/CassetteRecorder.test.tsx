import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { loadUiStrings } from '@lexicon/game-content';
import { CassetteRecorder, formatClock, tapeLoopEffect } from './CassetteRecorder';
import type { UiSound } from '../audio/uiSound';

const strings = loadUiStrings('vi');
const base = {
  state: 'idle' as const,
  progress: 0,
  elapsedSeconds: 0,
  timestamp: '20:29',
  peaks: null,
  reducedMotion: false,
  strings,
  onPlayPause() {},
  onRestart() {},
};
const bars = Array.from({ length: 64 }, (_, i) => (i % 8) / 8);

describe('formatClock', () => {
  it('writes minutes and seconds with two digits', () => {
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(75.9)).toBe('01:15');
    expect(formatClock(-3)).toBe('00:00');
    expect(formatClock(Number.NaN)).toBe('00:00');
  });
});

describe('CassetteRecorder', () => {
  it('has the play and rewind keys, and the hint and transcript keys only when they are offered', () => {
    const plain = renderToString(<CassetteRecorder {...base} />);
    expect(plain.match(/class="device-key[ "]/g)).toHaveLength(2);
    expect(plain).toContain(strings.listeningPlay);
    expect(plain).toContain(strings.listeningReplay);

    const full = renderToString(
      <CassetteRecorder
        {...base}
        onHint={() => {}}
        onTranscript={() => {}}
        hintOpen={false}
        transcriptOpen={true}
      />,
    );
    expect(full.match(/class="device-key[ "]/g)).toHaveLength(4);
    expect(full).toContain(strings.listeningHint);
    expect(full).toContain(strings.listeningShowTranscript);
    expect(full).toContain('aria-pressed="true"');
  });

  it('names the play key by what it will do', () => {
    expect(renderToString(<CassetteRecorder {...base} state="playing" />)).toContain(
      `aria-label="${strings.listeningPause}"`,
    );
    expect(renderToString(<CassetteRecorder {...base} state="loading" />)).toContain(
      `aria-label="${strings.listeningPause}"`,
    );
    expect(renderToString(<CassetteRecorder {...base} state="paused" />)).toContain(
      `aria-label="${strings.listeningPlay}"`,
    );
  });

  it('draws the waveform only when peaks exist, and colours the played share', () => {
    expect(renderToString(<CassetteRecorder {...base} />)).not.toContain('recorder-wave');
    const html = renderToString(<CassetteRecorder {...base} peaks={bars} progress={0.5} />);
    expect(html).toContain('recorder-wave');
    expect(html.match(/<rect/g)).toHaveLength(64);
    expect(html.match(/recorder-wave__bar--played/g)).toHaveLength(32);
  });

  it('shows the recording time and the elapsed time on the display', () => {
    const html = renderToString(<CassetteRecorder {...base} elapsedSeconds={75} />);
    expect(html).toContain('20:29');
    expect(html).toContain('01:15');
  });

  it('spins the reels only while playing and only when motion is allowed', () => {
    expect(renderToString(<CassetteRecorder {...base} state="playing" />)).toContain(
      'recorder__reel--spin',
    );
    expect(
      renderToString(<CassetteRecorder {...base} state="playing" reducedMotion />),
    ).not.toContain('recorder__reel--spin');
    expect(renderToString(<CassetteRecorder {...base} state="paused" />)).not.toContain(
      'recorder__reel--spin',
    );
  });
});

describe('tapeLoopEffect', () => {
  const sound = (): UiSound => ({
    play: vi.fn(),
    startLoop: vi.fn(),
    stopLoop: vi.fn(),
    dispose: vi.fn(),
  });

  it('starts the tape while playing and stops it when the recorder goes away', () => {
    const uiSound = sound();
    const cleanup = tapeLoopEffect(uiSound, true);
    expect(uiSound.startLoop).toHaveBeenCalledWith('tape-loop');
    expect(uiSound.stopLoop).not.toHaveBeenCalled();
    cleanup();
    expect(uiSound.stopLoop).toHaveBeenCalledTimes(1);
  });

  it('keeps the tape quiet when not playing, and copes with no sound service', () => {
    const uiSound = sound();
    const cleanup = tapeLoopEffect(uiSound, false);
    expect(uiSound.startLoop).not.toHaveBeenCalled();
    expect(uiSound.stopLoop).toHaveBeenCalled();
    expect(() => cleanup()).not.toThrow();
    expect(() => tapeLoopEffect(null, true)()).not.toThrow();
  });
});
