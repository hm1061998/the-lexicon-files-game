import { describe, expect, it } from 'vitest';
import { loadCaseDefinition } from '../loader/loadCaseDefinition';
import { validateRegisteredContent } from './validateRegisteredContent';
describe('registered dialogue content', () => {
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
    expect(d.evidences).toHaveLength(1);
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
