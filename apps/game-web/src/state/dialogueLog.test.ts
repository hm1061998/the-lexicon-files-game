import { describe, expect, it } from 'vitest';
import { loadCaseDefinition } from '@lexicon/game-content';
import { createGameStore } from './gameStore';

const open = () => createGameStore({ caseDefinition: loadCaseDefinition('case-001') });
const choose = (store: ReturnType<typeof open>, choiceId: string) => {
  const session = store.getState().dialogueSession!;
  store.getState().chooseDialogue({ nodeId: session.nodeId, revision: session.revision, choiceId });
};

describe('dialogue log', () => {
  it('records each line shown, in order', () => {
    const store = open();
    expect(store.getState().dialogueLog).toEqual([]);
    expect(store.getState().startDialogue('anna')).toBe(true);
    choose(store, store.getState().caseDefinition.dialogues[0]!.nodes[0]!.choices[0]!.id);
    const log = store.getState().dialogueLog;
    expect(log).toHaveLength(2);
    expect(log[0]).toMatchObject({ npcId: 'anna', treeId: 'anna_initial', nodeId: 'entry' });
    expect(log[1]).toMatchObject({ npcId: 'anna', treeId: 'anna_initial' });
    expect(log[1]!.nodeId).not.toBe('entry');
  });

  it('does not repeat a line when the conversation is reopened', () => {
    const store = open();
    store.getState().startDialogue('anna');
    store.getState().closeDialogue();
    store.getState().startDialogue('anna');
    expect(store.getState().dialogueLog.filter((e) => e.nodeId === 'entry')).toHaveLength(1);
  });

  it('keeps the log out of the case state that is saved', () => {
    const store = open();
    store.getState().startDialogue('anna');
    expect(store.getState().caseState).not.toHaveProperty('dialogueLog');
    expect(JSON.stringify(store.getState().caseState)).not.toContain('dialogueLog');
  });

  it('opens and closes in the world and locks input while open', () => {
    const store = open();
    store.getState().toggleDialogueLog();
    expect(store.getState()).toMatchObject({ dialogueLogOpen: true, inputLocked: true });
    store.getState().toggleDialogueLog();
    expect(store.getState()).toMatchObject({ dialogueLogOpen: false, inputLocked: false });
  });

  it('opens during a conversation and leaves the conversation open when it closes', () => {
    const store = open();
    store.getState().startDialogue('anna');
    store.getState().toggleDialogueLog();
    expect(store.getState().dialogueLogOpen).toBe(true);
    store.getState().closeDialogueLog();
    expect(store.getState()).toMatchObject({ dialogueLogOpen: false, inputLocked: true });
    expect(store.getState().dialogueSession).not.toBeNull();
  });

  it('does not open over the notebook, the board, an evidence card or the pause menu', () => {
    const notebook = open();
    notebook.getState().openNotebook();
    notebook.getState().toggleDialogueLog();
    expect(notebook.getState().dialogueLogOpen).toBe(false);

    const board = open();
    board.getState().openDeduction();
    board.getState().toggleDialogueLog();
    expect(board.getState().dialogueLogOpen).toBe(false);

    const evidence = open();
    evidence.getState().openEvidence('meeting_minutes');
    evidence.getState().toggleDialogueLog();
    expect(evidence.getState().dialogueLogOpen).toBe(false);

    const paused = open();
    paused.getState().setPaused(true);
    paused.getState().toggleDialogueLog();
    expect(paused.getState().dialogueLogOpen).toBe(false);
  });

  it('closes when another modal opens', () => {
    const paused = open();
    paused.getState().toggleDialogueLog();
    paused.getState().setPaused(true);
    expect(paused.getState().dialogueLogOpen).toBe(false);

    const notebook = open();
    notebook.getState().toggleDialogueLog();
    notebook.getState().openNotebook();
    expect(notebook.getState().dialogueLogOpen).toBe(false);
    expect(notebook.getState().notebookOpen).toBe(true);
  });
});
