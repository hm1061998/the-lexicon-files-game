import { openDB, type DBSchema } from 'idb';
import type { VocabularyContextDefinition, VocabularyEntry } from '@lexicon/shared-types';
import type { TranslationMode } from '@lexicon/shared-types';
import {
  createDefaultLearningRecord,
  parseLearningRecord,
  type LearningRecordV2,
} from './learningMigration';

interface LearningDbSchema extends DBSchema {
  records: { key: string; value: unknown };
  backups: { key: number; value: { createdAt: number; raw: unknown } };
}
export type LearningDatabase = {
  get(): Promise<unknown | undefined>;
  put(record: LearningRecordV2): Promise<void>;
  backup(raw: unknown): Promise<void>;
};
export type LearningLoadResult =
  | {
      status: 'loaded' | 'missing';
      record: LearningRecordV2;
      legacyTranslationMode: TranslationMode | null;
    }
  | { status: 'confirmation-required'; reason: string }
  | {
      status: 'memory-only';
      record: LearningRecordV2;
      legacyTranslationMode: TranslationMode | null;
      error: string;
    };
export type LearningRepository = {
  loadLearning(
    catalogue: readonly VocabularyEntry[],
    contexts: readonly VocabularyContextDefinition[],
  ): Promise<LearningLoadResult>;
  saveLearning(record: LearningRecordV2): Promise<void>;
  createFreshLearningAfterConfirmation(): Promise<LearningRecordV2>;
};
async function openLearningDb(): Promise<LearningDatabase> {
  const db = await openDB<LearningDbSchema>('lexicon-learning', 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains('records')) database.createObjectStore('records');
      if (!database.objectStoreNames.contains('backups'))
        database.createObjectStore('backups', { autoIncrement: true });
    },
  });
  return {
    get: () => db.get('records', 'local-profile'),
    put: async (record) => {
      await db.put('records', record, 'local-profile');
    },
    backup: async (raw) => {
      await db.add('backups', { createdAt: Date.now(), raw });
    },
  };
}
export function createLearningRepository(
  factory: () => Promise<LearningDatabase> = openLearningDb,
): LearningRepository {
  let currentRaw: unknown;
  return {
    async loadLearning(catalogue, contexts) {
      const fresh = createDefaultLearningRecord();
      try {
        const db = await factory();
        currentRaw = await db.get();
        if (currentRaw === undefined)
          return { status: 'missing', record: fresh, legacyTranslationMode: null };
        let parsed: ReturnType<typeof parseLearningRecord>;
        try {
          parsed = parseLearningRecord(
            currentRaw,
            catalogue.map((v) => v.id),
            contexts.map((c) => c.id),
          );
        } catch (error) {
          await db.backup(currentRaw);
          return {
            status: 'confirmation-required',
            reason: error instanceof Error ? error.message : String(error),
          };
        }
        if (parsed.migrated) {
          try {
            await db.backup(currentRaw);
            await db.put(parsed.record);
          } catch (error) {
            // Source V1 stays untouched; run in memory and report like a Phase 6 write failure.
            return {
              status: 'memory-only',
              record: parsed.record,
              legacyTranslationMode: parsed.legacyTranslationMode,
              error: error instanceof Error ? error.message : String(error),
            };
          }
        }
        return {
          status: 'loaded',
          record: parsed.record,
          legacyTranslationMode: parsed.legacyTranslationMode,
        };
      } catch (error) {
        return {
          status: 'memory-only',
          record: fresh,
          legacyTranslationMode: null,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    async saveLearning(record) {
      await (await factory()).put(record);
    },
    async createFreshLearningAfterConfirmation() {
      const db = await factory();
      if (currentRaw !== undefined) await db.backup(currentRaw);
      const fresh = createDefaultLearningRecord();
      await db.put(fresh);
      return fresh;
    },
  };
}
