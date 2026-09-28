import { openDB, type DBSchema } from 'idb';
import type { CaseDefinition, GameState } from '@lexicon/shared-types';
import { createCaseState } from '@lexicon/game-core';
import { migrateVersion1Save, parseCurrentSaveRecord } from './saveMigration';

export type SaveRecord = {
  schemaVersion: 2;
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
        const legacy =
          typeof raw === 'object' &&
          raw !== null &&
          'schemaVersion' in raw &&
          raw.schemaVersion === 1;
        const record = legacy
          ? migrateVersion1Save(raw, definition)
          : parseCurrentSaveRecord(raw, caseId, definition);
        if (legacy) {
          try {
            await database.addBackup({ caseId, createdAt: Date.now(), raw });
            await database.putSave(record);
          } catch (error) {
            return {
              status: 'unavailable',
              error: `Could not persist save migration: ${error instanceof Error ? error.message : String(error)}`,
            };
          }
        }
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
        schemaVersion: 2,
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
