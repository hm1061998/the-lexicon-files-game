import { useState } from 'react';
import type { EvidenceDefinition } from '@lexicon/shared-types';
import type { NotebookPerson } from './selectNotebookPeople';
import type { InvestigationLearningProps } from '../investigation/RecordedStatements';
import { InvestigationArtwork } from '../investigation/InvestigationArtwork';
import { VocabularyText } from '../vocabulary/VocabularyText';
export function NotebookEvidencePage({evidence,people,onReviewEvidence,...learning}:{evidence:readonly EvidenceDefinition[];people:readonly NotebookPerson[];onReviewEvidence(id:string):void}&InvestigationLearningProps):JSX.Element {
  const [selectedId,setSelectedId]=useState<string>();
  const selected=evidence.find(e=>e.id===selectedId)??evidence[0];const {strings}=learning;
  if(!selected)return <p className="notebook-empty">{strings.evidenceEmpty}</p>;
  const related=people.filter(p=>selected.relatedNpcIds?.includes(p.npc.id));
  return <div className="notebook-spread"><section className="notebook-index" aria-label={strings.notebookEvidenceHeading}>
    <h3>{strings.notebookEvidenceHeading}</h3><ul className="notebook-evidence-grid">{evidence.map(item=><li key={item.id}>
      <button type="button" aria-label={item.name} aria-pressed={item.id===selected.id} onClick={()=>setSelectedId(item.id)}>
        <InvestigationArtwork url={item.image} name={item.name}/><span>{item.name}</span></button></li>)}</ul>
    </section><article className="notebook-detail notebook-evidence-detail" aria-label={selected.name}>
      <h3>{selected.name}</h3><InvestigationArtwork url={selected.image} name={selected.name}/>
      <p><VocabularyText key={selected.id} text={selected.description} translationVi={selected.descriptionVi} spans={selected.vocabularySpans}
        contextId={`evidence:${selected.id}:description`} mode={learning.translationMode} {...learning}/></p>
      {related.length>0 && <section><h4>{strings.notebookRelatedPeople}</h4><ul className="notebook-source-chips">{related.map(p=><li key={p.npc.id}>{p.npc.name}</li>)}</ul></section>}
      <button type="button" className="notebook-review-action" aria-label={`${strings.evidenceReview}: ${selected.name}`} onClick={()=>onReviewEvidence(selected.id)}>{strings.evidenceReview}</button>
    </article></div>;
}
