import { DeskBackdrop, FolderCover, FolderTabs, type FolderTabItem } from '@lexicon/ui';
import type { UiStrings } from '@lexicon/shared-types';
import type { ReactNode } from 'react';
import './shell-cover.css';

/**
 * The pre-game page: a manila folder cover on the investigation desk. The title screen and its
 * sub-pages (settings, how to investigate) all sit inside the same cover.
 */
export function ShellCover({
  strings,
  caseTitle,
  title,
  tabs,
  tabsLabel,
  tagline = true,
  children,
}: {
  strings: UiStrings;
  /** The chosen case, shown on the cover label. */
  caseTitle?: string;
  /** Defaults to the game title (a level-one heading); any other title is a level-two heading. */
  title?: string;
  tabs?: readonly FolderTabItem[];
  tabsLabel?: string;
  tagline?: boolean;
  children?: ReactNode;
}): JSX.Element {
  return (
    <main className="title-screen">
      <DeskBackdrop>
        <FolderCover
          className="title-card"
          {...(caseTitle ? { label: caseTitle } : {})}
          title={title ?? strings.titleGame}
          headingLevel={title === undefined ? 1 : 2}
          {...(tagline ? { tagline: strings.titleTagline } : {})}
          tabs={
            tabs && tabs.length > 0 ? (
              <FolderTabs items={tabs} label={tabsLabel ?? strings.titleGame} />
            ) : null
          }
        >
          {children}
        </FolderCover>
      </DeskBackdrop>
    </main>
  );
}
