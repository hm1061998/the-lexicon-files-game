import { describe, expect, it } from 'vitest';
import { loadCaseDefinition } from '@lexicon/game-content';
import { createGameStore } from '../state/gameStore';
import { handleNotebookShortcut } from './useNotebookShortcut';
import { handleEscapeShortcut } from '../pause/usePauseShortcut';

const body = { tagName: 'BODY' } as unknown as Element;
const input = { tagName: 'INPUT' } as unknown as Element;
const textarea = { tagName: 'TEXTAREA' } as unknown as Element;
const editable = { tagName: 'DIV', isContentEditable: true } as unknown as Element;

function key(key: string, target: Element | null = body) {
  return {
    key,
    target,
    prevented: false,
    preventDefault() {
      this.prevented = true;
    },
  };
}

describe('notebook and Escape keyboard routing', () => {
  it('J toggles the notebook outside typing targets', () => {
    const store = createGameStore({ caseDefinition: loadCaseDefinition('case-001') });
    const event = key('j');
    handleNotebookShortcut(store, event);
    expect(store.getState().notebookOpen).toBe(true);
    expect(store.getState().inputLocked).toBe(true);
    expect(event.prevented).toBe(true);
  });

  it.each([input, textarea, editable])('ignores J in typing targets', (target) => {
    const store = createGameStore({ caseDefinition: loadCaseDefinition('case-001') });
    handleNotebookShortcut(store, key('j', target));
    expect(store.getState().notebookOpen).toBe(false);
  });

  it('Escape closes evidence then notebook before pausing', () => {
    const store = createGameStore({ caseDefinition: loadCaseDefinition('case-001') });
    store.getState().openEvidence('meeting_minutes');
    handleEscapeShortcut(store, key('Escape'));
    expect(store.getState().activeEvidenceId).toBeNull();
    expect(store.getState().paused).toBe(false);
    store.getState().toggleNotebook();
    handleEscapeShortcut(store, key('Escape'));
    expect(store.getState().notebookOpen).toBe(false);
    expect(store.getState().paused).toBe(false);
    handleEscapeShortcut(store, key('Escape'));
    expect(store.getState().paused).toBe(true);
  });

  it('Escape does nothing while typing and closing the final overlay unlocks input', () => {
    const store = createGameStore({ caseDefinition: loadCaseDefinition('case-001') });
    store.getState().toggleNotebook();
    handleEscapeShortcut(store, key('Escape', input));
    expect(store.getState().notebookOpen).toBe(true);
    handleEscapeShortcut(store, key('Escape'));
    expect(store.getState().inputLocked).toBe(false);
  });

  it('briefing swallows J and Escape closes it without pausing', () => {
    const store = createGameStore({
      caseDefinition: loadCaseDefinition('case-001'),
      initialBriefingOpen: true,
    });
    handleNotebookShortcut(store, key('j'));
    expect(store.getState().notebookOpen).toBe(false);
    const event = key('Escape');
    handleEscapeShortcut(store, event);
    expect(event.prevented).toBe(true);
    expect(store.getState()).toMatchObject({
      briefingOpen: false,
      paused: false,
      inputLocked: false,
    });
  });
});
