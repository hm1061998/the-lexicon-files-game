import { useSyncExternalStore } from 'react';
import { InkButton } from '@lexicon/ui';
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
      role="group"
      aria-label={strings.voiceReplay}
      data-voice-status={state.status}
      data-voice-key={state.key ?? ''}
    >
      <InkButton aria-label={strings.voiceReplay} onClick={() => owner.replayVoice()}>
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M4 11a8 8 0 1 1 2.2 5.5M4 5v6h6" />
          <path d="M11 9v6l5-3-5-3Z" />
        </svg>
        <span>{strings.voiceReplay}</span>
      </InkButton>
      {message && (
        <span role="status" aria-live="polite">
          {message}
        </span>
      )}
    </div>
  );
}
