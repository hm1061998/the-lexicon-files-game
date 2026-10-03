import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { npcSchema } from './dialogue';
import case001 from '../../cases/case-001/npcs.json';
import case002 from '../../cases/case-002/npcs.json';

const npc = { id: 'anna', name: 'Anna Reed', role: 'Coordinator', dialogueTreeId: 'anna_initial' };
const publicFile = (url: string) =>
  new URL(`../../../../apps/game-web/public${url}`, import.meta.url);

describe('npc portrait', () => {
  it('accepts a default portrait and extra expressions', () => {
    expect(
      npcSchema.safeParse({ ...npc, portrait: { default: '/assets/portraits/anna.png' } }).success,
    ).toBe(true);
    expect(
      npcSchema.safeParse({
        ...npc,
        portrait: {
          default: '/assets/portraits/anna.png',
          worried: '/assets/portraits/anna-w.png',
        },
      }).success,
    ).toBe(true);
  });

  it('keeps the portrait optional', () => {
    expect(npcSchema.safeParse(npc).success).toBe(true);
  });

  it('rejects a path outside /assets/ or a portrait without default', () => {
    expect(
      npcSchema.safeParse({ ...npc, portrait: { default: '/portraits/anna.png' } }).success,
    ).toBe(false);
    expect(npcSchema.safeParse({ ...npc, portrait: { default: '/assets/../x.png' } }).success).toBe(
      false,
    );
    expect(
      npcSchema.safeParse({ ...npc, portrait: { worried: '/assets/portraits/a.png' } }).success,
    ).toBe(false);
  });

  it('gives every authored NPC a portrait whose file exists', () => {
    for (const raw of [...case001.npcs, ...case002.npcs]) {
      const parsed = npcSchema.parse(raw);
      expect(parsed.portrait?.default, parsed.id).toBeTruthy();
      expect(existsSync(publicFile(parsed.portrait!.default)), parsed.id).toBe(true);
    }
  });
});
