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
        onPlaceTimelineEvent={() => ({
          ok: true,
          correct: false,
          state: createCaseState(caseDefinition),
        })}
        onSubmitContradiction={() => ({
          ok: true,
          correct: false,
          state: createCaseState(caseDefinition),
          events: [],
        })}
      />,
    );
    expect(html).toContain(
      caseDefinition.evidences.find((item) => item.id === 'meeting_minutes')!.name,
    );
    expect(html).toContain(strings.people);
    expect(html).toContain(strings.evidence);
    expect(html).toContain(strings.vocabulary);
    expect(html).toContain(strings.timeline);
    expect(html).toContain(strings.close);
    expect(html).not.toContain(strings.vocabularyMode);
    expect(html).not.toContain(strings.vocabularyModeLearning);
    expect(html).not.toContain('translation-mode-control');
    expect(html).not.toContain('aria-pressed="true">Đang học</button>');
    expect(html).not.toContain('<select');
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
        onPlaceTimelineEvent={() => ({
          ok: true,
          correct: false,
          state: createCaseState(caseDefinition),
        })}
        onSubmitContradiction={() => ({
          ok: true,
          correct: false,
          state: createCaseState(caseDefinition),
          events: [],
        })}
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
        onPlaceTimelineEvent={() => ({
          ok: true,
          correct: false,
          state: createCaseState(caseDefinition),
        })}
        onSubmitContradiction={() => ({
          ok: true,
          correct: false,
          state: createCaseState(caseDefinition),
          events: [],
        })}
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
        onPlaceTimelineEvent={() => ({
          ok: true,
          correct: false,
          state: createCaseState(caseDefinition),
        })}
        onSubmitContradiction={() => ({
          ok: true,
          correct: false,
          state: createCaseState(caseDefinition),
          events: [],
        })}
      />,
    );
    expect(people).toContain(strings.notebookEmptyPeople);
    expect(vocabulary).toContain(strings.notebookEmptyVocabulary);
  });

  it('shows only start-available timeline events and hides target slots until an event is selected', () => {
    const html = renderToString(
      <NotebookPanel
        caseDefinition={caseDefinition}
        caseState={createCaseState(caseDefinition)}
        activeTab="timeline"
        strings={strings}
        onSelectTab={() => {}}
        onClose={() => {}}
        onPlaceTimelineEvent={() => ({
          ok: true,
          correct: false,
          state: createCaseState(caseDefinition),
        })}
        onSubmitContradiction={() => ({
          ok: true,
          correct: false,
          state: createCaseState(caseDefinition),
          events: [],
        })}
      />,
    );

    expect(html).toContain(
      caseDefinition.timeline.events.find((event) => event.id === 'report_missing_21_05')!.text,
    );
    expect(html).not.toContain(
      caseDefinition.timeline.events.find((event) => event.id === 'meeting_ended_20_45')!.text,
    );
    expect(html).not.toContain('21:05');
    expect(html).toContain(strings.timelineSelectEvent);
    expect(html).toContain('aria-pressed="false"');
  });

  it('reveals a timeline event only after its required fact is discovered', () => {
    const html = renderToString(
      <NotebookPanel
        caseDefinition={caseDefinition}
        caseState={{ ...createCaseState(caseDefinition), discoveredFactIds: ['meeting_started'] }}
        activeTab="timeline"
        strings={strings}
        onSelectTab={() => {}}
        onClose={() => {}}
        onPlaceTimelineEvent={() => ({
          ok: true,
          correct: false,
          state: createCaseState(caseDefinition),
        })}
        onSubmitContradiction={() => ({
          ok: true,
          correct: false,
          state: createCaseState(caseDefinition),
          events: [],
        })}
      />,
    );

    expect(html).toContain(
      caseDefinition.timeline.events.find((event) => event.id === 'meeting_started')!.text,
    );
    expect(html).not.toContain(
      caseDefinition.timeline.events.find((event) => event.id === 'david_entry_20_32')!.text,
    );
  });

  it('does not render undiscovered facts in the contradiction chooser', () => {
    const hiddenFact = caseDefinition.facts.find(
      (fact) => fact.id === 'david_statement_no_entry_after_20_00',
    )!;
    const html = renderToString(
      <NotebookPanel
        caseDefinition={caseDefinition}
        caseState={createCaseState(caseDefinition)}
        activeTab="timeline"
        strings={strings}
        onSelectTab={() => {}}
        onClose={() => {}}
        onPlaceTimelineEvent={() => ({
          ok: true,
          correct: false,
          state: createCaseState(caseDefinition),
        })}
        onSubmitContradiction={() => ({
          ok: true,
          correct: false,
          state: createCaseState(caseDefinition),
          events: [],
        })}
      />,
    );

    expect(html).not.toContain(hiddenFact.text);
    expect(html).toContain(strings.contradictionUnavailable);
  });

  function renderNotebook(
    caseState: ReturnType<typeof createCaseState>,
    activeTab: 'conclusion' | 'evidence' = 'evidence',
  ) {
    return renderToString(
      <NotebookPanel
        caseDefinition={caseDefinition}
        caseState={caseState}
        activeTab={activeTab}
        strings={strings}
        onSelectTab={() => {}}
        onClose={() => {}}
        onPlaceTimelineEvent={() => ({ ok: true, correct: false, state: caseState })}
        onSubmitContradiction={() => ({ ok: true, correct: false, state: caseState, events: [] })}
        onSubmitAccusation={() => ({ ok: true, correct: false, state: caseState, events: [] })}
      />,
    );
  }
  const objectiveId = caseDefinition.conclusion!.objectiveId;
  function withObjective(status: 'locked' | 'active', flags: Record<string, boolean> = {}) {
    const base = createCaseState(caseDefinition);
    return {
      ...base,
      flags,
      objectiveStatuses: { ...base.objectiveStatuses, [objectiveId]: status },
    };
  }

  it('hides the conclusion tab until the conclusion objective is active', () => {
    expect(renderNotebook(withObjective('locked'))).not.toContain(strings.conclusion);
    expect(renderNotebook(withObjective('active'))).toContain(strings.conclusion);
  });

  it('hides the conclusion tab once the case is closed', () => {
    expect(renderNotebook(withObjective('active', { case_closed: true }))).not.toContain(
      strings.conclusion,
    );
  });

  it('lists every declared suspect by content name on the conclusion tab', () => {
    const html = renderNotebook(withObjective('active'), 'conclusion');
    for (const id of caseDefinition.conclusion!.suspectNpcIds) {
      expect(html).toContain(caseDefinition.npcs.find((npc) => npc.id === id)!.name);
    }
    expect(html).toContain(strings.conclusionPrompt);
  });

  it('offers a review button for each collected evidence', () => {
    const caseState = {
      ...createCaseState(caseDefinition),
      evidenceIds: ['meeting_minutes', 'leo_phone_recording'],
    };
    const html = renderNotebook(caseState, 'evidence');
    expect(html.split(`>${strings.evidenceReview}</button>`).length - 1).toBe(2);
  });
});



