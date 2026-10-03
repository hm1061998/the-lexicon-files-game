import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { SfxId } from './sfx';
import './device-key.css';
import './cursors.css';

/** A raised key on a device (the recorder): icon above a label, presses 4px. */
export function DeviceKey({
  className,
  type = 'button',
  sfx = 'device-click',
  icon,
  label,
  pressed,
  children,
  ...rest
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-pressed'> & {
  icon: ReactNode;
  label: string;
  pressed?: boolean;
  sfx?: SfxId;
}): JSX.Element {
  return (
    <button
      type={type}
      className={['device-key', className].filter(Boolean).join(' ')}
      data-sfx={sfx}
      {...(pressed === undefined ? {} : { 'aria-pressed': pressed })}
      {...rest}
    >
      <span className="device-key__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="device-key__label">{label}</span>
      {children}
    </button>
  );
}
