import {useEffect,useReducer,useRef} from 'react';import type {CaseDefinition,GameState,UiStrings,TimelinePlacementResult,ContradictionResult,AccusationResult,TranslationMode} from '@lexicon/shared-types';import type {InvestigationLearningProps} from '../investigation/RecordedStatements';import {selectInvestigationView} from '../investigation/selectInvestigationView';import {useInvestigationDialogFocus} from '../investigation/useInvestigationDialogFocus';import {initialDeductionUi,deductionUiReducer,type DeductionFace} from './deductionUiReducer';import {DeductionCluesFace} from './DeductionCluesFace';import {TimelineWorkspace} from './TimelineWorkspace';import {ContradictionWorkspace} from './ContradictionWorkspace';import {AccusationPanel} from '../conclusion/AccusationPanel';import {ReadDocument,textBlock} from '../investigation/pagination/ReadDocument';import './deduction.css';
export interface DeductionBoardProps {
  caseDefinition: CaseDefinition;
  caseState: GameState;
  strings: UiStrings;
  onClose: () => void;
  onOpenNotebook: () => void;
  onPlaceTimelineEvent: (eventId: string, slotId: string) => TimelinePlacementResult;
  onSubmitContradiction: (id: string, factIds: readonly string[]) => ContradictionResult;
  onSubmitAccusation: (id: string) => AccusationResult;
  onReviewEvidence?: (id: string) => void;
  initialFace?: DeductionFace;
  translationMode?: TranslationMode;
  onEncounter?: InvestigationLearningProps['onEncounter'];
  onInspect?: InvestigationLearningProps['onInspect'];
  onRevealTranslation?: InvestigationLearningProps['onRevealTranslation'];
}

export function DeductionBoard({caseDefinition,caseState,strings,onClose,onOpenNotebook,onPlaceTimelineEvent,onSubmitContradiction,onSubmitAccusation,onReviewEvidence,translationMode='Learning',onEncounter=()=>{},onInspect=()=>{},onRevealTranslation=()=>{},initialFace='clues'}:DeductionBoardProps){
 const dialog=useRef<HTMLDivElement>(null);useInvestigationDialogFocus(dialog);const view=selectInvestigationView(caseDefinition,caseState);const [ui,dispatch]=useReducer(deductionUiReducer,null,()=>({...initialDeductionUi(),face:initialFace}));
 const valid=JSON.stringify({facts:view.facts.map(f=>f.id),events:view.availableEvents.map(e=>e.id),slots:caseDefinition.timeline.slots.map(s=>s.id),suspects:view.conclusionAvailable?view.suspects.map(s=>s.id):[],nodes:['case','relations',...view.people.map(p=>'person:'+p.npc.id),...view.evidence.map(e=>'evidence:'+e.id)]});
 useEffect(()=>{dispatch({type:'reconcile',...JSON.parse(valid)});},[valid]);
 const learning={catalogue:caseDefinition.vocabulary,strings,translationMode,onEncounter,onInspect,onRevealTranslation};
 const faces:readonly [DeductionFace,string][]=[['clues',strings.deductionCluesFace],['timeline',strings.deductionTimelineFace],['compare',strings.deductionCompareFace],['conclusion',strings.deductionConclusionFace]];
 return <div className="deduction-overlay"><div className="deduction-board" ref={dialog} role="dialog" aria-modal="true" aria-label={strings.deductionBoard}><header className="deduction-header"><h2>{strings.deductionBoard}</h2><div><button type="button" aria-label={strings.close} onClick={onClose}>×</button><button type="button" onClick={onOpenNotebook}>{strings.openNotebookFromBoard}</button></div></header><nav className="deduction-face-tabs" aria-label={strings.deductionBoard}>{faces.map(([id,label])=><button type="button" key={id} aria-pressed={ui.face===id} onClick={()=>dispatch({type:'selectFace',face:id})}>{label}</button>)}</nav>
 <div className="deduction-surface fixed-surface"><div className="deduction-face" key={ui.face}>
 {ui.face==='clues'?<DeductionCluesFace definition={caseDefinition} state={caseState} view={view} ui={ui} dispatch={dispatch} learning={learning} onReviewEvidence={onReviewEvidence}/>:ui.face==='timeline'?<TimelineWorkspace definition={caseDefinition} view={view} ui={ui} dispatch={dispatch} learning={learning} onPlace={onPlaceTimelineEvent}/>:ui.face==='compare'?<ContradictionWorkspace view={view} ui={ui} dispatch={dispatch} learning={learning} onSubmit={onSubmitContradiction}/>:view.conclusionAvailable?<AccusationPanel suspects={view.suspects} strings={strings} onSubmit={onSubmitAccusation} learning={learning} selection={ui.suspectId} onSelectionChange={id=>dispatch({type:'selectSuspect',id})} feedback={ui.feedback} onFeedbackChange={text=>dispatch({type:'setFeedback',text})}/>:<ReadDocument blocks={[textBlock('conclusion:unavailable',strings.conclusionUnavailable)]} learning={learning} label={strings.conclusion}/>}
 </div></div></div></div>;
}
