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
    expect(html.match(/aria-pressed="false"/g)).toHaveLength(suspects.length);
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
    expect(html).toMatch(new RegExp(`disabled=""[^>]*>${strings.conclusionSubmit}</button>`));
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

describe('AccusationPanel as pinned suspect cards', () => {
  const learning = {
    catalogue: definition.vocabulary,
    strings,
    translationMode: 'Learning' as const,
    onEncounter: () => {},
    onInspect: () => {},
    onRevealTranslation: () => {},
  };
  const submit = () => ({ ok: true, correct: false, state, events: [] }) as const;
  const render = (extra: object = {}) =>
    renderToString(
      <AccusationPanel
        suspects={suspects}
        strings={strings}
        onSubmit={submit}
        learning={learning}
        {...extra}
      />,
    );

  it('pins one card per suspect and marks only the chosen one', () => {
    const html = render({ selection: 'anna' });
    expect(html.match(/pinned-card pinned-card--selected/g)?.length ?? 0).toBeGreaterThan(0);
    const selected =
      html.match(/<button[^>]*pinned-card--selected[^>]*aria-label="([^"]+)"/g) ?? [];
    expect(new Set(selected.map((m) => /aria-label="([^"]+)"/.exec(m)![1]))).toEqual(
      new Set([suspects.find((x) => x.id === 'anna')!.name]),
    );
    for (const suspect of suspects) expect(html).toContain(`aria-label="${suspect.name}"`);
  });

  it('shows no suspect as selected before a choice', () => {
    expect(render()).not.toContain('pinned-card--selected');
  });

  it('shows a portrait when one is known and the initials when it is not', () => {
    const html = render({ portraits: { anna: '/assets/portraits/anna.png' } });
    expect(html).toContain('src="/assets/portraits/anna.png"');
    expect(html).toContain('alt=""');
    expect(html).toContain('artwork-fallback');
  });

  it('accuses with a paper button, disabled until a suspect is chosen', () => {
    expect(render()).toMatch(
      new RegExp(`paper-button[^>]*disabled=""[^>]*>${strings.conclusionSubmit}<`),
    );
    expect(render({ selection: 'anna' })).not.toMatch(
      new RegExp(`paper-button[^>]*disabled=""[^>]*>${strings.conclusionSubmit}<`),
    );
  });

  it('has no unstyled button left, in either mode', () => {
    const bare =
      /<button(?![^>]*class="[^"]*(ink-button|paper-button|device-key|folder-tab|vocabulary-word|pinned-card))/g;
    expect(render({ selection: 'anna', feedback: 'x' }).match(bare)).toBeNull();
    const legacy = renderToString(
      <AccusationPanel suspects={suspects} strings={strings} onSubmit={submit} />,
    );
    expect(legacy.match(bare)).toBeNull();
    expect(legacy).toContain('pinned-card');
  });

  it('keeps the feedback line a status region', () => {
    expect(render({ feedback: strings.conclusionMismatch })).toContain('role="status"');
  });
});
