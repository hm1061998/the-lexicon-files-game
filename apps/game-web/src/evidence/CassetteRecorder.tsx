import { useEffect } from 'react';
import { DeviceKey } from '@lexicon/ui';
import type { UiStrings } from '@lexicon/shared-types';
import type { AudioPlaybackState } from '../audio/audioController';
import { useUiSound } from '../audio/UiSoundContext';
import type { UiSound } from '../audio/uiSound';
import './cassette-recorder.css';

/** `mm:ss`, never negative or NaN. */
export function formatClock(seconds: number): string {
  const whole = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const minutes = Math.floor(whole / 60);
  return `${String(minutes).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`;
}

/**
 * The tape runs under the sound only while the recording plays. Returns the cleanup, so the sound
 * stops at once when the recorder closes (or the state changes), however it was left.
 */
export function tapeLoopEffect(uiSound: UiSound | null, playing: boolean): () => void {
  if (playing) uiSound?.startLoop('tape-loop');
  else uiSound?.stopLoop();
  return () => uiSound?.stopLoop();
}

const PlayIcon = (
  <svg viewBox="0 0 24 24" focusable="false">
    <path d="M7 4.5v15l12-7.5-12-7.5Z" />
  </svg>
);
const PauseIcon = (
  <svg viewBox="0 0 24 24" focusable="false">
    <path d="M6 4.5h4v15H6zM14 4.5h4v15h-4z" />
  </svg>
);
const RewindIcon = (
  <svg viewBox="0 0 24 24" focusable="false">
    <path d="M5 4.5h2.5v15H5zM19 4.5v15L8.5 12 19 4.5Z" />
  </svg>
);
const HintIcon = (
  <svg viewBox="0 0 24 24" focusable="false">
    <path d="M12 3a6 6 0 0 0-3.5 10.9V17h7v-3.1A6 6 0 0 0 12 3ZM9.5 19h5v2h-5z" />
  </svg>
);
const TextIcon = (
  <svg viewBox="0 0 24 24" focusable="false">
    <path d="M5 5h14v2H5zM5 9h14v2H5zM5 13h14v2H5zM5 17h9v2H5z" />
  </svg>
);

/**
 * A cassette recorder as an object: two reels, a display, a waveform of the real recording and
 * four keys. It only reports presses; the panel owns playback, telemetry and the answers.
 */
export function CassetteRecorder({
  state,
  progress,
  elapsedSeconds,
  timestamp,
  peaks,
  reducedMotion,
  strings,
  hintOpen = false,
  transcriptOpen = false,
  initialFocus = false,
  onPlayPause,
  onRestart,
  onHint,
  onTranscript,
}: {
  state: AudioPlaybackState;
  progress: number;
  elapsedSeconds: number;
  timestamp: string;
  /** 64 columns in 0..1 from `build_peaks.mjs`; null hides the waveform. */
  peaks: readonly number[] | null;
  reducedMotion: boolean;
  strings: UiStrings;
  hintOpen?: boolean;
  transcriptOpen?: boolean;
  /** Marks the play key as where focus lands when the card opens (Space then plays). */
  initialFocus?: boolean;
  onPlayPause(): void;
  onRestart(): void;
  onHint?(): void;
  onTranscript?(): void;
}): JSX.Element {
  const uiSound = useUiSound();
  const running = state === 'playing' || state === 'loading';
  useEffect(() => tapeLoopEffect(uiSound, state === 'playing'), [uiSound, state]);
  const playedBars = Math.round(Math.min(1, Math.max(0, progress)) * (peaks?.length ?? 0));
  const reelClass = [
    'recorder__reel',
    state === 'playing' && !reducedMotion ? 'recorder__reel--spin' : undefined,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className="recorder" data-state={state}>
      <div className="recorder__window" aria-hidden="true">
        {[0, 1].map((reel) => (
          <svg key={reel} className={reelClass} viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="17" />
            <circle cx="20" cy="20" r="5" className="recorder__hub" />
            <path d="M20 4v10M20 26v10M4 20h10M26 20h10" />
          </svg>
        ))}
      </div>
      <div className="recorder__display">
        <span className="recorder__stamp">
          <span className="recorder__caption">{strings.listeningTimestamp}</span>
          <time>{timestamp}</time>
        </span>
        <time className="recorder__elapsed">{formatClock(elapsedSeconds)}</time>
        {peaks && (
          <svg
            className="recorder-wave"
            viewBox={`0 0 ${peaks.length} 20`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {peaks.map((value, index) => {
              const height = Math.max(1, value * 18);
              return (
                <rect
                  key={index}
                  className={
                    index < playedBars
                      ? 'recorder-wave__bar recorder-wave__bar--played'
                      : 'recorder-wave__bar'
                  }
                  x={index + 0.15}
                  y={10 - height / 2}
                  width={0.7}
                  height={height}
                />
              );
            })}
          </svg>
        )}
      </div>
      <div className="recorder__keys">
        <DeviceKey
          icon={RewindIcon}
          label={strings.listeningReplay}
          aria-label={strings.listeningReplay}
          onClick={onRestart}
        />
        <DeviceKey
          icon={running ? PauseIcon : PlayIcon}
          label={running ? strings.listeningPause : strings.listeningPlay}
          aria-label={running ? strings.listeningPause : strings.listeningPlay}
          {...(initialFocus ? { 'data-initial-focus': '' } : {})}
          onClick={onPlayPause}
        />
        {onHint && (
          <DeviceKey
            icon={HintIcon}
            label={strings.listeningHint}
            pressed={hintOpen}
            onClick={onHint}
          />
        )}
        {onTranscript && (
          <DeviceKey
            icon={TextIcon}
            label={strings.listeningShowTranscript}
            pressed={transcriptOpen}
            onClick={onTranscript}
          />
        )}
      </div>
    </div>
  );
}
