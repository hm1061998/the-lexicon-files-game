import type { ButtonHTMLAttributes } from 'react';
import './ink-button.css';

export function InkButton({
  className,
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>): JSX.Element {
  return (
    <button type={type} className={['ink-button', className].filter(Boolean).join(' ')} {...rest} />
  );
}
