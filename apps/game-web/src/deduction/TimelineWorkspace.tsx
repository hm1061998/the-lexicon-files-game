import { InkButton, PaperButton, PinnedCard } from '@lexicon/ui';
import type { CaseDefinition, TimelinePlacementResult } from '@lexicon/shared-types';
import type { InvestigationView } from '../investigation/selectInvestigationView';
import type { InvestigationLearningProps } from '../investigation/RecordedStatements';
import type { DeductionUi, DeductionUiAction } from './deductionUiReducer';
import { SwipeRow } from './swipe/SwipeRow';

/**
 * The timeline as a string of pins, one per time slot, read left to right. Events not yet placed wait in
 * a tray below; pick one, tap the slot it belongs to, then confirm. Placed events hang under their pin.
 */
export function TimelineWorkspace({
  definition,
  view,
  learning,
  ui,
  dispatch,
  onPlace,
}: {
  definition: CaseDefinition;
  view: InvestigationView;
  learning: InvestigationLearningProps;
  ui: DeductionUi;
  dispatch: (a: DeductionUiAction) => void;
  onPlace: (eventId: string, slotId: string) => TimelinePlacementResult;
}) {
  const strings = learning.strings;
  const event = view.availableEvents.find((e) => e.id === ui.eventId);
  const slot = definition.timeline.slots.find((s) => s.id === ui.slotId);
  const onSubmit = () => {
    if (!event || !slot) return;
    const r = onPlace(event.id, slot.id);
    if (r.ok && r.correct) dispatch({ type: 'selectEvent', id: null });
    dispatch({
      type: 'setFeedback',
      text:
        r.ok && r.correct
          ? strings.timelinePlaced
          : strings.timelineMismatch + ' ' + strings.timelineMismatchHint,
    });
  };
  return (
    <section className="timeline-board">
      <SwipeRow label={strings.timeline} className="timeline-rail">
        <ol className="timeline-slots">
          {definition.timeline.slots.map((s) => {
            const placed = view.placedEvents.filter((e) => e.time === s.time);
            return (
              <li className="timeline-slot" key={s.id}>
                <span className="timeline-slot__time">{s.time}</span>
                <InkButton
                  className="timeline-slot__target"
                  aria-label={strings.timelineSlotLabel + ' ' + s.time}
                  aria-pressed={ui.slotId === s.id}
                  aria-describedby={
                    placed.length ? placed.map((e) => 'placed-' + e.id).join(' ') : undefined
                  }
                  disabled={!event}
                  onClick={() => dispatch({ type: 'selectSlot', id: s.id })}
                >
                  <span className="timeline-slot__pin" aria-hidden="true" />
                  {placed.map((e, i) => (
                    <span
                      className="timeline-placed"
                      key={e.id}
                      id={'placed-' + e.id}
                      style={{ rotate: `${i % 2 ? 1 : -1}deg` }}
                    >
                      {e.text}
                    </span>
                  ))}
                </InkButton>
              </li>
            );
          })}
        </ol>
      </SwipeRow>
      <div className="timeline-tray">
        <h3 className="timeline-tray__title">{strings.timelineSelectEvent}</h3>
        {view.availableEvents.length ? (
          <SwipeRow axis="y" label={strings.timelineSelectEvent}>
            <div className="timeline-events">
              {view.availableEvents.map((e, i) => (
                <PinnedCard
                  as="button"
                  type="button"
                  key={e.id}
                  className="timeline-event"
                  tilt={i % 2 ? 0.7 : -0.7}
                  selected={ui.eventId === e.id}
                  aria-label={e.text}
                  aria-pressed={ui.eventId === e.id}
                  onClick={() => dispatch({ type: 'selectEvent', id: e.id })}
                >
                  <span>{e.text}</span>
                  <small>{e.source}</small>
                </PinnedCard>
              ))}
            </div>
          </SwipeRow>
        ) : (
          <p className="timeline-empty">{strings.timelineEmpty}</p>
        )}
      </div>
      <footer className="timeline-actions">
        {ui.feedback ? (
          <p className="notebook-feedback timeline-sticky" role="status">
            {ui.feedback}
          </p>
        ) : (
          <p className="timeline-hint">
            {event ? strings.timelineSelectSlot : strings.timelineSelectEvent}
          </p>
        )}
        <PaperButton className="workspace-submit" disabled={!event || !slot} onClick={onSubmit}>
          {strings.timelinePlace}
        </PaperButton>
      </footer>
    </section>
  );
}
