import { useSyncExternalStore } from 'react';
import type { DialogueAudio, UiStrings } from '@lexicon/shared-types';
import { useOptionalPresentationAudio } from '../audio/PresentationAudioContext';

export function DialogueVoiceControls({
  audio,
  strings,
}: {
  audio: DialogueAudio | null | undefined;
  strings: UiStrings;
}): JSX.Element | null {
  const owner = useOptionalPresentationAudio();
  const subscribe = owner?.subscribeVoice ?? (() => () => undefined);
  const snapshot = owner?.getVoiceState ?? (() => ({ status: 'idle' as const, key: null }));
  const state = useSyncExternalStore(subscribe, snapshot, snapshot);
  if (!audio || !owner) return null;
  const message =
    state.status === 'loading'
      ? strings.voiceLoading
      : state.status === 'blocked'
        ? strings.voiceBlocked
        : state.status === 'error'
          ? strings.voiceError
          : null;
  return (
    <div
      className="dialogue-voice-controls"
      aria-label={strings.dialogue}
      data-voice-status={state.status}
      data-voice-key={state.key ?? ''}
    >
      <button type="button" aria-label={strings.voiceReplay} onClick={() => owner.replayVoice()}>
        ↻
      </button>
      {message && (
        <span role="status" aria-live="polite">
          {message}
        </span>
      )}
    </div>
  );
}
