import { describe, expect, it } from 'vitest';
import * as mod from './index';

describe('package entry', () => {
  it('loads as a module', () => {
    expect(mod).toBeTypeOf('object');
  });
});

describe('authored notebook statements', () => {
  const definition = mod.loadCaseDefinition('case-001');
  const flag = (key: string) => ({ type: 'flag', key, value: true });

  it('authors statement conditions in content order', () => {
    for (const npc of ['anna', 'leo']) {
      expect(definition.dialogues.find(({ npcId }) => npcId === npc)?.notebookStatements).toEqual([
        {
          nodeId: 'entry',
          recordedCondition: {
            type: 'any',
            conditions: [flag(`${npc}_q1_read`), flag(`${npc}_q2_read`), flag(`${npc}_q3_read`)],
          },
        },
        { nodeId: 'answer1', recordedCondition: flag(`${npc}_q1_read`) },
        { nodeId: 'answer2', recordedCondition: flag(`${npc}_q2_read`) },
        { nodeId: 'answer3', recordedCondition: flag(`${npc}_q3_read`) },
      ]);
    }
    expect(definition.dialogues.find(({ npcId }) => npcId === 'david')?.notebookStatements).toEqual(
      [
        { nodeId: 'entry', recordedCondition: flag('david_statement_read') },
        { nodeId: 'answer1', recordedCondition: flag('david_q1_read') },
        { nodeId: 'answer2', recordedCondition: flag('david_q2_read') },
        { nodeId: 'answer3', recordedCondition: flag('david_answer3_recorded') },
        { nodeId: 'answer3_unlocked', recordedCondition: flag('david_answer3_unlocked_recorded') },
        { nodeId: 'collect_folder', recordedCondition: flag('david_folder_statement_read') },
        { nodeId: 'confession', recordedCondition: flag('david_confession_read') },
      ],
    );
  });

  it('records David branches independently without changing completion', () => {
    const tree = definition.dialogues.find(({ npcId }) => npcId === 'david')!;
    for (const [nodeId, key] of [
      ['answer3', 'david_answer3_recorded'],
      ['answer3_unlocked', 'david_answer3_unlocked_recorded'],
    ]) {
      const choice = tree.nodes
        .find(({ id }) => id === nodeId)!
        .choices.find(({ id }) => id === 'continue')!;
      expect(choice.effects).toEqual([
        { type: 'setFlag', key: 'david_q3_read', value: true },
        { type: 'setFlag', key, value: true },
      ]);
      expect(choice.nextNodeId).toBe('entry');
    }
    expect(tree.completionCondition).toEqual({
      type: 'all',
      conditions: [flag('david_q1_read'), flag('david_q2_read'), flag('david_q3_read')],
    });
    expect(tree.completionFlag).toBe('david_interviewed');
  });
});
