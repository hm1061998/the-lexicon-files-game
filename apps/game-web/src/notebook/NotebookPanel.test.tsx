import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createCaseState } from '@lexicon/game-core';
import { createInitialLanguageProfile } from '@lexicon/learning-engine';
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
    expect(html).toContain(strings.vocabularyMode);
    expect(html).toContain(strings.vocabularyModeLearning);
    expect(html).toContain('vocabulary-word');
  });

  it('shows authored metadata and only the actual achieved vocabulary stage', () => {
    const entry = caseDefinition.vocabulary[0]!;
    const context = caseDefinition.vocabularyContexts.find((item) =>
      item.vocabularyIds.includes(entry.id),
    )!;
    const profile = createInitialLanguageProfile();
    profile.vocabulary[entry.id] = {
      vocabularyId: entry.id,
      stage: 'seen',
      encounterCount: 1,
      correctRecognitionCount: 0,
      incorrectRecognitionCount: 0,
      lastSeenAt: '2026-09-28T00:00:00.000Z',
      contextsSeen: [context.id],
    };
    const html = renderToString(
      <NotebookPanel
        caseDefinition={caseDefinition}
        caseState={createCaseState(caseDefinition)}
        activeTab="vocabulary"
        strings={strings}
        onSelectTab={() => {}}
        onClose={() => {}}
        profile={profile}
      />,
    );
    expect(html).toContain(entry.partOfSpeech);
    expect(html).toContain(entry.examples[0]!);
    expect(html).toContain(context.id);
    expect(html).toContain(strings.vocabularyStageSeen);
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
