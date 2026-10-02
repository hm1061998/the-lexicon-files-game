import { Keycap } from './Keycap';
import { InkButton } from './InkButton';
import './key-hint-line.css';

export type KeyHintItem = {
  key: string;
  label: string;
  onActivate?: () => void;
  disabled?: boolean;
  dimmed?: boolean;
  className?: string;
};

/** One thin line of key hints. Compact mode drops the labels (kept as `aria-label`). */
export function KeyHintLine({
  className,
  compact = false,
  items,
}: {
  className?: string;
  compact?: boolean;
  items: readonly KeyHintItem[];
}): JSX.Element {
  const classes = ['key-hint-line', compact ? 'key-hint-line--compact' : undefined, className]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={classes}>
      {items.map((item) => {
        const itemClasses = [
          'key-hint',
          item.dimmed ? 'key-hint--dimmed' : undefined,
          item.className,
        ]
          .filter(Boolean)
          .join(' ');
        if (item.onActivate) {
          return (
            <InkButton
              key={item.key}
              className={itemClasses}
              disabled={item.disabled}
              onClick={item.onActivate}
              {...(compact ? { 'aria-label': item.label } : {})}
            >
              <Keycap>{item.key}</Keycap>
              {compact ? null : <span className="key-hint__label">{item.label}</span>}
            </InkButton>
          );
        }
        return (
          <span key={item.key} className={itemClasses} aria-disabled={item.disabled || undefined}>
            <Keycap>{item.key}</Keycap>
            <span className={compact ? 'visually-hidden' : 'key-hint__label'}>{item.label}</span>
          </span>
        );
      })}
    </div>
  );
}
