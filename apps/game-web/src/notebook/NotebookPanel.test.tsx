import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createCaseState } from '@lexicon/game-core';
import { loadCaseDefinition, loadUiStrings } from '@lexicon/game-content';
import { NotebookPanel } from './NotebookPanel';

const strings = loadUiStrings('vi');
const caseDefinition = loadCaseDefinition('case-001');

describe('NotebookPanel', () => {
  it('only lists discovered evidence and exposes the notebook tabs and close action', () => {
    const caseState = { ...createCaseState(caseDefinition), evidenceIds: ['meeting_minutes'] };
    const html = renderToString(
      <NotebookPanel
        caseDefinition={caseDefinition}
        caseState={caseState}
        activeTab="evidence"
        strings={strings}
        onSelectTab={() => {}}
        onClose={() => {}}
      />,
    );
    expect(html).toContain(
      caseDefinition.evidences.find((item) => item.id === 'meeting_minutes')!.name,
    );
    expect(html).toContain(strings.people);
    expect(html).toContain(strings.evidence);
    expect(html).toContain(strings.vocabulary);
    expect(html).toContain(strings.close);
  });

  it('shows empty states for people and vocabulary tabs', () => {
    const caseState = createCaseState(caseDefinition);
    const people = renderToString(
      <NotebookPanel
        caseDefinition={caseDefinition}
        caseState={caseState}
        activeTab="people"
        strings={strings}
        onSelectTab={() => {}}
        onClose={() => {}}
      />,
    );
    const vocabulary = renderToString(
      <NotebookPanel
        caseDefinition={caseDefinition}
        caseState={caseState}
        activeTab="vocabulary"
        strings={strings}
        onSelectTab={() => {}}
        onClose={() => {}}
      />,
    );
    expect(people).toContain(strings.notebookEmptyPeople);
    expect(vocabulary).toContain(strings.notebookEmptyVocabulary);
  });
});
