import { describe, expect, it } from 'vitest';
import type { GameState } from '@lexicon/shared-types';
import { loadCaseDefinition } from '@lexicon/game-content';
import { createCaseState } from '@lexicon/game-core';
import {
  createSaveRepository,
  SAVE_DATABASE_VERSION,
  type SaveDatabase,
  type SaveRecord,
} from './saveRepository';

class MemorySaveDatabase implements SaveDatabase {
  readonly saves = new Map<string, unknown>();
  readonly backups: { caseId: string; createdAt: number; raw: unknown }[] = [];

  async getSave(caseId: string): Promise<unknown | undefined> {
    return this.saves.get(caseId);
  }

  async putSave(record: SaveRecord): Promise<void> {
    this.saves.set(record.caseId, record);
  }

  async addBackup(backup: { caseId: string; createdAt: number; raw: unknown }): Promise<void> {
    this.backups.push(backup);
  }
}

const invalidStateCases: readonly [string, (state: GameState) => unknown][] = [
  ['case ID', (state) => ({ ...state, caseId: 'case-999' })],
  ['case title', (state) => ({ ...state, caseTitle: 'Wrong title' })],
  ['evidence total', (state) => ({ ...state, evidenceTotal: 1 })],
  [
    'duplicate evidence IDs',
    (state) => ({ ...state, evidenceIds: ['meeting_minutes', 'meeting_minutes'] }),
  ],
  ['unknown fact IDs', (state) => ({ ...state, discoveredFactIds: ['missing_fact'] })],
  ['unknown timeline event IDs', (state) => ({ ...state, timelineEventIds: ['missing_event'] })],
  [
    'unknown contradiction IDs',
    (state) => ({ ...state, contradictionIds: ['missing_contradiction'] }),
  ],
  ['objective keys', (state) => ({ ...state, objectiveStatuses: {} })],
  [
    'objective status values',
    (state) => ({
      ...state,
      objectiveStatuses: { ...state.objectiveStatuses, find_what_happened: 'done' },
    }),
  ],
  ['flag values', (state) => ({ ...state, flags: { seen: 'yes' } })],
];

describe('saveRepository', () => {
  it('keeps the IndexedDB database version unchanged', () => {
    expect(SAVE_DATABASE_VERSION).toBe(1);
  });

  it('returns missing when no record exists', async () => {
    const definition = loadCaseDefinition('case-001');
    const repository = createSaveRepository(async () => new MemorySaveDatabase());

    await expect(repository.loadSave(definition.id, definition)).resolves.toEqual({
      status: 'missing',
    });
  });

  it('round-trips only the GameState fields', async () => {
    const definition = loadCaseDefinition('case-001');
    const database = new MemorySaveDatabase();
    const repository = createSaveRepository(async () => database);
    const state: GameState = {
      ...createCaseState(definition),
      evidenceIds: ['meeting_minutes'],
      timelineEventIds: ['report_missing_21_05'],
      contradictionIds: ['david_statement_vs_access_log'],
    };

    await repository.saveGameState(state, 'archive');
    const record = database.saves.get(definition.id) as SaveRecord;
    const loaded = await repository.loadSave(definition.id, definition);

    expect(record).toBeDefined();
    expect(record).toMatchObject({
      schemaVersion: 3,
      caseId: definition.id,
      activeSceneId: 'archive',
    });
    expect(record.updatedAt).toEqual(expect.any(Number));
    expect(record.state).toEqual(state);
    expect(loaded).toEqual({ status: 'loaded', state, activeSceneId: 'archive' });
  });

  it('preserves caseId and schemaVersion', async () => {
    const definition = loadCaseDefinition('case-001');
    const database = new MemorySaveDatabase();
    const repository = createSaveRepository(async () => database);

    await repository.saveGameState(createCaseState(definition), 'main_office');
    const record = database.saves.get(definition.id) as SaveRecord;

    expect(record).toBeDefined();
    expect(record?.caseId).toBe('case-001');
    expect(record?.schemaVersion).toBe(3);
  });

  it('backs up malformed state before requiring confirmation', async () => {
    const definition = loadCaseDefinition('case-001');
    const database = new MemorySaveDatabase();
    const raw: SaveRecord = {
      schemaVersion: 3,
      caseId: definition.id,
      activeSceneId: 'main_office',
      state: { ...createCaseState(definition), evidenceIds: ['not-defined'] } as GameState,
      updatedAt: 42,
    };
    database.saves.set(definition.id, raw);
    const repository = createSaveRepository(async () => database);

    const result = await repository.loadSave(definition.id, definition);

    expect(result.status).toBe('confirmation-required');
    expect(database.backups).toHaveLength(1);
    expect(database.backups[0]).toMatchObject({ caseId: definition.id, raw });
    expect(database.saves.get(definition.id)).toBe(raw);
  });

  it.each(invalidStateCases)('backs up state with invalid %s', async (_label, corrupt) => {
    const definition = loadCaseDefinition('case-001');
    const database = new MemorySaveDatabase();
    const raw = {
      schemaVersion: 3,
      caseId: definition.id,
      activeSceneId: 'main_office',
      state: corrupt(createCaseState(definition)),
      updatedAt: 42,
    };
    database.saves.set(definition.id, raw);
    const repository = createSaveRepository(async () => database);

    const result = await repository.loadSave(definition.id, definition);

    expect(result.status).toBe('confirmation-required');
    expect(database.backups[0]?.raw).toBe(raw);
    expect(database.saves.get(definition.id)).toBe(raw);
  });

  it('backs up a record whose caseId does not match the requested case', async () => {
    const definition = loadCaseDefinition('case-001');
    const database = new MemorySaveDatabase();
    const raw = {
      schemaVersion: 3,
      caseId: 'case-999',
      activeSceneId: 'main_office',
      state: createCaseState(definition),
      updatedAt: 42,
    };
    database.saves.set(definition.id, raw);
    const repository = createSaveRepository(async () => database);

    const result = await repository.loadSave(definition.id, definition);

    expect(result.status).toBe('confirmation-required');
    expect(database.backups[0]?.raw).toBe(raw);
    expect(database.saves.get(definition.id)).toBe(raw);
  });

  it('backs up a V3 record with an unknown active scene without overwriting it', async () => {
    const definition = loadCaseDefinition('case-001');
    const database = new MemorySaveDatabase();
    const raw = {
      schemaVersion: 3,
      caseId: definition.id,
      activeSceneId: 'missing_scene',
      state: createCaseState(definition),
      updatedAt: 42,
    };
    database.saves.set(definition.id, raw);
    const repository = createSaveRepository(async () => database);

    const result = await repository.loadSave(definition.id, definition);

    expect(result.status).toBe('confirmation-required');
    expect(database.backups[0]?.raw).toBe(raw);
    expect(database.saves.get(definition.id)).toBe(raw);
  });

  it('backs up a V3 record when the saved scene no longer has its default spawn', async () => {
    const definition = loadCaseDefinition('case-001');
    const definitionWithoutArchiveDefault = {
      ...definition,
      scenes: definition.scenes.map((scene) =>
        scene.id === 'archive'
          ? { ...scene, spawnPoints: { from_office: scene.spawnPoints.from_office! } }
          : scene,
      ),
    };
    const database = new MemorySaveDatabase();
    const raw = {
      schemaVersion: 3,
      caseId: definition.id,
      activeSceneId: 'archive',
      state: createCaseState(definition),
      updatedAt: 42,
    };
    database.saves.set(definition.id, raw);
    const repository = createSaveRepository(async () => database);

    const result = await repository.loadSave(definition.id, definitionWithoutArchiveDefault);

    expect(result.status).toBe('confirmation-required');
    expect(database.backups[0]?.raw).toBe(raw);
    expect(database.saves.get(definition.id)).toBe(raw);
  });

  it('rejects transient UI properties from the saved GameState', async () => {
    const definition = loadCaseDefinition('case-001');
    const database = new MemorySaveDatabase();
    const raw = {
      schemaVersion: 3,
      caseId: definition.id,
      activeSceneId: 'main_office',
      state: { ...createCaseState(definition), notebookOpen: true },
      updatedAt: 42,
    };
    database.saves.set(definition.id, raw);
    const repository = createSaveRepository(async () => database);

    const result = await repository.loadSave(definition.id, definition);

    expect(result.status).toBe('confirmation-required');
    expect(database.backups[0]?.raw).toBe(raw);
  });

  it('does not overwrite an unsupported schemaVersion until confirmation', async () => {
    const definition = loadCaseDefinition('case-001');
    const database = new MemorySaveDatabase();
    const raw = { schemaVersion: 99, caseId: definition.id, state: createCaseState(definition) };
    database.saves.set(definition.id, raw);
    const repository = createSaveRepository(async () => database);

    const result = await repository.loadSave(definition.id, definition);

    expect(result.status).toBe('confirmation-required');
    expect(database.saves.get(definition.id)).toBe(raw);
    expect(database.backups[0]?.raw).toBe(raw);
  });

  it('creates a new save only when the explicit confirmation method is called', async () => {
    const definition = loadCaseDefinition('case-001');
    const database = new MemorySaveDatabase();
    const raw = { schemaVersion: 99, caseId: definition.id };
    database.saves.set(definition.id, raw);
    const repository = createSaveRepository(async () => database);

    const result = await repository.loadSave(definition.id, definition);
    expect(result.status).toBe('confirmation-required');
    expect(database.saves.get(definition.id)).toBe(raw);

    const fresh = await repository.createFreshSaveAfterConfirmation(definition.id, definition);
    expect(fresh).toEqual(createCaseState(definition));
    expect(database.saves.get(definition.id)).toMatchObject({
      schemaVersion: 3,
      state: fresh,
      activeSceneId: 'main_office',
    });
  });

  it('reports unavailable storage when the database factory rejects', async () => {
    const definition = loadCaseDefinition('case-001');
    const repository = createSaveRepository(async () => {
      throw new Error('IndexedDB unavailable');
    });

    await expect(repository.loadSave(definition.id, definition)).resolves.toMatchObject({
      status: 'unavailable',
      error: 'IndexedDB unavailable',
    });
    await expect(
      repository.saveGameState(createCaseState(definition), 'main_office'),
    ).rejects.toThrow('IndexedDB unavailable');
  });
});
