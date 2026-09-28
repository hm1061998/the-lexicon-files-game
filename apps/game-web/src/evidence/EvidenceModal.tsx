import { useEffect, useId, useRef } from 'react';
import { PaperPanel } from '@lexicon/ui';
import type { EvidenceDefinition, UiStrings } from '@lexicon/shared-types';
import { getFocusTrapTarget } from '../pause/focusTrap';
import './evidence.css';

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function EvidenceModal({
  evidence,
  strings,
  onClose,
}: {
  evidence: EvidenceDefinition;
  strings: UiStrings;
  onClose(): void;
}): JSX.Element {
  const headingId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    const first = dialog?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    first?.focus();

    function handleTab(event: KeyboardEvent): void {
      const currentDialog = dialogRef.current;
      if (!currentDialog || event.key !== 'Tab') return;
      const focusables = Array.from(
        currentDialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const target = getFocusTrapTarget(focusables, active, event.shiftKey);
      if (target) {
        event.preventDefault();
        target.focus();
      }
    }

    window.addEventListener('keydown', handleTab);
    return () => {
      window.removeEventListener('keydown', handleTab);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  return (
    <div className="evidence-overlay">
      <PaperPanel as="div" className="evidence-modal">
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={headingId}>
          <div className="evidence-modal-header">
            <h2 id={headingId}>{evidence.name}</h2>
            <button type="button" autoFocus aria-label={strings.close} onClick={onClose}>
              {strings.close}
            </button>
          </div>
          <p className="evidence-category">{strings.evidence}</p>
          <p>{evidence.description}</p>
        </div>
      </PaperPanel>
    </div>
  );
}
