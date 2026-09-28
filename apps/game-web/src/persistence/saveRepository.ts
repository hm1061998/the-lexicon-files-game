import { openDB, type DBSchema } from 'idb';
import type { CaseDefinition, GameState, ObjectiveStatus } from '@lexicon/shared-types';
import { createCaseState } from '@lexicon/game-core';

export type SaveRecord = {
  schemaVersion: 1;
  caseId: string;
  state: GameState;
  updatedAt: number;
};

export type SaveBackup = { caseId: string; createdAt: number; raw: unknown };

interface SaveDatabaseSchema extends DBSchema {
  saves: { key: string; value: unknown };
  backups: { key: number; value: SaveBackup };
}

export type SaveDatabase = {
  getSave(caseId: string): Promise<unknown | undefined>;
  putSave(record: SaveRecord): Promise<void>;
  addBackup(backup: SaveBackup): Promise<void>;
};

export type SaveDatabaseFactory = () => Promise<SaveDatabase>;

export type LoadSaveResult =
  | { status: 'missing' }
  | { status: 'loaded'; state: GameState }
  | { status: 'confirmation-required'; reason: string }
  | { status: 'unavailable'; error: string };

export type SaveRepository = {
  loadSave(caseId: string, definition: CaseDefinition): Promise<LoadSaveResult>;
  saveGameState(state: GameState): Promise<void>;
  createFreshSaveAfterConfirmation(caseId: string, definition: CaseDefinition): Promise<GameState>;
};

const DATABASE_NAME = 'lexicon-game-saves';
const DATABASE_VERSION = 1;
const OBJECT_STORE_SAVES = 'saves';
const OBJECT_STORE_BACKUPS = 'backups';

async function openSaveDatabase(): Promise<SaveDatabase> {
  const database = await openDB<SaveDatabaseSchema>(DATABASE_NAME, DATABASE_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(OBJECT_STORE_SAVES)) {
        db.createObjectStore(OBJECT_STORE_SAVES);
      }
      if (!db.objectStoreNames.contains(OBJECT_STORE_BACKUPS)) {
        db.createObjectStore(OBJECT_STORE_BACKUPS, { autoIncrement: true });
      }
    },
  });

  return {
    async getSave(caseId) {
      return database.get(OBJECT_STORE_SAVES, caseId);
    },
    async putSave(record) {
      await database.put(OBJECT_STORE_SAVES, record, record.caseId);
    },
    async addBackup(backup) {
      await database.add(OBJECT_STORE_BACKUPS, backup);
    },
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isUniqueKnownIds(value: unknown, validIds: ReadonlySet<string>): value is string[] {
  if (!Array.isArray(value) || !value.every((item): item is string => typeof item === 'string')) {
    return false;
  }
  return new Set(value).size === value.length && value.every((id) => validIds.has(id));
}

function isObjectiveStatus(value: unknown): value is ObjectiveStatus {
  return value === 'locked' || value === 'active' || value === 'completed';
}

function isGameState(value: unknown, definition: CaseDefinition): value is GameState {
  if (!isObject(value)) return false;
  const gameStateKeys = new Set([
    'caseId',
    'caseTitle',
    'evidenceTotal',
    'objectiveStatuses',
    'evidenceIds',
    'discoveredFactIds',
    'flags',
  ]);
  const stateKeys = Object.keys(value);
  if (stateKeys.length !== gameStateKeys.size || stateKeys.some((key) => !gameStateKeys.has(key))) {
    return false;
  }
  const objectiveIds = new Set(definition.objectives.map(({ id }) => id));
  const objectiveStatuses = value.objectiveStatuses;
  if (!isObject(objectiveStatuses)) return false;
  const statusIds = Object.keys(objectiveStatuses);
  if (
    statusIds.length !== objectiveIds.size ||
    statusIds.some((id) => !objectiveIds.has(id)) ||
    !Object.values(objectiveStatuses).every(isObjectiveStatus)
  ) {
    return false;
  }
  const flags = value.flags;
  if (!isObject(flags) || !Object.values(flags).every((flag) => typeof flag === 'boolean')) {
    return false;
  }

  return (
    value.caseId === definition.id &&
    value.caseTitle === definition.title &&
    value.evidenceTotal === definition.evidenceTotal &&
    isUniqueKnownIds(value.evidenceIds, new Set(definition.evidences.map(({ id }) => id))) &&
    isUniqueKnownIds(value.discoveredFactIds, new Set(definition.facts.map(({ id }) => id)))
  );
}

function parseSaveRecord(value: unknown, caseId: string, definition: CaseDefinition): SaveRecord {
  if (!isObject(value)) throw new Error('Save record is not an object');

  switch (value.schemaVersion) {
    case 1: {
      if (value.caseId !== caseId) throw new Error('Save record caseId does not match');
      if (typeof value.updatedAt !== 'number' || !Number.isFinite(value.updatedAt)) {
        throw new Error('Save record updatedAt is invalid');
      }
      if (!isGameState(value.state, definition))
        throw new Error('Save GameState does not match case');
      return value as unknown as SaveRecord;
    }
    default:
      throw new Error(`Unsupported save schemaVersion: ${String(value.schemaVersion)}`);
  }
}

export function createSaveRepository(
  openDatabase: SaveDatabaseFactory = openSaveDatabase,
): SaveRepository {
  return {
    async loadSave(caseId, definition) {
      if (caseId !== definition.id) {
        return { status: 'unavailable', error: 'Save caseId does not match its definition' };
      }

      let database: SaveDatabase;
      let raw: unknown | undefined;
      try {
        database = await openDatabase();
        raw = await database.getSave(caseId);
      } catch (error) {
        return {
          status: 'unavailable',
          error: error instanceof Error ? error.message : String(error),
        };
      }
      if (raw === undefined) return { status: 'missing' };

      try {
        const record = parseSaveRecord(raw, caseId, definition);
        return { status: 'loaded', state: record.state };
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        try {
          await database.addBackup({ caseId, createdAt: Date.now(), raw });
        } catch (backupError) {
          return {
            status: 'unavailable',
            error: `Could not preserve invalid save (${reason}): ${backupError instanceof Error ? backupError.message : String(backupError)}`,
          };
        }
        return { status: 'confirmation-required', reason };
      }
    },
    async saveGameState(state) {
      const database = await openDatabase();
      await database.putSave({
        schemaVersion: 1,
        caseId: state.caseId,
        state,
        updatedAt: Date.now(),
      });
    },
    async createFreshSaveAfterConfirmation(caseId, definition) {
      if (caseId !== definition.id) throw new Error('Save caseId does not match its definition');
      const state = createCaseState(definition);
      await this.saveGameState(state);
      return state;
    },
  };
}
