import { useState } from 'react';
import type { ContradictionResult, UiStrings } from '@lexicon/shared-types';
import type { InvestigationView } from '../investigation/selectInvestigationView';
export function ContradictionWorkspace({view,strings,onSubmit}:{view:InvestigationView;strings:UiStrings;onSubmit:(id:string,factIds:readonly string[])=>ContradictionResult}){
 const [selected,setSelected]=useState<readonly string[]>([]);const [feedback,setFeedback]=useState('');
 return <section><h3>{strings.deductionFactsHeading}</h3><p>{strings.contradictionSelectFacts}</p>
 <div className="deduction-facts">{view.facts.map(f=><button type="button" key={f.id} data-board-node={`fact:${f.id}`} aria-pressed={selected.includes(f.id)} disabled={!selected.includes(f.id)&&selected.length===2} onClick={()=>{setSelected(ids=>ids.includes(f.id)?ids.filter(id=>id!==f.id):[...ids,f.id]);setFeedback('');}}>{f.text}</button>)}</div>
 <p>{strings.contradictionSelectedCount}: {selected.length}/2</p>
 <button type="button" disabled={selected.length===0} onClick={()=>{setSelected([]);setFeedback('');}}>{strings.deductionClearSelection}</button>
 {view.availableContradictions.length===0&&<p>{strings.contradictionUnavailable}</p>}
 {view.availableContradictions.map(c=><button type="button" key={c.id} disabled={selected.length!==2} onClick={()=>{const result=onSubmit(c.id,selected);setFeedback(result.ok&&result.correct?strings.contradictionFound:`${strings.contradictionMismatch} ${strings.contradictionMismatchHint}`);if(result.ok&&result.correct)setSelected([]);}}>{strings.contradictionSubmit}</button>)}
 <p role="status" className="notebook-feedback">{feedback}</p>
 {view.confirmedContradictions.map(c=><article className="contradiction-confirmed" key={c.id}><h3>{strings.contradictionFound}</h3><p>{c.explanation}</p></article>)}
 </section>;
}
