import { describe, expect, it } from 'vitest';
import { loadCaseDefinition } from '@lexicon/game-content';
import { createCaseState } from '@lexicon/game-core';
import {
  migrateVersion1Save,
  migrateVersion2Save,
  migrateVersion3Save,
  parseCurrentSaveRecord,
} from './saveMigration';
import { createSaveRepository, type SaveDatabase, type SaveRecord } from './saveRepository';
const definition = loadCaseDefinition('case-001');
function prePhase8State() {
  const oldState = { ...createCaseState(definition) };
  Reflect.deleteProperty(oldState, 'timelineEventIds');
  Reflect.deleteProperty(oldState, 'contradictionIds');
  return oldState;
}
function legacy() {
  return {
    schemaVersion: 1,
    caseId: definition.id,
    updatedAt: 42,
    state: {
      ...prePhase8State(),
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
    expect(record.schemaVersion).toBe(4);
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
      submit_your_conclusion: 'locked',
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
  it('backs up before migration write and loads the persisted v4 state', async () => {
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
    expect(raw).toMatchObject({ schemaVersion: 4, activeSceneId: 'main_office' });
  });

  it('migrates V2 progress to V4 with an initial scene and new empty progress arrays', () => {
    const oldState = prePhase8State();
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

    expect(record).toMatchObject({ schemaVersion: 4, activeSceneId: 'main_office' });
    expect(record.state.evidenceIds).toEqual(['meeting_minutes', 'leo_phone_recording']);
    expect(record.state.flags).toEqual({ checked_desk: true });
    expect(record.state.objectiveStatuses.find_what_happened).toBe('completed');
    expect(record.state.objectiveStatuses.talk_to_everyone).toBe('active');
    expect(record.state.timelineEventIds).toEqual([]);
    expect(record.state.contradictionIds).toEqual([]);
  });

  it('rejects an unknown V4 scene ID', () => {
    const state = createCaseState(definition);
    expect(() =>
      parseCurrentSaveRecord(
        {
          schemaVersion: 4,
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

  function phase8State() {
    const state = { ...createCaseState(definition) } as Record<string, unknown>;
    const statuses = { ...(state.objectiveStatuses as Record<string, string>) };
    delete statuses.submit_your_conclusion;
    return { ...state, objectiveStatuses: statuses };
  }

  function v3(stateChanges: Record<string, unknown> = {}) {
    return {
      schemaVersion: 3,
      caseId: definition.id,
      activeSceneId: 'archive',
      updatedAt: 77,
      state: { ...phase8State(), ...stateChanges },
    };
  }

  it('migrates a V3 save without the new objective and preserves all progress', () => {
    const raw = v3({
      evidenceIds: ['meeting_minutes', 'security_access_log'],
      discoveredFactIds: ['meeting_started', 'meeting_ended_20_45', 'david_entry_20_32'],
      flags: { anna_interviewed: true },
      timelineEventIds: ['meeting_started', 'david_entry_20_32'],
      contradictionIds: ['david_statement_vs_access_log'],
    });
    const record = migrateVersion3Save(raw, definition);
    expect(record).toMatchObject({ schemaVersion: 4, activeSceneId: 'archive', updatedAt: 77 });
    expect(record.state.objectiveStatuses.submit_your_conclusion).toBe('locked');
    expect(record.state.evidenceIds).toEqual(['meeting_minutes', 'security_access_log']);
    expect(record.state.flags).toEqual({ anna_interviewed: true });
    expect(record.state.timelineEventIds).toEqual(['meeting_started', 'david_entry_20_32']);
    expect(record.state.contradictionIds).toEqual(['david_statement_vs_access_log']);
    expect(
      (raw.state.objectiveStatuses as Record<string, string>).submit_your_conclusion,
    ).toBeUndefined();
  });

  it('opens the conclusion objective for a V3 save that already has the confession', () => {
    const record = migrateVersion3Save(
      v3({ discoveredFactIds: ['david_took_report'], flags: { david_confession_read: true } }),
      definition,
    );
    expect(record.state.objectiveStatuses.submit_your_conclusion).toBe('active');
  });

  it('opens the conclusion objective for a V2 save that already has the confession', () => {
    const record = migrateVersion2Save(
      {
        schemaVersion: 2,
        caseId: definition.id,
        updatedAt: 43,
        state: {
          ...prePhase8State(),
          objectiveStatuses: { find_what_happened: 'active', talk_to_everyone: 'active' },
          discoveredFactIds: ['david_took_report'],
          flags: { david_confession_read: true },
        },
      },
      definition,
    );
    expect(record.state.objectiveStatuses.submit_your_conclusion).toBe('active');
  });

  it('rejects a V3 save that already contains a V4-only objective', () => {
    expect(() =>
      migrateVersion3Save(
        v3({
          objectiveStatuses: {
            ...(phase8State().objectiveStatuses as Record<string, string>),
            submit_your_conclusion: 'active',
          },
        }),
        definition,
      ),
    ).toThrow();
  });

  it('backs up a V3 save before writing V4 and keeps the source when the write fails', async () => {
    const source = v3();
    const stored: unknown = source;
    const order: string[] = [];
    const db: SaveDatabase = {
      getSave: async () => stored,
      addBackup: async (b) => {
        order.push('backup');
        expect(b.raw).toBe(source);
      },
      putSave: async () => {
        order.push('write');
        throw new Error('disk full');
      },
    };
    const result = await createSaveRepository(async () => db).loadSave(definition.id, definition);
    expect(order).toEqual(['backup', 'write']);
    expect(result.status).toBe('unavailable');
    expect(stored).toBe(source);
  });

  it('loads a V3 save through the repository as V4 after backing it up', async () => {
    let stored: unknown = v3();
    const order: string[] = [];
    const db: SaveDatabase = {
      getSave: async () => stored,
      addBackup: async () => {
        order.push('backup');
      },
      putSave: async (r) => {
        order.push('write');
        stored = r;
      },
    };
    const result = await createSaveRepository(async () => db).loadSave(definition.id, definition);
    expect(result.status).toBe('loaded');
    expect(order).toEqual(['backup', 'write']);
    expect(stored).toMatchObject({ schemaVersion: 4, activeSceneId: 'archive' });
  });
});
