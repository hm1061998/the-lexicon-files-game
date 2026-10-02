import { describe, expect, it, vi } from 'vitest';
import { loadCaseDefinition } from '../loader/loadCaseDefinition';
import { validateRegisteredContent } from './validateRegisteredContent';
const registry = vi.hoisted(() => ({ ids: ['case-001'] }));
vi.mock('../loader/loadCaseDefinition', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../loader/loadCaseDefinition')>()),
  REGISTERED_CASE_IDS: registry.ids,
}));
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
