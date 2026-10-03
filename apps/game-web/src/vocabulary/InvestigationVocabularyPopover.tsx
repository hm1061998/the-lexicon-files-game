import { createPortal } from 'react-dom';
import { InkButton } from '@lexicon/ui';
import { useMemo, type RefObject } from 'react';
import type { TranslationMode, UiStrings, VocabularyEntry } from '@lexicon/shared-types';
import type { ReaderBlock } from '../investigation/pagination/pageTypes';
import { textBlock } from '../investigation/pagination/ReadDocument';
import { SwipeRow } from '../deduction/swipe/SwipeRow';

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
  const textOf = (block: ReaderBlock): string => (block.kind === 'text' ? block.text : '');
  // The card is a pinned note, not a paged sheet: a long entry scrolls up and down under a finger or a drag.
  const popover = (
    <div
      id={popupId}
      ref={popupRef}
      className="vocabulary-popover investigation-vocabulary-popover"
      role="dialog"
      tabIndex={-1}
      aria-label={entry.lemma}
    >
      <span className="vocab-card__pin" aria-hidden="true" />
      <InkButton className="investigation-vocabulary-close" sfx="paper-close" onClick={onClose}>
        {strings.close}
      </InkButton>
      <SwipeRow axis="y" label={entry.lemma} className="vocab-card__body">
        {blocks.map((block) => {
          const kind = block.id.slice(entry.id.length + 1);
          const text = textOf(block);
          if (kind === 'reveal')
            return (
              <InkButton key={block.id} className="vocab-card__reveal" onClick={onReveal}>
                {strings.revealTranslation}
              </InkButton>
            );
          if (kind === 'title')
            return (
              <h3 key={block.id} className="vocab-card__word">
                {text}
              </h3>
            );
          if (kind === 'part')
            return (
              <span key={block.id} className="vocab-card__part">
                {text}
              </span>
            );
          if (kind.startsWith('example'))
            return (
              <p key={block.id} className="vocab-card__example">
                {text}
              </p>
            );
          return (
            <p key={block.id} className={`vocab-card__${kind}`}>
              {text}
            </p>
          );
        })}
      </SwipeRow>
    </div>
  );
  return host ? createPortal(popover, host) : popover;
}
