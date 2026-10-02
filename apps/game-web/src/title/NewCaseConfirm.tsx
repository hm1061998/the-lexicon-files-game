import { DeskBackdrop, InkButton, ModalSheet } from '@lexicon/ui';
import type { UiStrings } from '@lexicon/shared-types';
import './shell-cover.css';

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
      <DeskBackdrop />
      <ModalSheet
        role="alertdialog"
        heading={strings.newCaseConfirmTitle}
        className="new-case-confirm"
      >
        <p>{strings.newCaseConfirmBody}</p>
        <div className="shell-actions">
          <InkButton className="shell-button" autoFocus onClick={onCancel}>
            {strings.cancel}
          </InkButton>
          <InkButton className="shell-button" onClick={onAccept}>
            {strings.newCaseConfirmAccept}
          </InkButton>
        </div>
      </ModalSheet>
    </main>
  );
}
