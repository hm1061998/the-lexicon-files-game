import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createCaseState } from '@lexicon/game-core';
import { loadCaseDefinition, loadUiStrings } from '@lexicon/game-content';
import { createInitialLanguageProfile } from '@lexicon/learning-engine';
import { NotebookPanel } from './NotebookPanel';
import { createNotebookReadingState } from './notebookReadingState';
import type { NotebookTab } from '../state/gameStore';
const definition = loadCaseDefinition('case-001');
const strings = loadUiStrings('vi');
const initial = createCaseState(definition);
/** The notebook opened on the write-up of the first entry of a tab (the contents view is the default). */
const detailOf = (tab: NotebookTab) => {
  const reading = createNotebookReadingState(definition.id);
  reading.tabs[tab].view = 'detail';
  return reading;
};
const props = {
  caseDefinition: definition,
  caseState: initial,
  strings,
  onSelectTab: () => {},
  onClose: () => {},
  onOpenDeduction: () => {},
};
describe('NotebookPanel reading pages', () => {
  it('offers four reading tabs and routes all reasoning actions to the board', () => {
    const html = renderToStaticMarkup(
      <NotebookPanel
        {...props}
        caseState={{
          ...initial,
          objectiveStatuses: { ...initial.objectiveStatuses, submit_your_conclusion: 'active' },
        }}
        activeTab="timeline"
      />,
    );
    expect(html).toContain(strings.openDeductionBoard);
    expect(html).not.toContain(strings.conclusionSubmit);
    expect(html).not.toContain(strings.contradictionSubmit);
    expect(html).not.toContain(strings.timelinePlace);
    for (const label of [strings.people, strings.evidence, strings.vocabulary, strings.timeline])
      expect(html).toContain(label);
  });
  it('shows only collected evidence and one selected description', () => {
    const html = renderToStaticMarkup(
      <NotebookPanel
        {...props}
        caseState={{ ...initial, evidenceIds: ['meeting_minutes', 'leo_phone_recording'] }}
        activeTab="evidence"
        reading={detailOf('evidence')}
      />,
    );
    const contents = renderToStaticMarkup(
      <NotebookPanel
        {...props}
        caseState={{ ...initial, evidenceIds: ['meeting_minutes', 'leo_phone_recording'] }}
        activeTab="evidence"
      />,
    );
    expect(contents).toContain('/assets/evidence/evidence_meeting_minutes.png');
    expect(contents).toContain('/assets/evidence/evidence_leo_phone_recording.png');
    expect(html).toContain('A phone recording Leo left at 20:29.');
    expect(html).not.toContain('vocabulary-word');
    expect(html).not.toContain('Security Access Log');
    expect(html).toContain(strings.evidenceReview);
  });
  it('keeps description and review action if evidence artwork is absent', () => {
    const html = renderToStaticMarkup(
      <NotebookPanel
        {...props}
        caseDefinition={{
          ...definition,
          evidences: definition.evidences.map((e) => ({ ...e, image: undefined })),
        }}
        caseState={{ ...initial, evidenceIds: ['meeting_minutes'] }}
        activeTab="evidence"
        reading={detailOf('evidence')}
      />,
    );
    expect(html).toContain('Meeting Minutes');
    expect(html).toContain(strings.evidenceReview);
    expect(html).toContain('has-vocabulary');
    expect(html).not.toContain('vocabulary-word'); // Measurement never mounts learning annotations.
  });
  it('records only correctly placed timeline events', () => {
    const empty = renderToStaticMarkup(<NotebookPanel {...props} activeTab="timeline" />);
    expect(empty).not.toContain('21:05');
    expect(empty).not.toContain('The report was discovered missing.');
    const html = renderToStaticMarkup(
      <NotebookPanel
        {...props}
        activeTab="timeline"
        caseState={{ ...initial, timelineEventIds: ['report_missing_21_05'] }}
      />,
    );
    expect(html).toContain('21:05');
    expect(html).toContain('The report was discovered missing.');
    const opened = renderToStaticMarkup(
      <NotebookPanel
        {...props}
        activeTab="timeline"
        caseState={{ ...initial, timelineEventIds: ['report_missing_21_05'] }}
        reading={detailOf('timeline')}
      />,
    );
    expect(opened).toContain('Case introduction');
  });
  it('shows recorded names but mounts only the selected person statements', () => {
    const caseState = { ...initial, flags: { anna_q1_read: true, leo_q1_read: true } };
    const contents = renderToStaticMarkup(
      <NotebookPanel {...props} activeTab="people" caseState={caseState} />,
    );
    expect(contents).toContain('Anna Reed');
    expect(contents).toContain('Leo Tran');
    const html = renderToStaticMarkup(
      <NotebookPanel
        {...props}
        activeTab="people"
        caseState={caseState}
        reading={detailOf('people')}
      />,
    );
    expect(html).not.toContain(
      definition.dialogues.find((t) => t.npcId === 'leo')!.nodes.find((n) => n.id === 'answer1')!
        .text,
    );
    expect(html).toContain('notebook-statement-list');
  });
  it('labels vocabulary sources with authored names and actual stages', () => {
    const profile = createInitialLanguageProfile();
    const word = definition.vocabulary[0]!;
    profile.vocabulary[word.id] = {
      vocabularyId: word.id,
      stage: 'seen',
      encounterCount: 1,
      correctRecognitionCount: 0,
      incorrectRecognitionCount: 0,
      lastSeenAt: '2026-10-01T00:00:00Z',
      contextsSeen: ['evidence:meeting_minutes:description', 'stale:unknown'],
    };
    const html = renderToStaticMarkup(
      <NotebookPanel
        {...props}
        activeTab="vocabulary"
        profile={profile}
        reading={detailOf('vocabulary')}
      />,
    );
    expect(html).toContain(word.lemma);
    expect(html).toContain(word.definitionEn);
    expect(html).toContain(strings.revealTranslation);
    expect(html).not.toContain(word.translationVi);
    expect(html).toContain(strings.vocabularyStageSeen);
    expect(html).toContain('Meeting Minutes');
    expect(html).not.toContain('evidence:meeting_minutes:description');
    expect(html).not.toContain('stale:unknown');
  });
  it.each(['people', 'evidence', 'vocabulary'] as const)(
    'shows empty state on %s without hidden records',
    (tab) => {
      const html = renderToStaticMarkup(<NotebookPanel {...props} activeTab={tab} />);
      expect(html).not.toContain('Anna Reed');
      expect(html).not.toContain('Meeting Minutes');
      expect(html).toContain(
        tab === 'people'
          ? strings.notebookEmptyPeople
          : tab === 'evidence'
            ? strings.evidenceEmpty
            : strings.notebookEmptyVocabulary,
      );
    },
  );
});

describe('NotebookPanel as a spiral notebook', () => {
  const html = renderToStaticMarkup(<NotebookPanel {...props} activeTab="evidence" />);

  it('has two stacked leaves, a gutter crease and seven spiral coils', () => {
    expect(html).toContain('book-leaf--left');
    expect(html).toContain('book-leaf--right');
    expect(html).toContain('book-crease');
    expect(html.match(/class="book-coil"/g)).toHaveLength(7);
    expect(html).not.toContain('paper-panel');
  });

  it('puts the four index tabs on the book edge with one current page', () => {
    expect(html).toContain('folder-tabs--book');
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html).toMatch(/aria-current="page"[^>]*>Chứng cứ</);
    expect(html).not.toMatch(/<nav class="notebook-tabs/);
  });

  it('uses an ink button to close and a paper button to open the board', () => {
    expect(html).toMatch(/<button[^>]*class="ink-button[^"]*"[^>]*aria-label="Đóng"/);
    expect(html).toMatch(/<button[^>]*class="paper-button[^"]*"[^>]*>Mở bảng suy luận</);
  });

  it('stays a labelled modal dialog around the whole book', () => {
    expect(html).toMatch(/<section[^>]*role="dialog"[^>]*aria-modal="true"/);
    const labelled = /aria-labelledby="([^"]+)"/.exec(html)?.[1];
    expect(labelled).toBeTruthy();
    expect(html).toContain(`id="${labelled}"`);
  });

  it('has no unstyled button left in the book', () => {
    const bare = html.match(
      /<button(?![^>]*class="[^"]*(ink-button|paper-button|folder-tab|vocabulary-word))/g,
    );
    expect(bare).toBeNull();
  });
});
