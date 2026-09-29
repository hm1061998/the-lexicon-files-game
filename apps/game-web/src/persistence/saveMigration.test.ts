import { describe, expect, it } from 'vitest';
import { loadCaseDefinition } from '@lexicon/game-content';
import { createCaseState } from '@lexicon/game-core';
import { migrateVersion1Save, migrateVersion2Save, parseCurrentSaveRecord } from './saveMigration';
import { createSaveRepository, type SaveDatabase, type SaveRecord } from './saveRepository';
const definition = loadCaseDefinition('case-001');
function legacy() {
  const {
    timelineEventIds: _timelineEventIds,
    contradictionIds: _contradictionIds,
    ...oldState
  } = createCaseState(definition);
  return {
    schemaVersion: 1,
    caseId: definition.id,
    updatedAt: 42,
    state: {
      ...oldState,
      objectiveStatuses: { find_what_happened: 'completed' },
      evidenceIds: ['meeting_minutes'],
      discoveredFactIds: ['meeting_started'],
      flags: {},
    },
  };
}
describe('save migration', () => {
  it('preserves legacy progress and initializes Phase 8 objectives', () => {
    const raw = legacy(),
      record = migrateVersion1Save(raw, definition);
    expect(record.schemaVersion).toBe(3);
    expect(record.activeSceneId).toBe('main_office');
    expect(record.state.timelineEventIds).toEqual([]);
    expect(record.state.contradictionIds).toEqual([]);
    expect(record.state.evidenceIds).toEqual(['meeting_minutes']);
    expect(record.state.discoveredFactIds).toEqual(['meeting_started', 'meeting_ended_20_45']);
    expect(record.state.objectiveStatuses).toEqual({
      find_what_happened: 'completed',
      talk_to_everyone: 'active',
      check_security_records: 'active',
      compare_david_statement: 'active',
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
  it('backs up before migration write and loads the persisted v3 state', async () => {
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
    expect(raw).toMatchObject({ schemaVersion: 3, activeSceneId: 'main_office' });
  });

  it('migrates V2 progress to V3 with an initial scene and new empty progress arrays', () => {
    const {
      timelineEventIds: _timelineEventIds,
      contradictionIds: _contradictionIds,
      ...oldState
    } = createCaseState(definition);
    const v2State = {
      ...oldState,
      objectiveStatuses: {
        find_what_happened: 'completed' as const,
        talk_to_everyone: 'active' as const,
      },
      evidenceIds: ['meeting_minutes', 'leo_phone_recording'],
      discoveredFactIds: ['meeting_started', 'leo_outside_at_2029'],
      flags: { checked_desk: true },
    };
    const record = migrateVersion2Save(
      {
        schemaVersion: 2,
        caseId: definition.id,
        updatedAt: 43,
        state: v2State,
      },
      definition,
    );

    expect(record).toMatchObject({ schemaVersion: 3, activeSceneId: 'main_office' });
    expect(record.state.evidenceIds).toEqual(['meeting_minutes', 'leo_phone_recording']);
    expect(record.state.flags).toEqual({ checked_desk: true });
    expect(record.state.objectiveStatuses.find_what_happened).toBe('completed');
    expect(record.state.objectiveStatuses.talk_to_everyone).toBe('active');
    expect(record.state.timelineEventIds).toEqual([]);
    expect(record.state.contradictionIds).toEqual([]);
  });

  it('rejects an unknown V3 scene ID', () => {
    const state = createCaseState(definition);
    expect(() =>
      parseCurrentSaveRecord(
        {
          schemaVersion: 3,
          caseId: definition.id,
          activeSceneId: 'missing_scene',
          updatedAt: 44,
          state,
        },
        definition.id,
        definition,
      ),
    ).toThrow();
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
