import { describe, expect, it } from 'vitest';
import type { TranslationMode } from '@lexicon/shared-types';
import type { SubtitlePreference } from '../persistence/settingsSchema';
import { resolveTranscriptBlock, resolveTranscriptVisibility } from './transcriptVisibility';

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

describe('resolveTranscriptBlock', () => {
  it('renders the transcript once when Learning + subtitles on and the toggle is opened', () => {
    const visibility = resolveTranscriptVisibility('Learning', 'on');
    expect(resolveTranscriptBlock(visibility, false)).toEqual({
      transcript: true,
      translation: false,
    });
    // Opening the toggle reveals the translation inside the same block, never a second copy.
    expect(resolveTranscriptBlock(visibility, true)).toEqual({
      transcript: true,
      translation: true,
    });
  });

  it('keeps the on-demand block hidden until opened when the transcript is not shown', () => {
    const visibility = resolveTranscriptVisibility('Learning', 'auto');
    expect(resolveTranscriptBlock(visibility, false)).toEqual({
      transcript: false,
      translation: false,
    });
    expect(resolveTranscriptBlock(visibility, true)).toEqual({
      transcript: true,
      translation: true,
    });
  });

  it('ignores the open flag when no toggle exists', () => {
    expect(resolveTranscriptBlock(resolveTranscriptVisibility('Immersion', 'auto'), true)).toEqual({
      transcript: false,
      translation: false,
    });
    expect(resolveTranscriptBlock(resolveTranscriptVisibility('Beginner', 'auto'), true)).toEqual({
      transcript: true,
      translation: true,
    });
  });
});
