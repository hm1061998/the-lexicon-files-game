import { useId, useRef, useState } from 'react';
import { FolderTabs, InkButton, PaperButton } from '@lexicon/ui';
import type {
  CaseDefinition,
  GameState,
  LanguageProfile,
  TranslationMode,
  UiStrings,
} from '@lexicon/shared-types';
import type { NotebookTab } from '../state/gameStore';
import { BookFrame } from './BookFrame';
import { NotebookReaderPage } from './NotebookReaderPage';
import {
  createNotebookReadingState,
  selectNotebookReading,
  type NotebookReadingState,
} from './notebookReadingState';
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
  reading,
  onReadingChange,
  onPaperCue,
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
  reading?: NotebookReadingState;
  onReadingChange?: (s: NotebookReadingState) => void;
  onPaperCue?: () => void;
}): JSX.Element {
  const headingId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  useInvestigationDialogFocus(dialogRef);
  const view = selectInvestigationView(caseDefinition, caseState);
  const [localReading, setLocalReading] = useState(() =>
    createNotebookReadingState(caseDefinition.id),
  );
  const currentReading = selectNotebookReading(reading ?? localReading, caseDefinition.id);
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
      <section
        ref={dialogRef}
        className="notebook-dialog notebook-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
      >
        <BookFrame
          header={
            <header className="notebook-header">
              <h2 id={headingId}>
                <kbd aria-hidden="true">J</kbd> {strings.notebook}
              </h2>
              <div>
                <InkButton sfx="paper-close" aria-label={strings.close} onClick={onClose}>
                  {strings.close}
                </InkButton>
                <PaperButton onClick={onOpenDeduction}>{strings.openDeductionBoard}</PaperButton>
              </div>
            </header>
          }
          rightEdge={
            <FolderTabs
              variant="book"
              className="notebook-tabs"
              ariaCurrent="page"
              label={strings.notebook}
              items={TABS.map((id) => ({
                id,
                label: strings[id],
                current: activeTab === id,
                onSelect: () => onSelectTab(id),
              }))}
            />
          }
        >
          <div className="notebook-content">
            <NotebookReaderPage
              definition={caseDefinition}
              view={view}
              tab={activeTab}
              reading={currentReading}
              onReadingChange={onReadingChange ?? setLocalReading}
              learning={learning}
              profile={profile}
              onReviewEvidence={onReviewEvidence}
              onOpenDeduction={onOpenDeduction}
              onPaperCue={onPaperCue}
            />
          </div>
        </BookFrame>
      </section>
    </div>
  );
}
