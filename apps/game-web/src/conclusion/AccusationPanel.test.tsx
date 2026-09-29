import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { loadCaseDefinition, loadUiStrings } from '@lexicon/game-content';
import { createCaseState } from '@lexicon/game-core';
import { AccusationPanel, accusationFeedback } from './AccusationPanel';

const strings = loadUiStrings('vi');
const definition = loadCaseDefinition('case-001');
const suspects = definition.conclusion!.suspectNpcIds.map((id) => ({
  id,
  name: definition.npcs.find((npc) => npc.id === id)!.name,
}));
const state = createCaseState(definition);

describe('AccusationPanel', () => {
  it('renders one keyboard-operable toggle button per suspect, none pre-selected', () => {
    const html = renderToString(
      <AccusationPanel
        suspects={suspects}
        strings={strings}
        onSubmit={() => ({ ok: true, correct: false, state, events: [] })}
      />,
    );
    for (const suspect of suspects) expect(html).toContain(suspect.name);
    expect(html.match(/type="button" aria-pressed="false"/g)).toHaveLength(suspects.length);
    expect(html).not.toContain('aria-pressed="true"');
  });

  it('disables submit until a suspect is selected', () => {
    const html = renderToString(
      <AccusationPanel
        suspects={suspects}
        strings={strings}
        onSubmit={() => ({ ok: true, correct: false, state, events: [] })}
      />,
    );
    expect(html).toContain(`disabled="">${strings.conclusionSubmit}</button>`);
  });

  it('does not render the correct answer anywhere in the markup', () => {
    const html = renderToString(
      <AccusationPanel
        suspects={suspects}
        strings={strings}
        onSubmit={() => ({ ok: true, correct: false, state, events: [] })}
      />,
    );
    expect(html).not.toContain('correct');
  });
});

describe('accusationFeedback', () => {
  it('maps a wrong accusation to the exact mismatch copy', () => {
    expect(accusationFeedback({ ok: true, correct: false, state, events: [] }, strings)).toBe(
      "The evidence doesn't fully support this conclusion. Review the timeline.",
    );
  });

  it('shows nothing extra for a correct accusation', () => {
    expect(accusationFeedback({ ok: true, correct: true, state, events: [] }, strings)).toBeNull();
  });

  it('maps a rejected accusation to the unavailable copy', () => {
    expect(
      accusationFeedback(
        { ok: false, state, error: { code: 'objectiveNotActive', id: 'x' } },
        strings,
      ),
    ).toBe(strings.conclusionUnavailable);
  });
});
