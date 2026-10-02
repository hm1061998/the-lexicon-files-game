import { useId, useRef, useState } from 'react';
import { PaperPanel } from '@lexicon/ui';
import type {
  CaseDefinition,
  GameState,
  LanguageProfile,
  TranslationMode,
  UiStrings,
} from '@lexicon/shared-types';
import type { NotebookTab } from '../state/gameStore';
import { NotebookReaderPage } from './NotebookReaderPage';
import {createNotebookReadingState,selectNotebookReading,type NotebookReadingState} from './notebookReadingState';
import {InvestigationDecoration} from '../investigation/art/InvestigationDecoration';
import { selectInvestigationView } from '../investigation/selectInvestigationView';
import { useInvestigationDialogFocus } from '../investigation/useInvestigationDialogFocus';
import './notebook.css';
const TABS: readonly NotebookTab[] = ['people', 'evidence', 'vocabulary', 'timeline'];
const noop = () => undefined;
export function NotebookPanel({
  caseDefinition,
  caseState,
  activeTab,
  strings,
  onSelectTab,
  onClose,
  onOpenDeduction,
  profile,
  translationMode = 'Learning',
  onRevealTranslation = noop,
  onEncounter = noop,
  onInspect = noop,
  onReviewEvidence = noop,
  reading, onReadingChange, onPaperCue,
}: {
  caseDefinition: CaseDefinition;
  caseState: GameState;
  activeTab: NotebookTab;
  strings: UiStrings;
  onSelectTab(tab: NotebookTab): void;
  onClose(): void;
  onOpenDeduction(): void;
  profile?: LanguageProfile;
  translationMode?: TranslationMode;
  onRevealTranslation?(id: string, contextId: string): void;
  onEncounter?(id: string, contextId: string): void;
  onInspect?(id: string, contextId: string): void;
  onReviewEvidence?(id: string): void;
  reading?:NotebookReadingState;onReadingChange?:(s:NotebookReadingState)=>void;onPaperCue?:()=>void;
}): JSX.Element {
  const headingId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  useInvestigationDialogFocus(dialogRef);
  const view = selectInvestigationView(caseDefinition, caseState);
  const [localReading,setLocalReading]=useState(()=>createNotebookReadingState(caseDefinition.id));
  const currentReading=selectNotebookReading(reading??localReading,caseDefinition.id);
  const learning = {
    catalogue: caseDefinition.vocabulary,
    strings,
    translationMode,
    onEncounter,
    onInspect,
    onRevealTranslation,
  };
  return (
    <div className="notebook-overlay">
      <PaperPanel as="div" className="notebook-panel">
{["","corner-tr","corner-bl","corner-br"].map(c=><InvestigationDecoration kind="corner" className={c} key={c}/>)}
        <section
          ref={dialogRef}
          className="notebook-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
        >
          <header className="notebook-header">
            <h2 id={headingId}>
              <kbd aria-hidden="true">J</kbd> {strings.notebook}
            </h2>
            <div>
              <button type="button" aria-label={strings.close} onClick={onClose}>
                <span aria-hidden="true">×</span>
              </button>
              <button type="button" onClick={onOpenDeduction}>
                {strings.openDeductionBoard}
              </button>
            </div>
          </header>
          <nav className="notebook-tabs" aria-label={strings.notebook}>
            {TABS.map((id) => (
              <button
                type="button"
                key={id}
                aria-current={activeTab === id ? 'page' : undefined}
                aria-pressed={activeTab === id}
                onClick={() => onSelectTab(id)}
              >
                {strings[id]}
              </button>
            ))}
          </nav>
          <div className="notebook-content">
            <NotebookReaderPage definition={caseDefinition} view={view} tab={activeTab} reading={currentReading} onReadingChange={onReadingChange??setLocalReading} learning={learning} profile={profile} onReviewEvidence={onReviewEvidence} onOpenDeduction={onOpenDeduction} onPaperCue={onPaperCue}/>

          </div>
        </section>
      </PaperPanel>
    </div>
  );
}
