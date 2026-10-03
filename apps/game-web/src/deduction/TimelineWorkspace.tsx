import { useState } from 'react';
import { InkButton, PaperButton } from '@lexicon/ui';
import type { CaseDefinition, TimelinePlacementResult } from '@lexicon/shared-types';
import type { InvestigationView } from '../investigation/selectInvestigationView';
import type { InvestigationLearningProps } from '../investigation/RecordedStatements';
import type { DeductionUi, DeductionUiAction } from './deductionUiReducer';
import { SwipeChoices } from './swipe/SwipeChoices';
import { textBlock } from '../investigation/pagination/ReadDocument';
import { SwipeDocument } from './swipe/SwipeDocument';
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
  const [step, setStep] = useState<'events' | 'slots' | 'confirm' | 'recorded' | 'feedback'>(
    ui.eventId ? 'slots' : 'events',
  );
  const strings = learning.strings;
  const event = view.availableEvents.find((e) => e.id === ui.eventId),
    slot = definition.timeline.slots.find((s) => s.id === ui.slotId);
  const current =
    step === 'slots' && !event
      ? 'events'
      : step === 'confirm' && (!event || !slot)
        ? 'slots'
        : step;
  const recorded = view.placedEvents.flatMap((e) => [
    textBlock(e.id + ':title', e.time + ' — ' + e.text),
    textBlock(e.id + ':source', e.location + ' · ' + e.source),
  ]);
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
    setStep('feedback');
  };
  return (
    <section className="timeline-workspace paginated-workspace">
      <nav className="workspace-steps">
        <InkButton onClick={() => setStep('events')}>{strings.timelineSelectEvent}</InkButton>
        <InkButton disabled={!event} onClick={() => setStep('slots')}>
          {strings.timelineSelectSlot}
        </InkButton>
        <InkButton onClick={() => setStep('recorded')}>{strings.investigationResults}</InkButton>
      </nav>
      <div className="workspace-reading">
        {current === 'events' ? (
          <SwipeChoices
            choices={view.availableEvents.map((e) => ({
              id: e.id,
              label: e.text,
              secondary: e.source,
            }))}
            selected={ui.eventId ? [ui.eventId] : []}
            strings={strings}
            label={strings.timelineSelectEvent}
            empty={<p>{strings.timelineEmpty}</p>}
            anchor={ui.anchors.events}
            onAnchorChange={(a) => dispatch({ type: 'anchor', key: 'events', anchor: a })}
            onSelect={(id) => {
              dispatch({ type: 'selectEvent', id });
              setStep('slots');
            }}
          />
        ) : current === 'slots' ? (
          <SwipeChoices
            choices={definition.timeline.slots.map((s) => ({
              id: s.id,
              label: strings.timelineSlotLabel + ' ' + s.time,
            }))}
            selected={ui.slotId ? [ui.slotId] : []}
            strings={strings}
            label={strings.timelineSelectSlot}
            onSelect={(id) => {
              dispatch({ type: 'selectSlot', id });
              setStep('confirm');
            }}
          />
        ) : current === 'confirm' ? (
          <SwipeDocument
            blocks={[
              textBlock('event:title', event!.text),
              textBlock('event:slot', strings.timelineSlotLabel + ' ' + slot!.time),
            ]}
            learning={learning}
            label={strings.timelineConfirmSelection}
          />
        ) : current === 'recorded' ? (
          <SwipeDocument
            blocks={recorded}
            learning={learning}
            label={strings.timeline}
            empty={<p>{strings.timelineEmpty}</p>}
          />
        ) : (
          <div className="notebook-feedback" role="status">
            <SwipeDocument
              blocks={[textBlock('timeline:feedback', ui.feedback)]}
              learning={learning}
              label={strings.investigationResults}
            />
          </div>
        )}
      </div>
      {current === 'confirm' && (
        <PaperButton className="workspace-submit" onClick={onSubmit}>
          {strings.timelinePlace}
        </PaperButton>
      )}
    </section>
  );
}
