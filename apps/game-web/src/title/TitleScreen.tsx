import type { FolderTabItem } from '@lexicon/ui';
import type { UiStrings } from '@lexicon/shared-types';
import type { TitleActions } from './titleModel';
import { ShellCover } from './ShellCover';

export function TitleScreen({
  strings,
  caseTitle,
  actions,
  onContinue,
  onNewCase,
  onHowTo,
  onSettings,
  onChangeCase,
}: {
  strings: UiStrings;
  caseTitle: string;
  actions: TitleActions;
  onContinue: () => void;
  onNewCase: () => void;
  onHowTo: () => void;
  onSettings: () => void;
  onChangeCase?: () => void;
}): JSX.Element {
  const tabs: FolderTabItem[] = [
    ...(actions.continue
      ? [
          {
            id: 'continue',
            label: strings.titleContinue,
            onSelect: onContinue,
            primary: actions.primary === 'continue',
            autoFocus: actions.primary === 'continue',
          },
        ]
      : []),
    {
      id: 'new-case',
      label: strings.titleNewCase,
      onSelect: onNewCase,
      primary: actions.primary === 'newCase',
      autoFocus: actions.primary === 'newCase',
    },
    { id: 'how-to', label: strings.titleHowTo, onSelect: onHowTo },
    { id: 'settings', label: strings.titleSettings, onSelect: onSettings },
    ...(onChangeCase
      ? [{ id: 'change-case', label: strings.titleChangeCase, onSelect: onChangeCase }]
      : []),
  ];
  return <ShellCover strings={strings} caseTitle={caseTitle} tabs={tabs} />;
}
