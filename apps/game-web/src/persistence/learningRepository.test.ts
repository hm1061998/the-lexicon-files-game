import { describe, expect, it } from 'vitest';
import { createLearningRepository, type LearningDatabase } from './learningRepository';
import { createDefaultLearningRecord, parseLearningRecord } from './learningMigration';

function memory(raw?: unknown) {
  let saved = raw;
  const backups: unknown[] = [];
  const db: LearningDatabase = {
    async get() {
      return saved;
    },
    async put(record) {
      saved = record;
    },
    async backup(value) {
      backups.push(value);
    },
  };
  return { db, backups, value: () => saved };
}

describe('separate learning repository', () => {
  it('returns defaults for a missing profile without writing it', async () => {
    const store = memory();
    const repo = createLearningRepository(async () => store.db);
    const result = await repo.loadLearning([], []);
    expect(result.status).toBe('missing');
    expect(store.value()).toBeUndefined();
  });

  it('backs up an invalid profile and requests confirmation without replacing raw data', async () => {
    const raw = { schemaVersion: 88, privateData: 'preserve' };
    const store = memory(raw);
    const repo = createLearningRepository(async () => store.db);
    const result = await repo.loadLearning([], []);
    expect(result.status).toBe('confirmation-required');
    expect(store.backups).toEqual([raw]);
    expect(store.value()).toBe(raw);
  });

  it('falls back to memory when IndexedDB cannot open', async () => {
    const repo = createLearningRepository(async () => {
      throw new Error('blocked');
    });
    expect(await repo.loadLearning([], [])).toMatchObject({
      status: 'memory-only',
      error: 'blocked',
    });
  });

  it('strictly parses a valid record and rejects unknown vocabulary/context progress', () => {
    const record = createDefaultLearningRecord();
    expect(parseLearningRecord(record, [], [])).toEqual(record);
    const corrupted = {
      ...record,
      profile: {
        ...record.profile,
        vocabulary: {
          ghost: {
            vocabularyId: 'ghost',
            stage: 'seen',
            encounterCount: 1,
            correctRecognitionCount: 0,
            incorrectRecognitionCount: 0,
            lastSeenAt: '2026-09-28T00:00:00.000Z',
            contextsSeen: ['unknown'],
          },
        },
      },
    };
    expect(() => parseLearningRecord(corrupted, [], [])).toThrow(
      'Invalid vocabulary context progress',
    );
  });
});
