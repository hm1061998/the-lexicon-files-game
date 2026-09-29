import { describe, expect, it } from 'vitest';
import type { TranslationMode } from '@lexicon/shared-types';
import type { SubtitlePreference } from '../persistence/settingsSchema';
import { resolveTranscriptVisibility } from './transcriptVisibility';

const t = (a: boolean, b: boolean, c: boolean, d: boolean) => ({
  transcriptShown: a,
  transcriptToggle: b,
  translationShown: c,
  translationWithTranscript: d,
});
const table: [SubtitlePreference, TranslationMode, ReturnType<typeof t>][] = [
  ['auto', 'Beginner', t(true, false, true, true)],
  ['auto', 'Learning', t(false, true, false, true)],
  ['auto', 'Immersion', t(false, false, false, false)],
  ['on', 'Beginner', t(true, false, true, true)],
  ['on', 'Learning', t(true, true, false, true)],
  ['on', 'Immersion', t(true, false, false, false)],
  ['off', 'Beginner', t(false, true, false, true)],
  ['off', 'Learning', t(false, true, false, true)],
  ['off', 'Immersion', t(false, false, false, false)],
];

describe('resolveTranscriptVisibility', () => {
  it.each(table)('%s + %s', (subtitles, mode, expected) => {
    expect(resolveTranscriptVisibility(mode, subtitles)).toEqual(expected);
  });
});
