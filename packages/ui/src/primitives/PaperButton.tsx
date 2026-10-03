import type { ButtonHTMLAttributes } from 'react';
import type { SfxId } from './sfx';
import './paper-button.css';
import './cursors.css';

/** The primary button: a scrap of paper with a soft shadow that presses 2px (new case, continue, confirm). */
export function PaperButton({
  className,
  type = 'button',
  sfx = 'press',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { sfx?: SfxId }): JSX.Element {
  return (
    <button
      type={type}
      className={['paper-button', className].filter(Boolean).join(' ')}
      data-sfx={sfx}
      {...rest}
    />
  );
}
