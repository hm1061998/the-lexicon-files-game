import type {
  CaseDefinition,
  LanguageProfile,
  TranslationMode,
  UiStrings,
} from '@lexicon/shared-types';
import type { NotebookTab } from '../state/gameStore';
import type { InvestigationView } from '../investigation/selectInvestigationView';
import type { ReaderBlock } from '../investigation/pagination/pageTypes';
import { textBlock } from '../investigation/pagination/ReadDocument';
import { resolveInvestigationArtwork } from '../investigation/resolveInvestigationArtwork';
import { resolveVocabularySources } from '../investigation/resolveVocabularySources';
export type NotebookItem = {
  id: string;
  name: string;
  subtitle: string;
  image: string | undefined;
  portrait: boolean;
};
export type NotebookFixed =
  | { kind: 'image'; name: string; url: string | undefined; portrait: boolean }
  | { kind: 'action'; action: 'review' | 'reveal' | 'board'; label: string; target: string };
export function buildNotebookBlocks(
  definition: CaseDefinition,
  view: InvestigationView,
  tab: NotebookTab,
  selectedId: string | null,
  strings: UiStrings,
  mode: TranslationMode,
  profile?: LanguageProfile,
  revealed = false,
) {
  const words = definition.vocabulary.filter((w) => profile?.vocabulary[w.id]);
  const items: NotebookItem[] =
    tab === 'people'
      ? view.people.map((p) => ({
          id: p.npc.id,
          name: p.npc.name,
          subtitle: p.npc.role,
          image: resolveInvestigationArtwork(definition, p.npc.id),
          portrait: true,
        }))
      : tab === 'evidence'
        ? view.evidence.map((e) => ({
            id: e.id,
            name: e.name,
            subtitle: '',
            image: e.image,
            portrait: false,
          }))
        : tab === 'vocabulary'
          ? words.map((w) => ({
              id: w.id,
              name: w.lemma,
              subtitle: w.partOfSpeech,
              image: undefined,
              portrait: false,
            }))
          : [];
  const selected = items.find((i) => i.id === selectedId) ?? items[0];
  const blocks: ReaderBlock[] = [];
  const fixed: Record<string, NotebookFixed> = {};
  const add = (id: string, text: string) => {
    if (text) blocks.push(textBlock(id, text));
  };
  const addFixed = (id: string, value: NotebookFixed) => {
    fixed[id] = value;
    blocks.push({ kind: 'fixed', id });
  };
  const translated = (id: string, text?: string) => {
    if (mode === 'Beginner' && text) add(id + ':translation', text);
  };
  if (selected) {
    add(selected.id + ':title', selected.name);
    if (selected.image)
      addFixed(selected.id + ':image', {
        kind: 'image',
        name: selected.name,
        url: selected.image,
        portrait: selected.portrait,
      });
  }
  if (tab === 'people' && selected) {
    const p = view.people.find((p) => p.npc.id === selected.id)!;
    add(p.npc.id + ':role', p.npc.role);
    add(
      p.npc.id + ':status',
      p.status === 'complete'
        ? strings.notebookInterviewComplete
        : strings.notebookInterviewInProgress,
    );
    add(p.npc.id + ':statements', strings.notebookStatementsHeading);
    for (const n of p.statements) {
      const id = p.npc.id + ':statement:' + n.id;
      blocks.push(textBlock(id, n.text, `dialogue:${p.treeId}:${n.id}:text`, n.vocabularySpans));
      translated(id, n.translationVi);
    }
    if (!p.statements.length) add(p.npc.id + ':empty', strings.notebookEmptyPeople);
  }
  if (tab === 'evidence' && selected) {
    const e = view.evidence.find((e) => e.id === selected.id)!;
    blocks.push(
      textBlock(
        e.id + ':description',
        e.description,
        `evidence:${e.id}:description`,
        e.vocabularySpans,
      ),
    );
    translated(e.id, e.descriptionVi);
    const people = view.people.filter((p) => e.relatedNpcIds?.includes(p.npc.id));
    if (people.length)
      add(
        e.id + ':related',
        strings.notebookRelatedPeople + ': ' + people.map((p) => p.npc.name).join(', '),
      );
    addFixed(e.id + ':review', {
      kind: 'action',
      action: 'review',
      target: e.id,
      label: strings.evidenceReview,
    });
  }
  if (tab === 'vocabulary' && selected) {
    const w = words.find((w) => w.id === selected.id)!;
    const progress = profile!.vocabulary[w.id]!;
    const labels = {
      unknown: strings.vocabularyStageUnknown,
      seen: strings.vocabularyStageSeen,
      recognized: strings.vocabularyStageRecognized,
      understood: strings.vocabularyStageUnderstood,
      used: strings.vocabularyStageUsed,
      mastered: strings.vocabularyStageMastered,
    };
    add(w.id + ':stage', labels[progress.stage]);
    add(w.id + ':part', w.partOfSpeech);
    add(w.id + ':definition', w.definitionEn);
    if (mode === 'Beginner' || (mode === 'Learning' && revealed))
      add(w.id + ':translation', w.translationVi);
    else if (mode === 'Learning')
      addFixed(w.id + ':reveal', {
        kind: 'action',
        action: 'reveal',
        target: w.id,
        label: strings.revealTranslation,
      });
    if (w.examples.length) add(w.id + ':examples', strings.notebookVocabularyExamples);
    w.examples.forEach((s, i) => add(w.id + ':example:' + i, s));
    const sources = resolveVocabularySources(definition, progress.contextsSeen);
    if (sources.length) add(w.id + ':sources', strings.notebookVocabularySources);
    sources.forEach((s, i) => add(w.id + ':source:' + i, s));
  }
  if (tab === 'timeline') {
    view.placedEvents.forEach((e) => {
      add(e.id + ':title', e.time + ' — ' + e.text);
      add(e.id + ':source', e.location + ' · ' + e.source);
    });
    if (!blocks.length) {
      add('timeline:empty', strings.timelineEmpty);
      addFixed('timeline:board', {
        kind: 'action',
        action: 'board',
        target: '',
        label: strings.openDeductionBoard,
      });
    }
  }
  return { items, selected, blocks, fixed };
}
