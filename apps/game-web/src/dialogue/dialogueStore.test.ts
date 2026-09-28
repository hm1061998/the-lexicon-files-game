import { describe, expect, it } from 'vitest';
import { loadCaseDefinition } from '@lexicon/game-content';
import type { DialogueAction, GameEventMap } from '@lexicon/shared-types';
import { createGameStore } from '../state/gameStore';
import { createEventBus } from '../bridge/eventBus';
import { connectCaseEngine } from '../bridge/connectCaseEngine';
import { connectAutosave } from '../persistence/connectAutosave';
import { handleEscapeShortcut } from '../pause/usePauseShortcut';
import { handleNotebookShortcut } from '../notebook/useNotebookShortcut';
const definition = loadCaseDefinition('case-001');
function setup() {
  const store = createGameStore({ caseDefinition: definition });
  const bus = createEventBus<GameEventMap>();
  const disconnect = connectCaseEngine(bus, store, definition);
  return { store, bus, disconnect };
}
type Store = ReturnType<typeof setup>['store'];
function action(store: Store, id: string): DialogueAction {
  const s = store.getState().dialogueSession!;
  return { nodeId: s.nodeId, revision: s.revision, choiceId: id };
}
function choose(store: Store, id: string) {
  store.getState().chooseDialogue(action(store, id));
}
function key(key: string, target: Element | null = null) {
  return { key, target, preventDefault() {} };
}
describe('dialogue store and bridge', () => {
  it('opens the authored NPC tree and disconnects cleanly', () => {
    const { store, bus, disconnect } = setup();
    bus.emit('interaction:triggered', { interactableId: 'anna' });
    expect(store.getState().dialogueSession).toMatchObject({
      npcId: 'anna',
      treeId: 'anna_initial',
      nodeId: 'entry',
    });
    expect(store.getState().inputLocked).toBe(true);
    store.getState().closeDialogue();
    disconnect();
    bus.emit('interaction:triggered', { interactableId: 'anna' });
    expect(store.getState().dialogueSession).toBeNull();
  });
  it.each(['pause', 'evidence', 'notebook'])(
    'does not open dialogue or apply interaction effects during %s',
    (overlay) => {
      const { store, bus } = setup();
      if (overlay === 'pause') store.getState().setPaused(true);
      if (overlay === 'evidence') store.getState().openEvidence('meeting_minutes');
      if (overlay === 'notebook') store.getState().toggleNotebook();
      const before = store.getState().caseState;
      bus.emit('interaction:triggered', { interactableId: 'david' });
      bus.emit('interaction:triggered', { interactableId: 'meeting_minutes' });
      store.getState().startDialogue('anna');
      expect(store.getState().dialogueSession).toBeNull();
      expect(store.getState().caseState).toBe(before);
    },
  );
  it('keeps overlays exclusive and routes J/Escape during dialogue', () => {
    const { store } = setup();
    store.getState().startDialogue('anna');
    store.getState().toggleNotebook();
    store.getState().openEvidence('meeting_minutes');
    store.getState().setPaused(true);
    expect(store.getState().notebookOpen).toBe(false);
    expect(store.getState().activeEvidenceId).toBeNull();
    expect(store.getState().paused).toBe(false);
    handleNotebookShortcut(store, key('j'));
    expect(store.getState().notebookOpen).toBe(false);
    handleEscapeShortcut(store, key('Escape'));
    expect(store.getState().dialogueSession).toBeNull();
    expect(store.getState().paused).toBe(false);
    expect(store.getState().inputLocked).toBe(false);
  });
  it('rejects stale double-click and callbacks from a closed session', () => {
    const { store } = setup();
    store.getState().startDialogue('anna');
    const old = action(store, 'q1');
    store.getState().chooseDialogue(old);
    const after = store.getState().dialogueSession;
    store.getState().chooseDialogue(old);
    expect(store.getState().dialogueSession).toBe(after);
    store.getState().closeDialogue();
    store.getState().startDialogue('anna');
    store.getState().chooseDialogue(old);
    expect(store.getState().dialogueSession?.nodeId).toBe('entry');
  });
  it('completes all three authored interviews and preserves early-close progress', () => {
    const { store } = setup();
    for (const npc of ['anna', 'leo', 'david']) {
      store.getState().startDialogue(npc);
      choose(store, 'q1');
      store.getState().closeDialogue();
      expect(store.getState().caseState.flags[npc + '_q1_read']).toBeUndefined();
      store.getState().startDialogue(npc);
      for (const i of [1, 2, 3]) {
        choose(store, 'q' + i);
        choose(store, 'continue');
      }
      store.getState().closeDialogue();
    }
    expect(store.getState().caseState.objectiveStatuses.talk_to_everyone).toBe('completed');
  });
  it('tracks conditional David and only unlocks confession after Which folder', () => {
    const { store } = setup();
    store.getState().startDialogue('david');
    choose(store, 'q3');
    expect(store.getState().dialogueSession?.nodeId).toBe('answer3');
    store.getState().closeDialogue();
    store
      .getState()
      .applyCaseEffects([{ type: 'setFlag', key: 'david_contradiction_found', value: true }]);
    store.getState().startDialogue('david');
    choose(store, 'q3_unlocked');
    expect(store.getState().dialogueSession?.nodeId).toBe('answer3_unlocked');
    choose(store, 'continue');
    choose(store, 'challenge');
    expect(store.getState().caseState.discoveredFactIds).not.toContain('david_took_report');
    choose(store, 'which_folder');
    expect(store.getState().caseState.discoveredFactIds).toContain('david_took_report');
  });
  it('autosaves only business transitions and does not save UI/session changes', async () => {
    const { store } = setup();
    const saves: unknown[] = [];
    const stop = connectAutosave(
      store,
      async (s) => {
        saves.push(s);
      },
      () => {},
    );
    store.getState().startDialogue('anna');
    choose(store, 'q1');
    choose(store, 'continue');
    store.getState().closeDialogue();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(saves).toHaveLength(1);
    store.getState().startDialogue('anna');
    choose(store, 'q1');
    choose(store, 'continue');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(saves).toHaveLength(1);
    stop();
  });
  it.each(['INPUT', 'TEXTAREA', 'DIV'])('does not consume typing Escape in %s', (tagName) => {
    const { store } = setup();
    store.getState().startDialogue('anna');
    const target = { tagName, isContentEditable: tagName === 'DIV' } as unknown as Element;
    handleEscapeShortcut(store, key('Escape', target));
    expect(store.getState().dialogueSession).not.toBeNull();
  });
});
