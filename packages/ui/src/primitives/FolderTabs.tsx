import { InkButton } from './InkButton';
import './folder-tabs.css';

export type FolderTabItem = {
  id: string;
  label: string;
  onSelect: () => void;
  primary?: boolean;
  disabled?: boolean;
  current?: boolean;
  autoFocus?: boolean;
};

/** Index tabs sticking out of a folder cover; one button each, in reading order. */
export function FolderTabs({
  items,
  label,
  className,
}: {
  items: readonly FolderTabItem[];
  label: string;
  className?: string;
}): JSX.Element {
  return (
    <nav className={['folder-tabs', className].filter(Boolean).join(' ')} aria-label={label}>
      {items.map((item) => (
        <InkButton
          key={item.id}
          className={['folder-tab', item.primary ? 'folder-tab--primary' : undefined]
            .filter(Boolean)
            .join(' ')}
          disabled={item.disabled}
          autoFocus={item.autoFocus}
          aria-current={item.current ? 'true' : undefined}
          onClick={item.onSelect}
        >
          {item.label}
        </InkButton>
      ))}
    </nav>
  );
}
