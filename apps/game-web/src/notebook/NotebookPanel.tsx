import { useId,useRef } from 'react';
import { PaperPanel } from '@lexicon/ui';
import type { CaseDefinition,GameState,LanguageProfile,TranslationMode,UiStrings } from '@lexicon/shared-types';
import type { NotebookTab } from '../state/gameStore';
import { NotebookPeoplePanel } from './NotebookPeoplePanel';
import { NotebookEvidencePage } from './NotebookEvidencePage';
import { NotebookVocabularyPage } from './NotebookVocabularyPage';
import { NotebookTimelinePage } from './NotebookTimelinePage';
import { selectInvestigationView } from '../investigation/selectInvestigationView';
import { resolveInvestigationArtwork } from '../investigation/resolveInvestigationArtwork';
import { useInvestigationDialogFocus } from '../investigation/useInvestigationDialogFocus';
import './notebook.css';
const TABS:readonly NotebookTab[]=['people','evidence','vocabulary','timeline'];
const noop=()=>undefined;
export function NotebookPanel({caseDefinition,caseState,activeTab,strings,onSelectTab,onClose,onOpenDeduction,profile,translationMode='Learning',onRevealTranslation=noop,onEncounter=noop,onInspect=noop,onReviewEvidence=noop}:{
 caseDefinition:CaseDefinition;caseState:GameState;activeTab:NotebookTab;strings:UiStrings;
 onSelectTab(tab:NotebookTab):void;onClose():void;onOpenDeduction():void;
 profile?:LanguageProfile;translationMode?:TranslationMode;
 onRevealTranslation?(id:string,contextId:string):void;onEncounter?(id:string,contextId:string):void;onInspect?(id:string,contextId:string):void;onReviewEvidence?(id:string):void;
}):JSX.Element {
 const headingId=useId();const dialogRef=useRef<HTMLElement>(null);useInvestigationDialogFocus(dialogRef);
 const view=selectInvestigationView(caseDefinition,caseState);
 const artwork=Object.fromEntries(view.people.map(p=>[p.npc.id,resolveInvestigationArtwork(caseDefinition,p.npc.id)]));
 const learning={catalogue:caseDefinition.vocabulary,strings,translationMode,onEncounter,onInspect,onRevealTranslation};
 return <div className="notebook-overlay"><PaperPanel as="div" className="notebook-panel">
  <section ref={dialogRef} className="notebook-dialog" role="dialog" aria-modal="true" aria-labelledby={headingId}>
   <header className="notebook-header"><h2 id={headingId}><kbd>J</kbd> {strings.notebook}</h2>
    <div><button type="button" aria-label={strings.close} onClick={onClose}><span aria-hidden="true">×</span></button>
     <button type="button" onClick={onOpenDeduction}>{strings.openDeductionBoard}</button></div></header>
   <nav className="notebook-tabs" aria-label={strings.notebook}>{TABS.map(id=><button type="button" key={id} aria-current={activeTab===id?'page':undefined} aria-pressed={activeTab===id} onClick={()=>onSelectTab(id)}>{strings[id]}</button>)}</nav>
   <div className="notebook-content">
    {activeTab==='people'&&<NotebookPeoplePanel people={view.people} artworkByNpcId={artwork} {...learning}/>}
    {activeTab==='evidence'&&<NotebookEvidencePage evidence={view.evidence} people={view.people} onReviewEvidence={onReviewEvidence} {...learning}/>}
    {activeTab==='vocabulary'&&<NotebookVocabularyPage definition={caseDefinition} profile={profile} strings={strings} translationMode={translationMode} onRevealTranslation={onRevealTranslation}/>}
    {activeTab==='timeline'&&<NotebookTimelinePage events={view.placedEvents} strings={strings} onOpenDeduction={onOpenDeduction}/>}
   </div>
  </section></PaperPanel></div>;
}
