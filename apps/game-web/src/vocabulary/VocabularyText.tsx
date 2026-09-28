import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type {
  TranslationMode,
  UiStrings,
  VocabularyEntry,
  VocabularySpan,
} from '@lexicon/shared-types';
import './vocabulary.css';

export function VocabularyText({
  text,
  translationVi,
  spans,
  contextId,
  catalogue,
  mode,
  strings,
  onEncounter,
  onInspect,
  onRevealTranslation,
  onModeChange,
  tutorialSeen = true,
  onTutorialSeen,
}: {
  text: string;
  translationVi?: string | undefined;
  spans?: readonly VocabularySpan[] | undefined;
  contextId: string;
  catalogue: readonly VocabularyEntry[];
  mode: TranslationMode;
  strings: UiStrings;
  onEncounter(id: string, contextId: string): void;
  onInspect(id: string, contextId: string): void;
  onRevealTranslation(id: string, contextId: string): void;
  onModeChange?: ((mode: TranslationMode) => void) | undefined;
  tutorialSeen?: boolean;
  onTutorialSeen?: (() => void) | undefined;
}): JSX.Element {
  const [active, setActive] = useState<string | null>(null);
  const [translationRevealed, setTranslationRevealed] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const instanceId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLSpanElement>(null);
  const popupId = `${instanceId}-details`;
  const valid = useMemo(() => [...(spans ?? [])].sort((a, b) => a.start - b.start), [spans]);
  useEffect(() => {
    for (const span of valid) onEncounter(span.vocabularyId, contextId);
  }, [valid, contextId, onEncounter]);
  useEffect(() => {
    setActive(null);
    setTranslationRevealed(false);
  }, [mode]);
  useEffect(() => {
    if (active) popup.current?.focus();
  }, [active]);
  useEffect(() => {
    if (!active) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setActive(null);
        trigger.current?.focus();
      }
    };
    window.addEventListener('keydown', handleEscape, true);
    return () => window.removeEventListener('keydown', handleEscape, true);
  }, [active]);
  const parts: JSX.Element[] = [];
  let cursor = 0;
  for (const [index, span] of valid.entries()) {
    if (span.start < cursor || span.end > text.length) continue;
    if (span.start > cursor)
      parts.push(<span key={`text-${index}`}>{text.slice(cursor, span.start)}</span>);
    const entry = catalogue.find((item) => item.id === span.vocabularyId);
    if (!entry) continue;
    parts.push(
      <button
        key={span.vocabularyId}
        id={`${instanceId}-${span.vocabularyId}`}
        ref={active === span.vocabularyId ? trigger : undefined}
        className="vocabulary-word"
        type="button"
        aria-haspopup="dialog"
        aria-expanded={active === span.vocabularyId}
        aria-controls={active === span.vocabularyId ? popupId : undefined}
        aria-label={`${text.slice(span.start, span.end)}. ${strings.inspectVocabulary}`}
        onClick={() => {
          onInspect(entry.id, contextId);
          if (!tutorialSeen) {
            setShowTutorial(true);
            onTutorialSeen?.();
          }
          setActive(active === entry.id ? null : entry.id);
        }}
      >
        {text.slice(span.start, span.end)}
      </button>,
    );
    cursor = span.end;
  }
  if (cursor < text.length) parts.push(<span key="text-end">{text.slice(cursor)}</span>);
  const entry = catalogue.find((item) => item.id === active);
  return (
    <span className="vocabulary-reader">
      {onModeChange && (
        <label className="vocabulary-mode">
          {strings.vocabularyMode}
          <select
            value={mode}
            onChange={(event) => onModeChange(event.target.value as TranslationMode)}
          >
            <option value="Beginner">{strings.vocabularyModeBeginner}</option>
            <option value="Learning">{strings.vocabularyModeLearning}</option>
            <option value="Immersion">{strings.vocabularyModeImmersion}</option>
          </select>
        </label>
      )}
      {parts}
      {translationVi && mode === 'Beginner' && (
        <span className="vocabulary-translation">{translationVi}</span>
      )}
      {entry && (
        <span
          id={popupId}
          ref={popup}
          className="vocabulary-popover"
          role="dialog"
          tabIndex={-1}
          aria-label={entry.lemma}
        >
          {showTutorial && (
            <span className="vocabulary-tutorial">{strings.vocabularyTutorial}</span>
          )}
          <strong>{entry.lemma}</strong>
          <span>{entry.partOfSpeech}</span>
          <span>{entry.definitionEn}</span>
          {entry.synonyms?.length ? <span>{entry.synonyms.join(', ')}</span> : null}
          {entry.examples[0] ? <span>{entry.examples[0]}</span> : null}
          {mode === 'Beginner' ? (
            <span>{entry.translationVi}</span>
          ) : mode === 'Learning' ? (
            translationRevealed ? (
              <span>{entry.translationVi}</span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onRevealTranslation(entry.id, contextId);
                  setTranslationRevealed(true);
                }}
              >
                {strings.revealTranslation}
              </button>
            )
          ) : null}
          <button
            type="button"
            onClick={() => {
              setActive(null);
              setShowTutorial(false);
              trigger.current?.focus();
            }}
          >
            {strings.close}
          </button>
        </span>
      )}
    </span>
  );
}
