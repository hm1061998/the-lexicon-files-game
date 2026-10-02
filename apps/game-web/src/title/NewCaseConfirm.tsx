import { PaperPanel } from '@lexicon/ui';
import type { UiStrings } from '@lexicon/shared-types';
import './title.css';

export function NewCaseConfirm({
  strings,
  onAccept,
  onCancel,
}: {
  strings: UiStrings;
  onAccept: () => void;
  onCancel: () => void;
}): JSX.Element {
  return (
    <main className="title-screen">
      <PaperPanel as="div" className="title-card">
        <div role="alertdialog" aria-modal="true" aria-label={strings.newCaseConfirmTitle}>
          <h2>{strings.newCaseConfirmTitle}</h2>
          <p>{strings.newCaseConfirmBody}</p>
          <div className="title-actions">
            <button type="button" autoFocus onClick={onCancel}>
              {strings.cancel}
            </button>
            <button type="button" onClick={onAccept}>
              {strings.newCaseConfirmAccept}
            </button>
          </div>
        </div>
      </PaperPanel>
    </main>
  );
}
