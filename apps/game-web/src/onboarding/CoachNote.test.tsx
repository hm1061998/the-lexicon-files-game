import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { loadUiStrings } from '@lexicon/game-content';
import { CoachNote, coachText } from './CoachNote';
import { COACH_NOTE_IDS } from './onboardingTypes';

const strings = loadUiStrings('vi');

describe('CoachNote', () => {
  it.each(COACH_NOTE_IDS)('renders the text for %s', (noteId) => {
    const html = renderToString(
      <CoachNote strings={strings} noteId={noteId} onDismiss={() => undefined} />,
    );
    expect(html).toContain(coachText(strings, noteId).slice(0, 20));
    expect(html).toContain(strings.coachDismiss);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
  });
  it('never takes focus', () => {
    const html = renderToString(
      <CoachNote strings={strings} noteId="move" onDismiss={() => undefined} />,
    );
    expect(html).not.toMatch(/tabindex|autofocus/i);
  });
});
