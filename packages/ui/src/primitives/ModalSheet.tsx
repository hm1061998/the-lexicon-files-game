import { useEffect, useId, useRef, type ReactNode, type Ref } from 'react';
import { PaperSheet } from './PaperSheet';
import './form-controls.css';
import './modal-sheet.css';

/**
 * A paper sheet used as a modal dialog on a dark scrim. Focus trapping stays with the screen
 * that uses it (it owns the keydown handling and the return focus).
 */
export function ModalSheet({
  heading,
  headingId,
  role = 'dialog',
  stamp,
  className,
  overlayClassName,
  dialogRef,
  backdrop,
  focusOnMount = false,
  tilt,
  children,
}: {
  heading?: ReactNode;
  headingId?: string;
  role?: 'dialog' | 'alertdialog';
  stamp?: ReactNode;
  className?: string;
  overlayClassName?: string;
  dialogRef?: Ref<HTMLDivElement>;
  /** Decorative scene behind the sheet (the evidence desk); it fills the scrim. */
  backdrop?: ReactNode;
  focusOnMount?: boolean;
  /** Degrees (-2..2). Off by default: a tilted sheet shifts focus rects past its scroll box. */
  tilt?: number;
  children?: ReactNode;
}): JSX.Element {
  const generatedId = useId();
  const labelId = headingId ?? generatedId;
  const innerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (focusOnMount) innerRef.current?.focus();
  }, [focusOnMount]);
  const setRef = (node: HTMLDivElement | null): void => {
    innerRef.current = node;
    if (typeof dialogRef === 'function') dialogRef(node);
    else if (dialogRef) (dialogRef as { current: HTMLDivElement | null }).current = node;
  };
  return (
    <div className={['modal-scrim', overlayClassName].filter(Boolean).join(' ')}>
      {backdrop}
      <PaperSheet
        as="div"
        {...(tilt === undefined ? {} : { tilt })}
        className={['modal-sheet', className].filter(Boolean).join(' ')}
      >
        <div
          ref={setRef}
          role={role}
          aria-modal="true"
          aria-labelledby={heading ? labelId : undefined}
          tabIndex={focusOnMount ? -1 : undefined}
        >
          {stamp}
          {heading ? (
            <h2 id={labelId} className="modal-sheet__heading">
              {heading}
            </h2>
          ) : null}
          {children}
        </div>
      </PaperSheet>
    </div>
  );
}
