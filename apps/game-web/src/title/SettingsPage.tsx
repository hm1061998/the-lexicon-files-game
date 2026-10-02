import type { UiStrings } from '@lexicon/shared-types';
import { SettingsFields } from '../pause/SettingsFields';
import { ShellCover } from './ShellCover';

/** Settings as a page inside the folder cover; the Back tab returns to the title. */
export function SettingsPage({
  strings,
  caseTitle,
  onBack,
}: {
  strings: UiStrings;
  caseTitle: string;
  onBack: () => void;
}): JSX.Element {
  return (
    <ShellCover
      strings={strings}
      caseTitle={caseTitle}
      title={strings.titleSettings}
      tagline={false}
      tabsLabel={strings.titleSettings}
      tabs={[
        { id: 'back', label: strings.titleBack, onSelect: onBack, primary: true, autoFocus: true },
      ]}
    >
      <SettingsFields strings={strings} />
    </ShellCover>
  );
}
