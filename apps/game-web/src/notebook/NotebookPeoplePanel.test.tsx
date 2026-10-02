import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { loadCaseDefinition, loadUiStrings } from '@lexicon/game-content';
import { createCaseState } from '@lexicon/game-core';
import type { TranslationMode } from '@lexicon/shared-types';
import { selectNotebookPeople, type NotebookPerson } from './selectNotebookPeople';
import { NotebookPeoplePanel } from './NotebookPeoplePanel';
import { NotebookPanel } from './NotebookPanel';

const definition = loadCaseDefinition('case-001');
const strings = loadUiStrings('vi');
const progress = { ...createCaseState(definition), flags: { anna_q1_read: true } };
const partial = selectNotebookPeople(definition, progress);
const noop = () => undefined;
function render(people: readonly NotebookPerson[], mode: TranslationMode = 'Learning') {
  return renderToStaticMarkup(
    <NotebookPeoplePanel
      people={people}
      catalogue={definition.vocabulary}
      strings={strings}
      translationMode={mode}
      onEncounter={noop}
      onInspect={noop}
      onRevealTranslation={noop}
    />,
  );
}

describe('NotebookPeoplePanel', () => {
  it('renders only recorded profiles and node text', () => {
    const html = render(partial);
    const text = html.replace(/<[^>]*>/g, '');
    expect(text).toContain(partial[0]!.npc.name);
    expect(text).toContain(partial[0]!.npc.role);
    expect(text).toContain(partial[0]!.statements[1]!.text);
    expect(html).not.toContain(definition.npcs[1]!.name);
    expect(text).not.toContain(
      definition.dialogues[0]!.nodes.find(({ id }) => id === 'answer2')!.text,
    );
    expect(html).not.toContain(strings.vocabularyMode);
    expect(html).not.toContain(strings.voiceReplay);
    expect(html).not.toContain('<select');
    expect(html).toContain('vocabulary-word');
  });

  it('renders status labels from content', () => {
    expect(render(partial)).toContain(strings.notebookInterviewInProgress);
    expect(render(partial.map((person) => ({ ...person, status: 'complete' })))).toContain(
      strings.notebookInterviewComplete,
    );
    expect(render(partial)).toContain(strings.notebookStatementsHeading);
  });

  it('keeps missing translation absent', () => {
    const translated = partial.map((person) => ({
      ...person,
      statements: person.statements.map((node, index) => ({
        ...node,
        translationVi: index === 0 ? 'Authored translation' : undefined,
      })),
    }));
    const beginner = render(translated, 'Beginner');
    expect(beginner).toContain('Authored translation');
    expect(beginner.match(/class="vocabulary-translation"/g)).toHaveLength(1);
    expect(render(translated, 'Learning')).not.toContain('Authored translation');
    expect(render(translated, 'Immersion')).not.toContain('Authored translation');
  });

  it('uses existing empty state', () => {
    expect(render([])).toContain(strings.notebookEmptyPeople);
    expect(render([])).not.toContain('<article');
  });

  it('connects recorded people to the notebook parent', () => {
    const html = renderToStaticMarkup(
      <NotebookPanel
        caseDefinition={definition}
        caseState={progress}
        activeTab="people"
        strings={strings}
        onSelectTab={noop}
        onClose={noop}
        onOpenDeduction={noop}
      />,
    );
    expect(html).toContain(partial[0]!.npc.name);
    expect(html).not.toContain(strings.notebookEmptyPeople);
  });
});
