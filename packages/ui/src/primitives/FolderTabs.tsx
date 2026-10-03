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

/**
 * Index tabs sticking out of a folder cover (`folder`), down the edge of a notebook (`book`) or along the
 * top of a board (`board`); one button each, in reading order. `ariaCurrent="page"` is for tabs that
 * switch the page being read.
 */
export function FolderTabs({
  items,
  label,
  className,
  variant = 'folder',
  ariaCurrent = 'true',
}: {
  items: readonly FolderTabItem[];
  label: string;
  className?: string;
  variant?: 'folder' | 'book' | 'board';
  ariaCurrent?: 'page' | 'true';
}): JSX.Element {
  return (
    <nav
      className={['folder-tabs', `folder-tabs--${variant}`, className].filter(Boolean).join(' ')}
      aria-label={label}
    >
      {items.map((item) => (
        <InkButton
          key={item.id}
          className={['folder-tab', item.primary ? 'folder-tab--primary' : undefined]
            .filter(Boolean)
            .join(' ')}
          sfx="tab"
          disabled={item.disabled}
          autoFocus={item.autoFocus}
          aria-current={item.current ? ariaCurrent : undefined}
          onClick={item.onSelect}
        >
          {item.label}
        </InkButton>
      ))}
    </nav>
  );
}
