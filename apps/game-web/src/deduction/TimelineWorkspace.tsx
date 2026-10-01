import { useState } from 'react';
import type { CaseDefinition, TimelinePlacementResult, UiStrings } from '@lexicon/shared-types';
import type { InvestigationView } from '../investigation/selectInvestigationView';
export function TimelineWorkspace({definition,view,strings,onPlace}:{definition:CaseDefinition;view:InvestigationView;strings:UiStrings;onPlace:(eventId:string,slotId:string)=>TimelinePlacementResult}) {
 const [eventId,setEventId]=useState<string|null>(null);const [slotId,setSlotId]=useState<string|null>(null);const [feedback,setFeedback]=useState('');
 return <section className="timeline-workspace"><h3>{strings.timeline}</h3><p>{strings.timelineSelectEvent}</p>
 <div className="deduction-choices">{view.availableEvents.map(e=><button type="button" key={e.id} aria-pressed={eventId===e.id} onClick={()=>{setEventId(e.id);setFeedback('');}}>{e.text}<small>{e.source}</small></button>)}</div>
 {view.availableEvents.length===0&&<p>{strings.timelineEmpty}</p>}
 {eventId&&<><p>{strings.timelineSelectSlot}</p><div className="deduction-choices">{definition.timeline.slots.map(s=><button type="button" key={s.id} aria-pressed={slotId===s.id} onClick={()=>{setSlotId(s.id);setFeedback('');}}>{s.time}</button>)}</div>
 <button type="button" disabled={!slotId} onClick={()=>{if(!slotId)return;const result=onPlace(eventId,slotId);setFeedback(result.ok&&result.correct?strings.timelinePlaced:`${strings.timelineMismatch} ${strings.timelineMismatchHint}`);if(result.ok&&result.correct){setEventId(null);setSlotId(null);}}}>{strings.timelinePlace}</button></>}
 <p className="notebook-feedback" role="status">{feedback}</p>
 <ol className="timeline-recorded">{view.placedEvents.map(e=><li key={e.id}><time>{e.time}</time><div>{e.text}<small>{e.location}</small></div><span>{e.source}</span></li>)}</ol>
 </section>;
}
