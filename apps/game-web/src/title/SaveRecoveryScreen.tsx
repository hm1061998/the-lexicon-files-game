import { DeskBackdrop, InkButton, PaperSheet } from '@lexicon/ui';
import type { UiStrings } from '@lexicon/shared-types';
import './shell-cover.css';

/** A save that cannot be read: an aged note on the desk with the reason and two safe choices. */
export function SaveRecoveryScreen({
  strings,
  reason,
  onConfirm,
  onCancel,
}: {
  strings: UiStrings;
  reason: string;
  onConfirm: () => void;
  onCancel: () => void;
}): JSX.Element {
  return (
    <main role="alert" className="save-recovery-screen">
      <DeskBackdrop>
        <PaperSheet tone="aged" tilt={-0.8} tape="tr" className="save-recovery-note">
          <h1>{strings.saveRecoveryTitle}</h1>
          <p>{strings.saveRecoveryBody}</p>
          <p className="save-recovery-reason">{reason}</p>
          <div className="shell-actions">
            <InkButton className="shell-button" autoFocus onClick={onConfirm}>
              {strings.createFreshSave}
            </InkButton>
            <InkButton className="shell-button" onClick={onCancel}>
              {strings.cancel}
            </InkButton>
          </div>
        </PaperSheet>
      </DeskBackdrop>
    </main>
  );
}
