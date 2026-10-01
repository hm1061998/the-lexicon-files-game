import { useRef, useState } from 'react';
import type { CaseDefinition,GameState,UiStrings,TimelinePlacementResult,ContradictionResult,AccusationResult,TranslationMode } from '@lexicon/shared-types';
import {selectInvestigationView} from '../investigation/selectInvestigationView';
import {resolveInvestigationArtwork} from '../investigation/resolveInvestigationArtwork';
import {InvestigationArtwork} from '../investigation/InvestigationArtwork';
import {RecordedStatements,type InvestigationLearningProps} from '../investigation/RecordedStatements';
import {useInvestigationDialogFocus} from '../investigation/useInvestigationDialogFocus';
import {VocabularyText} from '../vocabulary/VocabularyText';
import {AccusationPanel} from '../conclusion/AccusationPanel';
import {TimelineWorkspace} from './TimelineWorkspace';
import {ContradictionWorkspace} from './ContradictionWorkspace';
import {DeductionConnections} from './DeductionConnections';
import './deduction.css';
export interface DeductionBoardProps {
 caseDefinition:CaseDefinition;caseState:GameState;strings:UiStrings;onClose:()=>void;onOpenNotebook:()=>void;
 onPlaceTimelineEvent:(eventId:string,slotId:string)=>TimelinePlacementResult;
 onSubmitContradiction:(id:string,factIds:readonly string[])=>ContradictionResult;
 onSubmitAccusation:(id:string)=>AccusationResult;onReviewEvidence?:(id:string)=>void;
 translationMode?:TranslationMode;onEncounter?:InvestigationLearningProps['onEncounter'];onInspect?:InvestigationLearningProps['onInspect'];onRevealTranslation?:InvestigationLearningProps['onRevealTranslation'];
}
export function DeductionBoard({caseDefinition,caseState,strings,onClose,onOpenNotebook,onPlaceTimelineEvent,onSubmitContradiction,onSubmitAccusation,onReviewEvidence,translationMode='Learning',onEncounter=()=>{},onInspect=()=>{},onRevealTranslation=()=>{}}:DeductionBoardProps){
 const dialog=useRef<HTMLDivElement>(null);const surface=useRef<HTMLDivElement>(null);useInvestigationDialogFocus(dialog);
 const view=selectInvestigationView(caseDefinition,caseState);const [selected,setSelected]=useState<string|null>(null);
 const person=view.people.find(p=>`person:${p.npc.id}`===selected);const evidence=view.evidence.find(e=>`evidence:${e.id}`===selected);
 const learning={catalogue:caseDefinition.vocabulary,strings,translationMode,onEncounter,onInspect,onRevealTranslation};
 const names=new Map<string,string>([...view.people.map(p=>[`person:${p.npc.id}`,p.npc.name] as const),...view.evidence.map(e=>[`evidence:${e.id}`,e.name] as const),...view.facts.map(f=>[`fact:${f.id}`,f.text] as const)]);
 return <div className="deduction-overlay"><div className="deduction-board" ref={dialog} role="dialog" aria-modal="true" aria-label={strings.deductionBoard}>
 <header className="deduction-header"><h2>{strings.deductionBoard}</h2><div><button type="button" aria-label={strings.close} onClick={onClose}>×</button><button type="button" onClick={onOpenNotebook}>{strings.openNotebookFromBoard}</button></div></header>
 <div className="deduction-surface" ref={surface}><DeductionConnections relationships={view.relationships} surface={surface}/>
 <aside className="deduction-case"><h3>{strings.caseFile}</h3><h4>{strings.objectiveHeading}</h4>{caseDefinition.objectives.filter(o=>caseState.objectiveStatuses[o.id]==='active').map(o=><p key={o.id}>{o.text}</p>)}<p>{strings.deductionInstructions}</p></aside>
 <main className="deduction-clues"><h3>{strings.people}</h3><div className="deduction-card-grid">{view.people.map(p=><button type="button" className="deduction-card" data-board-node={`person:${p.npc.id}`} key={p.npc.id} aria-label={p.npc.name} aria-pressed={selected===`person:${p.npc.id}`} onClick={()=>setSelected(`person:${p.npc.id}`)}><InvestigationArtwork url={resolveInvestigationArtwork(caseDefinition,p.npc.id)} name={p.npc.name} portrait/><strong>{p.npc.name}</strong><small>{p.npc.role}</small></button>)}</div>
 <h3>{strings.deductionCluesHeading}</h3><div className="deduction-card-grid">{view.evidence.map(e=><button type="button" className="deduction-card" key={e.id} data-board-node={`evidence:${e.id}`} aria-label={e.name} aria-pressed={selected===`evidence:${e.id}`} onClick={()=>setSelected(`evidence:${e.id}`)}><InvestigationArtwork url={e.image} name={e.name}/><strong>{e.name}</strong></button>)}</div>
 {person&&<article className="deduction-detail"><h3>{person.npc.name}</h3><RecordedStatements key={person.npc.id} person={person} {...learning}/></article>}
 {evidence&&<article className="deduction-detail"><h3>{evidence.name}</h3><VocabularyText key={evidence.id} text={evidence.description} translationVi={evidence.descriptionVi} spans={evidence.vocabularySpans} contextId={`evidence:${evidence.id}:description`} mode={translationMode} {...learning}/>{onReviewEvidence&&<button type="button" onClick={()=>onReviewEvidence(evidence.id)}>{strings.evidenceReview}: {evidence.name}</button>}</article>}
 <TimelineWorkspace definition={caseDefinition} view={view} strings={strings} onPlace={onPlaceTimelineEvent}/>
 <details className="deduction-relations"><summary>{strings.deductionRelationships}</summary><ul>{view.relationships.map(r=><li key={`${r.from}:${r.to}`}>{names.get(r.from)} → {names.get(r.to)}</li>)}</ul></details>
 </main>
 <aside className="deduction-reasoning"><ContradictionWorkspace view={view} strings={strings} onSubmit={onSubmitContradiction}/><section><h3>{strings.conclusion}</h3>{view.conclusionAvailable?<AccusationPanel suspects={view.suspects} strings={strings} onSubmit={onSubmitAccusation}/>:<p>{strings.conclusionUnavailable}</p>}</section></aside>
 </div></div></div>;
}
