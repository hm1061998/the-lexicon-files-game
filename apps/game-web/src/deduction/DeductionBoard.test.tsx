import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createCaseState } from '@lexicon/game-core';
import { loadCaseDefinition, loadUiStrings } from '@lexicon/game-content';
import { DeductionBoard } from './DeductionBoard';
const definition = loadCaseDefinition('case-001');
const strings = loadUiStrings('vi');
const state = createCaseState(definition);
const props = {
  caseDefinition: definition,
  caseState: state,
  strings,
  onClose: () => {},
  onOpenNotebook: () => {},
  onPlaceTimelineEvent: () =>
    ({ ok: false, state, error: { code: 'unknownTimelineEvent', id: 'missing' } }) as const,
  onSubmitContradiction: () =>
    ({ ok: false, state, error: { code: 'unknownContradiction', id: 'missing' } }) as const,
  onSubmitAccusation: () =>
    ({ ok: false, state, error: { code: 'caseAlreadyClosed', id: 'case-001' } }) as const,
};
describe('DeductionBoard disclosure', () => {
  it('keeps undiscovered facts and inactive accusation controls hidden', () => {
    const html = renderToStaticMarkup(<DeductionBoard {...props} />);
    for (const fact of definition.facts)
      expect(html).not.toContain(renderToStaticMarkup(<span>{fact.text}</span>).slice(6, -7));
    expect(html).not.toContain(strings.conclusionSubmit);
    for (const c of definition.contradictions) expect(html).not.toContain(c.explanation);
  });
  it('shows discovered facts without revealing the unconfirmed explanation', () => {
    const html = renderToStaticMarkup(
      <DeductionBoard
        {...props}
        initialFace="compare"
        caseState={{ ...state, discoveredFactIds: definition.facts.map((f) => f.id) }}
      />,
    );
    for (const fact of definition.facts)
      expect(html).toContain(renderToStaticMarkup(<span>{fact.text}</span>).slice(6, -7));
    for (const c of definition.contradictions) expect(html).not.toContain(c.explanation);
    expect(html).toContain('disabled=""');
  });
  it('shows only confirmed contradictions and enables an active conclusion', () => {
    const c = definition.contradictions[0]!;
    const html = renderToStaticMarkup(
      <DeductionBoard
        {...props}
        initialFace="compare"
        caseState={{
          ...state,
          contradictionIds: [c.id],
          objectiveStatuses: {
            ...state.objectiveStatuses,
            [definition.conclusion!.objectiveId]: 'active',
          },
        }}
      />,
    );
    expect(html).toContain(c.explanation);
    const conclusion = renderToStaticMarkup(
      <DeductionBoard
        {...props}
        initialFace="conclusion"
        caseState={{
          ...state,
          objectiveStatuses: {
            ...state.objectiveStatuses,
            [definition.conclusion!.objectiveId]: 'active',
          },
        }}
      />,
    );
    expect(conclusion).toContain(strings.conclusionSubmit);
  });
});

describe('DeductionBoard as a pinboard', () => {
  const full = {
    ...state,
    evidenceIds: definition.evidences.map((e) => e.id),
    discoveredFactIds: definition.facts.map((f) => f.id),
    objectiveStatuses: {
      ...state.objectiveStatuses,
      [definition.conclusion!.objectiveId]: 'active' as const,
    },
  };
  const faces = ['clues', 'timeline', 'compare'] as const;
  const bare =
    /<button(?![^>]*class="[^"]*(ink-button|paper-button|device-key|folder-tab|vocabulary-word|pinned-card))/g;

  it('has the four faces as board tabs with exactly one current page', () => {
    const html = renderToStaticMarkup(<DeductionBoard {...props} caseState={full} />);
    expect(html).toContain('folder-tabs--board');
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html).toMatch(/aria-current="page"[^>]*>Manh mối</);
    expect(html).not.toContain('deduction-face-tabs"><button');
  });

  it('opens each face with its own tab current', () => {
    for (const [face, label] of [
      ['timeline', strings.deductionTimelineFace],
      ['compare', strings.deductionCompareFace],
      ['conclusion', strings.deductionConclusionFace],
    ] as const) {
      const html = renderToStaticMarkup(
        <DeductionBoard {...props} caseState={full} initialFace={face} />,
      );
      expect(html).toContain(`aria-current="page"`);
      expect(html).toContain(`>${label}</button>`);
    }
  });

  it('pins every clue as a card that is a pinned card', () => {
    const html = renderToStaticMarkup(<DeductionBoard {...props} caseState={full} />);
    expect(html).toMatch(/<button[^>]*class="[^"]*pinned-card[^"]*deduction-card/);
    expect(html).toContain('pinned-card__pin');
  });

  it('keeps no raw button on any face: only ink, paper, pinned, tab and word buttons', () => {
    for (const face of faces) {
      const html = renderToStaticMarkup(
        <DeductionBoard {...props} caseState={full} initialFace={face} />,
      );
      expect(html.match(bare)).toBeNull();
    }
  });

  it('closes with an ink button and opens the notebook with a paper button', () => {
    const html = renderToStaticMarkup(<DeductionBoard {...props} caseState={full} />);
    expect(html).toMatch(/<button[^>]*class="ink-button[^"]*"[^>]*aria-label="Đóng"/);
    expect(html).toMatch(
      new RegExp(`class="paper-button[^"]*"[^>]*>${strings.openNotebookFromBoard}<`),
    );
  });
});
