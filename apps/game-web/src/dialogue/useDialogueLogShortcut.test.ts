import { describe, expect, it } from 'vitest';
import { loadCaseDefinition } from '@lexicon/game-content';
import { createGameStore } from '../state/gameStore';
import { handleDialogueLogShortcut } from './useDialogueLogShortcut';

const event = (key: string, target: unknown = null) => ({
  key,
  target: target as Element | null,
  preventDefault() {},
});
const store = () => createGameStore({ caseDefinition: loadCaseDefinition('case-001') });

describe('handleDialogueLogShortcut', () => {
  it('toggles the log on L', () => {
    const s = store();
    handleDialogueLogShortcut(s, event('l'));
    expect(s.getState().dialogueLogOpen).toBe(true);
    handleDialogueLogShortcut(s, event('l'));
    expect(s.getState().dialogueLogOpen).toBe(false);
  });

  it('ignores other keys and typing targets', () => {
    const s = store();
    handleDialogueLogShortcut(s, event('k'));
    handleDialogueLogShortcut(s, event('l', { tagName: 'INPUT', closest: () => null }));
    expect(s.getState().dialogueLogOpen).toBe(false);
  });

  it('does nothing while a modal that cannot share the screen is open', () => {
    const s = store();
    s.getState().openNotebook();
    handleDialogueLogShortcut(s, event('l'));
    expect(s.getState().dialogueLogOpen).toBe(false);
  });
});
