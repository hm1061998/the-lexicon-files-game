import { useEffect, type RefObject } from 'react';
import { getFocusTrapTarget } from '../pause/focusTrap';
export function useInvestigationDialogFocus(ref: RefObject<HTMLElement>): void {
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const fallback = dialog
      .closest('.game-root')
      ?.querySelector<HTMLElement>(':scope > [tabindex="-1"]');
    const focusables = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button, summary, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter(
        (el) =>
          !el.matches(':disabled') &&
          el.tabIndex >= 0 &&
          el.getClientRects().length > 0 &&
          // Measurement copies are inert and invisible: never a tab stop.
          !el.closest('[inert], .page-measurement'),
      );
    focusables()[0]?.focus();
    const handle = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const target = getFocusTrapTarget(focusables(), active, event.shiftKey);
      if (target) {
        event.preventDefault();
        target.focus();
      }
    };
    dialog.addEventListener('keydown', handle);
    return () => {
      dialog.removeEventListener('keydown', handle);
      if (previous?.isConnected && previous !== document.body) previous.focus();
      else if (fallback?.isConnected) fallback.focus();
    };
  }, [ref]);
}
