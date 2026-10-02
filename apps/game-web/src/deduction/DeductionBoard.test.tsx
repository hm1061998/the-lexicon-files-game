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
    expect(html).toContain(strings.conclusionSubmit);
  });
});
