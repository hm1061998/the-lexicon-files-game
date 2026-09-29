import { useEffect, useId, useState } from 'react';
import { PaperPanel } from '@lexicon/ui';
import type {
  CaseDefinition,
  AccusationResult,
  ContradictionResult,
  GameState,
  LanguageProfile,
  TimelinePlacementResult,
  TranslationMode,
  UiStrings,
} from '@lexicon/shared-types';
import type { NotebookTab } from '../state/gameStore';
import { VocabularyText } from '../vocabulary/VocabularyText';
import { AccusationPanel } from '../conclusion/AccusationPanel';
import './notebook.css';

const TABS: readonly {
  id: NotebookTab;
  label: keyof Pick<UiStrings, 'people' | 'evidence' | 'vocabulary' | 'timeline' | 'conclusion'>;
}[] = [
  { id: 'people', label: 'people' },
  { id: 'evidence', label: 'evidence' },
  { id: 'vocabulary', label: 'vocabulary' },
  { id: 'timeline', label: 'timeline' },
  { id: 'conclusion', label: 'conclusion' },
];

export function NotebookPanel({
  caseDefinition,
  caseState,
  activeTab,
  strings,
  onSelectTab,
  onClose,
  profile,
  translationMode = 'Learning',
  onRevealTranslation = () => undefined,
  onEncounter = () => undefined,
  onInspect = () => undefined,
  onTranslationModeChange = () => undefined,
  onPlaceTimelineEvent,
  onSubmitContradiction,
  onSubmitAccusation,
  onReviewEvidence = () => undefined,
}: {
  caseDefinition: CaseDefinition;
  caseState: GameState;
  activeTab: NotebookTab;
  strings: UiStrings;
  onSelectTab(tab: NotebookTab): void;
  onClose(): void;
  profile?: LanguageProfile;
  translationMode?: TranslationMode;
  onRevealTranslation?(vocabularyId: string, contextId: string): void;
  onEncounter?(vocabularyId: string, contextId: string): void;
  onInspect?(vocabularyId: string, contextId: string): void;
  onTranslationModeChange?(mode: TranslationMode): void;
  onPlaceTimelineEvent(eventId: string, slotId: string): TimelinePlacementResult;
  onSubmitContradiction(contradictionId: string, factIds: readonly string[]): ContradictionResult;
  onSubmitAccusation(suspectNpcId: string): AccusationResult;
  onReviewEvidence?(evidenceId: string): void;
}): JSX.Element {
  const headingId = useId();
  const [revealedVocabularyId, setRevealedVocabularyId] = useState<string | null>(null);
  const [selectedTimelineEventId, setSelectedTimelineEventId] = useState<string | null>(null);
  const [selectedTimelineSlotId, setSelectedTimelineSlotId] = useState<string | null>(null);
  const [selectedFactIds, setSelectedFactIds] = useState<string[]>([]);
  const [timelineFeedback, setTimelineFeedback] = useState<'placed' | 'mismatch' | null>(null);
  const [contradictionFeedback, setContradictionFeedback] = useState(false);
  useEffect(() => setRevealedVocabularyId(null), [translationMode]);
  const discovered = caseDefinition.evidences.filter(({ id }) =>
    caseState.evidenceIds.includes(id),
  );
  const availableTimelineEvents = caseDefinition.timeline.events.filter(
    (event) =>
      event.availability.type === 'availableFromStart' ||
      event.availability.factIds.every((factId) => caseState.discoveredFactIds.includes(factId)),
  );
  const availableTimelineEventIds = new Set(availableTimelineEvents.map(({ id }) => id));
  const unplacedTimelineEvents = availableTimelineEvents.filter(
    ({ id }) => !caseState.timelineEventIds.includes(id),
  );
  const placedTimelineEvents = caseDefinition.timeline.events
    .filter(({ id }) => caseState.timelineEventIds.includes(id))
    .sort(
      (a, b) =>
        caseDefinition.timeline.slots.findIndex(({ id }) => id === a.slotId) -
        caseDefinition.timeline.slots.findIndex(({ id }) => id === b.slotId),
    );
  const availableContradictions = caseDefinition.contradictions.filter((item) =>
    item.factIds.every((factId) => caseState.discoveredFactIds.includes(factId)),
  );
  const conclusion = caseDefinition.conclusion;
  const conclusionAvailable =
    conclusion !== undefined &&
    caseState.objectiveStatuses[conclusion.objectiveId] === 'active' &&
    caseState.flags.case_closed !== true;
  const visibleTabs = TABS.filter(({ id }) => id !== 'conclusion' || conclusionAvailable);
  const suspects = (conclusion?.suspectNpcIds ?? []).map((id) => ({
    id,
    name: caseDefinition.npcs.find((npc) => npc.id === id)?.name ?? id,
  }));
  const discoveredFacts = caseDefinition.facts.filter(({ id }) =>
    caseState.discoveredFactIds.includes(id),
  );

  function placeSelectedTimelineEvent(): void {
    if (!selectedTimelineEventId || !selectedTimelineSlotId) return;
    const result = onPlaceTimelineEvent(selectedTimelineEventId, selectedTimelineSlotId);
    if (!result.ok || !result.correct) {
      setTimelineFeedback('mismatch');
      return;
    }
    setSelectedTimelineEventId(null);
    setSelectedTimelineSlotId(null);
    setTimelineFeedback('placed');
  }

  function submitSelectedContradiction(contradictionId: string): void {
    if (selectedFactIds.length !== 2) return;
    const result = onSubmitContradiction(contradictionId, selectedFactIds);
    if (!result.ok || !result.correct) {
      setContradictionFeedback(true);
      return;
    }
    setSelectedFactIds([]);
    setContradictionFeedback(false);
  }

  return (
    <div className="notebook-overlay">
      <PaperPanel as="div" className="notebook-panel">
        <section aria-labelledby={headingId}>
          <label className="vocabulary-mode">
            {strings.vocabularyMode}
            <select
              value={translationMode}
              onChange={(event) => onTranslationModeChange(event.target.value as TranslationMode)}
            >
              <option value="Beginner">{strings.vocabularyModeBeginner}</option>
              <option value="Learning">{strings.vocabularyModeLearning}</option>
              <option value="Immersion">{strings.vocabularyModeImmersion}</option>
            </select>
          </label>
          <header className="notebook-header">
            <h2 id={headingId}>{strings.notebook}</h2>
            <button type="button" onClick={onClose} aria-label={strings.close}>
              {strings.close}
            </button>
          </header>
          <nav className="notebook-tabs" aria-label={strings.notebook}>
            {visibleTabs.map(({ id, label }) => (
              <button
                type="button"
                key={id}
                aria-current={activeTab === id ? 'page' : undefined}
                onClick={() => onSelectTab(id)}
                aria-pressed={activeTab === id}
              >
                {strings[label]}
              </button>
            ))}
          </nav>
          <div className="notebook-content">
            {activeTab === 'people' && <p>{strings.notebookEmptyPeople}</p>}
            {activeTab === 'conclusion' && conclusionAvailable && (
              <AccusationPanel
                suspects={suspects}
                strings={strings}
                onSubmit={onSubmitAccusation}
              />
            )}
            {activeTab === 'vocabulary' &&
              (Object.keys(profile?.vocabulary ?? {}).length ? (
                <ul>
                  {caseDefinition.vocabulary
                    .filter((entry) => profile?.vocabulary[entry.id])
                    .map((entry) => (
                      <li key={entry.id}>
                        <h3>
                          {entry.lemma}{' '}
                          <small>
                            {profile?.vocabulary[entry.id]?.stage === 'seen'
                              ? strings.vocabularyStageSeen
                              : profile?.vocabulary[entry.id]?.stage}
                          </small>
                        </h3>
                        <p>{entry.partOfSpeech}</p>
                        <p>{entry.definitionEn}</p>
                        {entry.examples.map((example) => (
                          <p key={example}>{example}</p>
                        ))}
                        <ul>
                          {profile?.vocabulary[entry.id]?.contextsSeen.map((contextId) => (
                            <li key={contextId}>{contextId}</li>
                          ))}
                        </ul>
                        {translationMode === 'Beginner' ? (
                          <p>{entry.translationVi}</p>
                        ) : translationMode === 'Learning' && revealedVocabularyId === entry.id ? (
                          <p>{entry.translationVi}</p>
                        ) : translationMode === 'Learning' ? (
                          <button
                            type="button"
                            onClick={() => {
                              const contextId = profile?.vocabulary[entry.id]?.contextsSeen[0];
                              if (contextId) onRevealTranslation(entry.id, contextId);
                              setRevealedVocabularyId(entry.id);
                            }}
                          >
                            {strings.revealTranslation}
                          </button>
                        ) : null}
                      </li>
                    ))}
                </ul>
              ) : (
                <p>{strings.notebookEmptyVocabulary}</p>
              ))}
            {activeTab === 'evidence' &&
              (discovered.length > 0 ? (
                <ul>
                  {discovered.map((item) => (
                    <li key={item.id}>
                      <h3>{item.name}</h3>
                      <button
                        type="button"
                        aria-label={`${strings.evidenceReview}: ${item.name}`}
                        onClick={() => onReviewEvidence(item.id)}
                      >
                        {strings.evidenceReview}
                      </button>
                      <p>
                        <VocabularyText
                          text={item.description}
                          translationVi={item.descriptionVi}
                          spans={item.vocabularySpans}
                          contextId={`evidence:${item.id}:description`}
                          catalogue={caseDefinition.vocabulary}
                          mode={translationMode}
                          strings={strings}
                          onEncounter={onEncounter}
                          onInspect={onInspect}
                          onRevealTranslation={onRevealTranslation}
                        />
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>{strings.evidenceEmpty}</p>
              ))}
            {activeTab === 'timeline' && (
              <div className="timeline-notebook">
                <section aria-labelledby={`${headingId}-timeline`}>
                  <h3 id={`${headingId}-timeline`}>{strings.timeline}</h3>
                  {placedTimelineEvents.length > 0 && (
                    <ol className="timeline-recorded-list" aria-label={strings.timelinePlaced}>
                      {placedTimelineEvents.map((event) => {
                        const slot = caseDefinition.timeline.slots.find(
                          ({ id }) => id === event.slotId,
                        );
                        return (
                          <li key={event.id} className="timeline-recorded-card">
                            <span className="timeline-time">
                              {strings.timelineSlotLabel} {slot?.time}
                            </span>
                            <span>{event.text}</span>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                  {unplacedTimelineEvents.length === 0 ? (
                    placedTimelineEvents.length === 0 && <p>{strings.timelineEmpty}</p>
                  ) : (
                    <fieldset className="timeline-event-picker">
                      <legend>{strings.timelineSelectEvent}</legend>
                      <ul className="timeline-event-list">
                        {unplacedTimelineEvents.map((event) => (
                          <li key={event.id}>
                            <article
                              className={`timeline-event-card${
                                selectedTimelineEventId === event.id ? ' is-selected' : ''
                              }`}
                            >
                              <button
                                type="button"
                                aria-pressed={selectedTimelineEventId === event.id}
                                onClick={() => {
                                  setSelectedTimelineEventId(event.id);
                                  setSelectedTimelineSlotId(null);
                                  setTimelineFeedback(null);
                                }}
                              >
                                {event.text}
                              </button>
                              <dl>
                                <div>
                                  <dt>{strings.timelineLocation}</dt>
                                  <dd>{event.location}</dd>
                                </div>
                                <div>
                                  <dt>{strings.timelineSource}</dt>
                                  <dd>{event.source}</dd>
                                </div>
                                <div>
                                  <dt>{strings.timelineConfidence}</dt>
                                  <dd>{event.confidence}</dd>
                                </div>
                              </dl>
                            </article>
                          </li>
                        ))}
                      </ul>
                    </fieldset>
                  )}
                  {selectedTimelineEventId &&
                    availableTimelineEventIds.has(selectedTimelineEventId) && (
                      <fieldset className="timeline-slot-picker">
                        <legend>{strings.timelineSelectSlot}</legend>
                        <div className="timeline-slot-list">
                          {caseDefinition.timeline.slots.map((slot) => (
                            <button
                              type="button"
                              key={slot.id}
                              aria-pressed={selectedTimelineSlotId === slot.id}
                              className={selectedTimelineSlotId === slot.id ? 'is-selected' : ''}
                              onClick={() => {
                                setSelectedTimelineSlotId(slot.id);
                                setTimelineFeedback(null);
                              }}
                            >
                              {strings.timelineSlotLabel} {slot.time}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          className="timeline-place-action"
                          disabled={!selectedTimelineSlotId}
                          onClick={placeSelectedTimelineEvent}
                        >
                          {strings.timelinePlace}
                        </button>
                      </fieldset>
                    )}
                  {timelineFeedback === 'mismatch' && (
                    <p role="status" aria-live="polite" className="notebook-feedback">
                      {strings.timelineMismatch} {strings.timelineMismatchHint}
                    </p>
                  )}
                  {timelineFeedback === 'placed' && (
                    <p role="status" aria-live="polite" className="notebook-feedback">
                      {strings.timelinePlaced}
                    </p>
                  )}
                </section>

                <section aria-labelledby={`${headingId}-contradiction`}>
                  <h3 id={`${headingId}-contradiction`}>{strings.contradictionSelectFacts}</h3>
                  {availableContradictions.length === 0 ? (
                    <p>{strings.contradictionUnavailable}</p>
                  ) : (
                    availableContradictions.map((contradiction) => {
                      const isConfirmed = caseState.contradictionIds.includes(contradiction.id);
                      return (
                        <div className="contradiction-card" key={contradiction.id}>
                          {isConfirmed ? (
                            <p role="status" aria-live="polite" className="contradiction-confirmed">
                              {strings.contradictionFound}
                            </p>
                          ) : (
                            <>
                              <fieldset className="contradiction-fact-picker">
                                <legend>{strings.contradictionSelectFacts}</legend>
                                <p>
                                  {strings.contradictionSelectedCount}: {selectedFactIds.length}/2
                                </p>
                                <ul>
                                  {discoveredFacts.map((fact) => {
                                    const isSelected = selectedFactIds.includes(fact.id);
                                    return (
                                      <li key={fact.id}>
                                        <button
                                          type="button"
                                          aria-pressed={isSelected}
                                          disabled={selectedFactIds.length === 2 && !isSelected}
                                          className={isSelected ? 'is-selected' : ''}
                                          onClick={() => {
                                            setSelectedFactIds((current) =>
                                              isSelected
                                                ? current.filter((id) => id !== fact.id)
                                                : [...current, fact.id],
                                            );
                                            setContradictionFeedback(false);
                                          }}
                                        >
                                          {fact.text}
                                        </button>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </fieldset>
                              <button
                                type="button"
                                disabled={selectedFactIds.length !== 2}
                                onClick={() => submitSelectedContradiction(contradiction.id)}
                              >
                                {strings.contradictionSubmit}
                              </button>
                              {contradictionFeedback && (
                                <p role="status" aria-live="polite" className="notebook-feedback">
                                  {strings.contradictionMismatch}{' '}
                                  {strings.contradictionMismatchHint}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                </section>
              </div>
            )}
          </div>
        </section>
      </PaperPanel>
    </div>
  );
}
