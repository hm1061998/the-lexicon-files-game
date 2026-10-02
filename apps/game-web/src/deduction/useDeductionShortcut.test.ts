import { describe, it, expect } from 'vitest';
import { loadCaseDefinition } from '@lexicon/game-content';
import { createGameStore } from '../state/gameStore';
import { handleDeductionShortcut } from './useDeductionShortcut';
import { handleNotebookShortcut } from '../notebook/useNotebookShortcut';
import { handleEscapeShortcut } from '../pause/usePauseShortcut';
const body = { tagName: 'BODY' } as Element;
function key(key: string, target: Element = body) {
  return {
    key,
    target,
    prevented: false,
    preventDefault() {
      this.prevented = true;
    },
  };
}
describe('deduction keyboard routing', () => {
  it('B opens, J switches and Escape closes without pausing', () => {
    const store = createGameStore({ caseDefinition: loadCaseDefinition('case-001') });
    const event = key('b');
    handleDeductionShortcut(store, event);
    expect(event.prevented).toBe(true);
    expect(store.getState().deductionOpen).toBe(true);
    handleNotebookShortcut(store, key('j'));
    expect(store.getState()).toMatchObject({ notebookOpen: true, deductionOpen: false });
    handleDeductionShortcut(store, key('b'));
    handleEscapeShortcut(store, key('Escape'));
    expect(store.getState()).toMatchObject({
      deductionOpen: false,
      paused: false,
      inputLocked: false,
    });
  });
  it.each([
    { tagName: 'INPUT' },
    { tagName: 'TEXTAREA' },
    { tagName: 'DIV', isContentEditable: true },
  ])('ignores typing targets', (target) => {
    const store = createGameStore({ caseDefinition: loadCaseDefinition('case-001') });
    handleDeductionShortcut(store, key('b', target as Element));
    expect(store.getState().deductionOpen).toBe(false);
  });
  it.each(['ctrlKey', 'metaKey', 'altKey'])('preserves %s browser shortcuts', (modifier) => {
    const store = createGameStore({ caseDefinition: loadCaseDefinition('case-001') });
    handleDeductionShortcut(store, { ...key('b'), [modifier]: true });
    expect(store.getState().deductionOpen).toBe(false);
  });
});
