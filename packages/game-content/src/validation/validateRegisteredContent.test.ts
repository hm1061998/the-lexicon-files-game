import { describe, expect, it, vi } from 'vitest';
import { loadCaseDefinition, REGISTERED_CASE_IDS } from '../loader/loadCaseDefinition';
import type { Condition } from '@lexicon/shared-types';
import { validateRegisteredContent } from './validateRegisteredContent';
const registry = vi.hoisted(() => ({ ids: [] as string[] }));
vi.mock('../loader/loadCaseDefinition', async (importOriginal) => {
  const original = await importOriginal<typeof import('../loader/loadCaseDefinition')>();
  registry.ids.push(...original.REGISTERED_CASE_IDS);
  return { ...original, REGISTERED_CASE_IDS: registry.ids };
});

function leaves(condition: Condition): readonly Condition[] {
  return condition.type === 'all' || condition.type === 'any'
    ? condition.conditions.flatMap(leaves)
    : [condition];
}

describe.each(REGISTERED_CASE_IDS)('registered case %s invariants', (caseId) => {
  it('references real facts from evidence and timeline availability', () => {
    const definition = loadCaseDefinition(caseId);
    const factIds = definition.facts.map(({ id }) => id);
    for (const evidence of definition.evidences)
      for (const id of evidence.relatedFactIds) expect(factIds).toContain(id);
    for (const event of definition.timeline.events)
      if (event.availability.type === 'requiresFacts')
        for (const id of event.availability.factIds) expect(factIds).toContain(id);
  });

  it('names a suspect as the correct conclusion and gives every scene a default spawn', () => {
    const definition = loadCaseDefinition(caseId);
    expect(definition.conclusion?.suspectNpcIds).toContain(
      definition.conclusion?.correctSuspectNpcId,
    );
    for (const scene of definition.scenes) expect(scene.spawnPoints.default).toBeDefined();
  });

  it('pairs two distinct facts unlocked by an authored evidence or dialogue', () => {
    const definition = loadCaseDefinition(caseId);
    for (const contradiction of definition.contradictions) {
      expect(contradiction.factIds).toHaveLength(2);
      expect(new Set(contradiction.factIds).size).toBe(2);
      for (const id of contradiction.factIds) {
        const fact = definition.facts.find((item) => item.id === id)!;
        expect(fact).toBeDefined();
        const trees = definition.dialogues.filter((tree) =>
          fact.sourceDialogueIds?.includes(tree.id),
        );
        const effects = trees.flatMap((tree) =>
          tree.nodes.flatMap((node) => [
            ...(node.effects ?? []),
            ...node.choices.flatMap((choice) => choice.effects ?? []),
          ]),
        );
        expect(
          leaves(fact.unlockCondition).some(
            (condition) =>
              (condition.type === 'hasEvidence' &&
                fact.sourceEvidenceIds.includes(condition.evidenceId) &&
                definition.evidences.some((evidence) => evidence.id === condition.evidenceId)) ||
              (condition.type === 'flag' &&
                condition.value &&
                effects.some(
                  (effect) =>
                    effect.type === 'setFlag' && effect.key === condition.key && effect.value,
                )),
          ),
          `${id} must have a source that unlocks it`,
        ).toBe(true);
      }
    }
  });
});
describe('registered dialogue content', () => {
  it('rejects two cases flagged recommendedForNewPlayers', () => {
    const definition = loadCaseDefinition('case-001');
    registry.ids.push('another-case');
    try {
      expect(() =>
        validateRegisteredContent((id) => ({
          ...definition,
          id,
          difficulty: { ...definition.difficulty, recommendedForNewPlayers: true },
        })),
      ).toThrow('recommendedForNewPlayers');
      expect(() =>
        validateRegisteredContent((id) => ({
          ...definition,
          id,
          difficulty: { ...definition.difficulty, recommendedForNewPlayers: id === 'case-001' },
        })),
      ).not.toThrow();
    } finally {
      registry.ids.pop();
    }
  });
  it('authors three playable NPC trees with exact Case 001 copy', () => {
    const d = loadCaseDefinition('case-001');
    expect(d.npcs.map((n) => n.id)).toEqual(['anna', 'leo', 'david']);
    expect(d.dialogues.map((t) => t.id)).toEqual(['anna_initial', 'leo_initial', 'david_initial']);
    expect(d.dialogues.flatMap((t) => t.nodes).map((n) => n.text)).toContain(
      "I didn't enter the meeting room after eight.",
    );
    expect(d.dialogues.flatMap((t) => t.nodes).map((n) => n.text)).toContain(
      '...I may have gone in for a moment.',
    );
    expect(d.evidences).toHaveLength(3);
    expect(d.evidences.find((evidence) => evidence.id === 'leo_phone_recording')?.category).toBe(
      'audio',
    );
    expect(d.scenes.map(({ id }) => id)).toEqual(['main_office', 'archive']);
    expect(d.scenes.find(({ id }) => id === 'archive')?.assets.map(({ id }) => id)).toContain(
      'PLACEHOLDER_security_terminal',
    );
    expect(
      d.scenes[0]?.assets.find(({ id }) => id === 'hallway_door')?.interaction?.transition,
    ).toEqual({
      targetSceneId: 'archive',
      targetSpawnId: 'from_office',
    });
    expect(d.timeline.slots.map(({ id }) => id)).toEqual([
      '20_00',
      '20_18',
      '20_27',
      '20_29',
      '20_32',
      '20_36',
      '20_40',
      '20_45',
      '21_05',
    ]);
    expect(d.timeline.events.map(({ id }) => id)).toEqual([
      'meeting_started',
      'anna_exit_20_18',
      'leo_exit_20_27',
      'leo_outside_at_2029',
      'david_entry_20_32',
      'david_exit_20_36',
      'leo_entry_20_40',
      'meeting_ended_20_45',
      'report_missing_21_05',
    ]);
    expect(d.timeline.events.find(({ id }) => id === 'report_missing_21_05')?.availability).toEqual(
      { type: 'availableFromStart' },
    );
    expect(d.facts.some(({ id }) => id === 'report_missing_21_05')).toBe(false);
    expect(d.contradictions).toMatchObject([
      {
        id: 'david_statement_vs_access_log',
        factIds: ['david_statement_no_entry_after_20_00', 'david_entry_20_32'],
        objectiveId: 'compare_david_statement',
      },
    ]);
    expect(d.evidenceTotal).toBe(5);
    expect(d.objectives.find((o) => o.id === 'talk_to_everyone')).toMatchObject({
      initialStatus: 'active',
    });
    for (const id of ['anna', 'leo', 'david'])
      expect(d.scenes[0]!.assets.find((a) => a.id === id)?.interaction).toMatchObject({
        npcId: id,
        radius: 90,
      });
  });
  it('validates build content and propagates broken content failures', () => {
    expect(() => validateRegisteredContent()).not.toThrow();
    expect(() =>
      validateRegisteredContent(() => {
        throw new Error('broken nextNodeId');
      }),
    ).toThrow('broken nextNodeId');
  });
});
