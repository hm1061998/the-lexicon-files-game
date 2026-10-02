import type { SettingsLoadResult } from '../persistence/settingsRepository';

export type SaveAvailability = 'loaded' | 'missing' | 'memory-only';

export type TitleActions = {
  continue: boolean;
  newCase: boolean;
  howTo: true;
  settings: true;
  primary: 'continue' | 'newCase';
  askSupportLevel: boolean;
};

export function selectTitleActions(input: {
  save: SaveAvailability;
  settingsStatus: SettingsLoadResult['status'];
}): TitleActions {
  const canContinue = input.save === 'loaded';
  return {
    continue: canContinue,
    newCase: true,
    howTo: true,
    settings: true,
    primary: canContinue ? 'continue' : 'newCase',
    askSupportLevel: input.settingsStatus === 'missing',
  };
}

export type TitleStage = 'title' | 'support' | 'confirm' | 'settings' | 'howto' | 'playing';
export type TitleEvent =
  'continue' | 'newCase' | 'howTo' | 'settings' | 'back' | 'supportChosen' | 'confirmed';

/**
 * Pure transitions of the pre-game flow. `newCase` is routed by the caller's actions:
 * an existing save asks for confirmation first, then (maybe) the support level.
 */
export function nextTitleStage(
  stage: TitleStage,
  event: TitleEvent,
  context: { hasSave: boolean; askSupportLevel: boolean },
): TitleStage {
  const afterConfirm = context.askSupportLevel ? 'support' : 'playing';
  switch (stage) {
    case 'title':
      if (event === 'continue') return 'playing';
      if (event === 'howTo') return 'howto';
      if (event === 'settings') return 'settings';
      if (event === 'newCase') return context.hasSave ? 'confirm' : afterConfirm;
      return stage;
    case 'confirm':
      if (event === 'confirmed') return afterConfirm;
      if (event === 'back') return 'title';
      return stage;
    case 'support':
      return event === 'supportChosen' ? 'playing' : stage;
    case 'settings':
    case 'howto':
      return event === 'back' ? 'title' : stage;
    case 'playing':
      return stage;
  }
}
