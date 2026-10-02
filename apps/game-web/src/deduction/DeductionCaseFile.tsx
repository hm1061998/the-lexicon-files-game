import type { CaseDefinition, GameState, UiStrings } from '@lexicon/shared-types';
import type { ReaderBlock } from '../investigation/pagination/pageTypes';
import type { InvestigationLearningProps } from '../investigation/RecordedStatements';
import { ReadDocument, textBlock } from '../investigation/pagination/ReadDocument';
export function buildCaseFileBlocks(
  definition: CaseDefinition,
  state: GameState,
  s: UiStrings,
): ReaderBlock[] {
  return [
    textBlock('case:title', definition.title),
    ...(definition.briefing?.lines ?? []).map((line) =>
      textBlock(
        'briefing:' + line.id,
        line.text,
        `briefing:${definition.id}:${line.id}:text`,
        line.vocabularySpans ?? [],
      ),
    ),
    textBlock('case:objective', s.objectiveHeading),
    ...definition.objectives
      .filter((o) => state.objectiveStatuses[o.id] === 'active')
      .map((o) => textBlock('objective:' + o.id, o.text)),
    textBlock('case:instructions', s.deductionInstructions),
  ];
}
export function DeductionCaseFile({
  definition,
  state,
  learning,
}: {
  definition: CaseDefinition;
  state: GameState;
  learning: InvestigationLearningProps;
}) {
  const s = learning.strings;
  const blocks = buildCaseFileBlocks(definition, state, s);
  return <ReadDocument blocks={blocks} learning={learning} label={s.investigationCaseFile} />;
}
