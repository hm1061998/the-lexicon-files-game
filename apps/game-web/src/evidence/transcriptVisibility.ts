import type { TranslationMode } from '@lexicon/shared-types';
import type { SubtitlePreference } from '../persistence/settingsSchema';

export type TranscriptVisibility = {
  /** Transcript is visible without any action. */
  transcriptShown: boolean;
  /** A button lets the player open the transcript (and translation) on demand. */
  transcriptToggle: boolean;
  /** Vietnamese translation is visible together with an automatically shown transcript. */
  translationShown: boolean;
  /** Vietnamese translation is visible when the transcript is opened with the button. */
  translationWithTranscript: boolean;
};

const NONE: TranscriptVisibility = {
  transcriptShown: false,
  transcriptToggle: false,
  translationShown: false,
  translationWithTranscript: false,
};

export function resolveTranscriptVisibility(
  mode: TranslationMode,
  subtitles: SubtitlePreference,
): TranscriptVisibility {
  if (subtitles === 'on') {
    if (mode === 'Beginner')
      return {
        transcriptShown: true,
        transcriptToggle: false,
        translationShown: true,
        translationWithTranscript: true,
      };
    if (mode === 'Learning')
      return {
        transcriptShown: true,
        transcriptToggle: true,
        translationShown: false,
        translationWithTranscript: true,
      };
    return { ...NONE, transcriptShown: true };
  }
  if (mode === 'Immersion') return NONE;
  if (subtitles === 'off' || mode === 'Learning')
    return { ...NONE, transcriptToggle: true, translationWithTranscript: true };
  return {
    transcriptShown: true,
    transcriptToggle: false,
    translationShown: true,
    translationWithTranscript: true,
  };
}
