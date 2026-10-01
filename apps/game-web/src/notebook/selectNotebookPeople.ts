import type { CaseDefinition, DialogueNode, GameState, NPCDefinition } from '@lexicon/shared-types';
import { evaluateCondition } from '@lexicon/game-core';

export interface NotebookPerson {
  readonly npc: NPCDefinition;
  readonly treeId: string;
  readonly status: 'inProgress' | 'complete';
  readonly statements: readonly DialogueNode[];
}

export function selectNotebookPeople(
  definition: CaseDefinition,
  state: GameState,
): readonly NotebookPerson[] {
  return definition.npcs.flatMap((npc): NotebookPerson[] => {
    const tree = definition.dialogues.find(
      ({ id, npcId }) => id === npc.dialogueTreeId && npcId === npc.id,
    );
    if (!tree?.notebookStatements) return [];
    const statements = tree.notebookStatements.flatMap((statement) => {
      if (!evaluateCondition(state, statement.recordedCondition)) return [];
      const node = tree.nodes.find(({ id }) => id === statement.nodeId);
      return node ? [node] : [];
    });
    return statements.length
      ? [
          {
            npc,
            treeId: tree.id,
            status: state.flags[tree.completionFlag] === true ? 'complete' : 'inProgress',
            statements,
          },
        ]
      : [];
  });
}
