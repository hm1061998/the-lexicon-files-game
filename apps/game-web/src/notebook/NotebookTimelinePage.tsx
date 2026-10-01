import type { UiStrings } from '@lexicon/shared-types';
import type { InvestigationView } from '../investigation/selectInvestigationView';
export function NotebookTimelinePage({events,strings,onOpenDeduction}:{events:InvestigationView['placedEvents'];strings:UiStrings;onOpenDeduction():void}):JSX.Element {
  return <section className="notebook-timeline-page"><h3>{strings.timelinePlaced}</h3>
    {events.length?<ol className="timeline-recorded-list">{events.map(event=><li key={event.id} className="timeline-recorded-card">
      <time className="timeline-time">{event.time}</time><div><strong>{event.text}</strong><p>{event.location}</p></div><span className="timeline-source">{event.source}</span>
    </li>)}</ol>:<p>{strings.timelineEmpty}</p>}
    <button type="button" onClick={onOpenDeduction}>{strings.openDeductionBoard}</button></section>;
}
