import { createPortal } from 'react-dom';
import { useMemo, type RefObject } from 'react';
import type { TranslationMode, UiStrings, VocabularyEntry } from '@lexicon/shared-types';
import type { InvestigationLearningProps } from '../investigation/RecordedStatements';
import type { ReaderBlock } from '../investigation/pagination/pageTypes';
import { ReadDocument, textBlock } from '../investigation/pagination/ReadDocument';

const noop = () => undefined;

export interface InvestigationVocabularyPopoverProps {
  entry: VocabularyEntry;
  mode: TranslationMode;
  strings: UiStrings;
  popupId: string;
  popupRef: RefObject<HTMLDivElement>;
  /** Dialog element the popover lives in, so the focus trap and the viewport bounds stay shared. */
  host: HTMLElement | null;
  revealed: boolean;
  showTutorial: boolean;
  onReveal(): void;
  onClose(): void;
}

/** Block ids for the definition card; the reveal button is a fixed block so it keeps its place. */
export function buildPopoverBlocks(
  entry: VocabularyEntry,
  mode: TranslationMode,
  strings: UiStrings,
  revealed: boolean,
  showTutorial: boolean,
): readonly ReaderBlock[] {
  const blocks: ReaderBlock[] = [];
  if (showTutorial) blocks.push(textBlock(`${entry.id}:tutorial`, strings.vocabularyTutorial));
  blocks.push(textBlock(`${entry.id}:title`, entry.lemma));
  blocks.push(textBlock(`${entry.id}:part`, entry.partOfSpeech));
  blocks.push(textBlock(`${entry.id}:definition`, entry.definitionEn));
  if (mode === 'Beginner' || (mode === 'Learning' && revealed)) {
    blocks.push(textBlock(`${entry.id}:translation`, entry.translationVi));
  } else if (mode === 'Learning') {
    blocks.push({ kind: 'fixed', id: `${entry.id}:reveal` });
  }
  if (entry.synonyms?.length)
    blocks.push(textBlock(`${entry.id}:synonyms`, entry.synonyms.join(', ')));
  entry.examples.forEach((example, index) =>
    blocks.push(textBlock(`${entry.id}:example:${index}`, example)),
  );
  return blocks;
}

export function InvestigationVocabularyPopover({
  entry,
  mode,
  strings,
  popupId,
  popupRef,
  host,
  revealed,
  showTutorial,
  onReveal,
  onClose,
}: InvestigationVocabularyPopoverProps): JSX.Element {
  const blocks = useMemo(
    () => buildPopoverBlocks(entry, mode, strings, revealed, showTutorial),
    [entry, mode, strings, revealed, showTutorial],
  );
  // Definition text carries no vocabulary spans, so the reader never fires learning callbacks.
  const learning: InvestigationLearningProps = {
    catalogue: [],
    strings,
    translationMode: mode,
    onEncounter: noop,
    onInspect: noop,
    onRevealTranslation: noop,
  };
  const popover = (
    <div
      id={popupId}
      ref={popupRef}
      className="vocabulary-popover investigation-vocabulary-popover"
      role="dialog"
      tabIndex={-1}
      aria-label={entry.lemma}
    >
      <div className="investigation-vocabulary-pages">
        <ReadDocument
          blocks={blocks}
          fixed={{
            [`${entry.id}:reveal`]: (
              <button type="button" onClick={onReveal}>
                {strings.revealTranslation}
              </button>
            ),
          }}
          label={entry.lemma}
          learning={learning}
          revision={`${mode}:${revealed}:${showTutorial}`}
        />
      </div>
      <button type="button" className="investigation-vocabulary-close" onClick={onClose}>
        {strings.close}
      </button>
    </div>
  );
  return host ? createPortal(popover, host) : popover;
}
