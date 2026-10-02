import { describe, expect, it, vi } from 'vitest';
import { createLearningRepository, type LearningDatabase } from './learningRepository';
import { createDefaultLearningRecord, parseLearningRecord } from './learningMigration';

function legacyBase() {
  const { onboardingSeen: _onboardingSeen, ...rest } = createDefaultLearningRecord();
  return rest;
}

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
    async listBackups() {
      return backups;
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
    expect(parseLearningRecord(record, [], [])).toEqual({
      record,
      legacyTranslationMode: null,
      migrated: false,
    });
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

  it('normalizes schema v1 profiles without listening counters and preserves saved settings', () => {
    const record = legacyBase();
    const { listening, ...legacyProfile } = record.profile;
    expect(listening).toBeDefined();
    const legacy = {
      ...record,
      schemaVersion: 1,
      translationMode: 'Beginner',
      vocabularyTutorialSeen: true,
      profile: {
        ...legacyProfile,
        vocabulary: {
          leave: {
            vocabularyId: 'leave',
            stage: 'seen',
            encounterCount: 1,
            correctRecognitionCount: 0,
            incorrectRecognitionCount: 0,
            lastSeenAt: '2026-09-28T00:00:00.000Z',
            contextsSeen: ['dialogue:anna:entry:text'],
          },
        },
      },
    };
    const parsed = parseLearningRecord(legacy, ['leave'], ['dialogue:anna:entry:text']);
    expect(parsed).toMatchObject({
      legacyTranslationMode: 'Beginner',
      migrated: true,
      record: {
        schemaVersion: 3,
        vocabularyTutorialSeen: true,
        profile: {
          vocabulary: { leave: { stage: 'seen' } },
          listening: {
            subtitleUses: 0,
            correctAnswers: 0,
            incorrectAnswers: 0,
            totalTimeToExtractFactMs: 0,
            timedFacts: 0,
          },
        },
      },
    });
    expect(parsed.record).not.toHaveProperty('translationMode');
  });

  it('rejects malformed listening counters', () => {
    const record = createDefaultLearningRecord();
    const corrupted = {
      ...record,
      profile: { ...record.profile, listening: { ...record.profile.listening, timedFacts: -1 } },
    };
    expect(() => parseLearningRecord(corrupted, [], [])).toThrow(
      'Invalid timedFacts listening counter',
    );
  });

  it('rejects encounter counts that do not match unique seen contexts', () => {
    const record = createDefaultLearningRecord();
    const inconsistent = {
      ...record,
      profile: {
        ...record.profile,
        vocabulary: {
          leave: {
            vocabularyId: 'leave',
            stage: 'seen',
            encounterCount: 2,
            correctRecognitionCount: 0,
            incorrectRecognitionCount: 0,
            lastSeenAt: '2026-09-28T00:00:00.000Z',
            contextsSeen: ['dialogue:anna:entry:text'],
          },
        },
      },
    };
    expect(() =>
      parseLearningRecord(inconsistent, ['leave'], ['dialogue:anna:entry:text']),
    ).toThrow('Invalid vocabulary progress values');
  });

  it('rejects a V2 record that still carries translationMode', () => {
    const record = { ...createDefaultLearningRecord(), translationMode: 'Learning' };
    expect(() => parseLearningRecord(record, [], [])).toThrow('Unexpected learning record fields');
  });

  it('migrates V1 to V2, backing up the raw V1 before writing V2', async () => {
    const v1 = { ...legacyBase(), schemaVersion: 1, translationMode: 'Immersion' };
    const order: string[] = [];
    const backupsList: unknown[] = [];
    let saved: unknown = v1;
    const db: LearningDatabase = {
      async get() {
        return saved;
      },
      async put(record) {
        order.push('put');
        saved = record;
      },
      async backup(raw) {
        order.push(raw === v1 ? 'backup-v1' : 'backup-other');
        backupsList.push(raw);
      },
      async listBackups() {
        return backupsList;
      },
    };
    const result = await createLearningRepository(async () => db).loadLearning([], []);
    expect(order).toEqual(['backup-v1', 'put']);
    expect(result).toMatchObject({ status: 'loaded', legacyTranslationMode: 'Immersion' });
    expect(saved).not.toHaveProperty('translationMode');
    expect(saved).toMatchObject({ schemaVersion: 3 });
    const again = await createLearningRepository(async () => db).loadLearning([], []);
    expect(again).toMatchObject({ status: 'loaded', legacyTranslationMode: null });
    expect(order).toEqual(['backup-v1', 'put']);
  });

  it('keeps the V1 source and reports memory-only when the migration write fails', async () => {
    const v1 = { ...legacyBase(), schemaVersion: 1, translationMode: 'Beginner' };
    const saved: unknown = v1;
    const db: LearningDatabase = {
      async get() {
        return saved;
      },
      async put() {
        throw new Error('quota');
      },
      async backup() {},
      async listBackups() {
        return [];
      },
    };
    const result = await createLearningRepository(async () => db).loadLearning([], []);
    expect(result).toMatchObject({
      status: 'memory-only',
      error: 'quota',
      legacyTranslationMode: 'Beginner',
    });
    expect(saved).toBe(v1);
  });

  it('keeps memory-only and does not put when the migration backup fails', async () => {
    const v1 = { ...legacyBase(), schemaVersion: 1, translationMode: 'Beginner' };
    const put = vi.fn(async () => undefined);
    const db: LearningDatabase = {
      get: async () => v1,
      put,
      backup: async () => {
        throw new Error('backup denied');
      },
      listBackups: async () => [],
    };
    const result = await createLearningRepository(async () => db).loadLearning([], []);
    expect(result).toMatchObject({
      status: 'memory-only',
      error: 'backup denied',
      legacyTranslationMode: 'Beginner',
    });
    expect(put).not.toHaveBeenCalled();
  });

  it('returns the legacy mode again on a second load of the same repository', async () => {
    const v1 = { ...legacyBase(), schemaVersion: 1, translationMode: 'Immersion' };
    let saved: unknown = v1;
    const db: LearningDatabase = {
      get: async () => saved,
      put: async (record) => {
        saved = record;
      },
      backup: async () => undefined,
      listBackups: async () => [],
    };
    const repo = createLearningRepository(async () => db);
    await repo.loadLearning([], []);
    expect(await repo.loadLearning([], [])).toMatchObject({ legacyTranslationMode: 'Immersion' });
  });

  it('finds the newest valid V1 translation mode in backups', async () => {
    const old = { schemaVersion: 1, translationMode: 'Beginner' };
    const newest = { schemaVersion: 1, translationMode: 'Immersion' };
    const db: LearningDatabase = {
      get: async () => undefined,
      put: async () => undefined,
      backup: async () => undefined,
      listBackups: async () => [old, newest, { schemaVersion: 1, translationMode: 'Bogus' }, 7],
    };
    const repo = createLearningRepository(async () => db);
    expect(await repo.findLegacyTranslationMode()).toBe('Immersion');
    const empty = createLearningRepository(async () => ({ ...db, listBackups: async () => [] }));
    expect(await empty.findLegacyTranslationMode()).toBeNull();
  });
});
