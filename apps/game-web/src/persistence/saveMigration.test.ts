import { describe, expect, it } from 'vitest';
import { loadCaseDefinition } from '@lexicon/game-content';
import { createCaseState } from '@lexicon/game-core';
import { migrateVersion1Save } from './saveMigration';
import { createSaveRepository, type SaveDatabase, type SaveRecord } from './saveRepository';
const definition = loadCaseDefinition('case-001');
function legacy() {
  return {
    schemaVersion: 1,
    caseId: definition.id,
    updatedAt: 42,
    state: {
      ...createCaseState(definition),
      objectiveStatuses: { find_what_happened: 'completed' },
      evidenceIds: ['meeting_minutes'],
      discoveredFactIds: ['meeting_started'],
      flags: {},
    },
  };
}
describe('save migration', () => {
  it('preserves legacy progress and initializes only the new objective', () => {
    const raw = legacy(),
      record = migrateVersion1Save(raw, definition);
    expect(record.schemaVersion).toBe(2);
    expect(record.state.evidenceIds).toEqual(['meeting_minutes']);
    expect(record.state.discoveredFactIds).toEqual(['meeting_started']);
    expect(record.state.objectiveStatuses).toEqual({
      find_what_happened: 'completed',
      talk_to_everyone: 'active',
    });
    expect(record.state.flags).toEqual({});
    expect(raw.state.objectiveStatuses).toEqual({ find_what_happened: 'completed' });
  });
  it.each(['objective', 'evidence', 'fact', 'flag', 'version', 'transient'])(
    'rejects corrupt legacy %s before migration',
    (key) => {
      const raw = legacy();
      const changes: Record<string, unknown> = {
        objective: { objectiveStatuses: { extra: 'active' } },
        evidence: { evidenceIds: ['unknown'] },
        fact: { discoveredFactIds: ['unknown'] },
        flag: { flags: { seen: 'yes' } },
        transient: { dialogueSession: { nodeId: 'entry' } },
      };
      expect(() =>
        migrateVersion1Save(
          key === 'version'
            ? { ...raw, schemaVersion: 99 }
            : { ...raw, state: { ...raw.state, ...(changes[key] as object) } },
          definition,
        ),
      ).toThrow();
    },
  );
  it('backs up before migration write and loads the persisted v2 state', async () => {
    let raw: unknown = legacy();
    const order: string[] = [];
    const db: SaveDatabase = {
      getSave: async () => raw,
      addBackup: async (b) => {
        order.push('backup');
        expect(b.raw).toBe(raw);
      },
      putSave: async (r) => {
        order.push('write');
        raw = r;
      },
    };
    const result = await createSaveRepository(async () => db).loadSave(definition.id, definition);
    expect(result.status).toBe('loaded');
    expect(order).toEqual(['backup', 'write']);
    expect(raw).toMatchObject({ schemaVersion: 2 });
  });
  it.each(['backup', 'write'])('keeps the original on migration %s failure', async (stage) => {
    const raw = legacy();
    let stored: unknown = raw;
    const db: SaveDatabase = {
      getSave: async () => stored,
      addBackup: async () => {
        if (stage === 'backup') throw new Error('backup failed');
      },
      putSave: async (r: SaveRecord) => {
        if (stage === 'write') throw new Error('write failed');
        stored = r;
      },
    };
    const result = await createSaveRepository(async () => db).loadSave(definition.id, definition);
    expect(result.status).toBe('unavailable');
    expect(stored).toBe(raw);
  });
});
