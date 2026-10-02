import { describe, expect, it } from 'vitest';
import { createInitialLanguageProfile } from '@lexicon/learning-engine';
import { allOnboardingSeen } from '../onboarding/onboardingTypes';
import { createDefaultLearningRecord, parseLearningRecord } from './learningMigration';

const progress = {
  leave: {
    vocabularyId: 'leave',
    stage: 'seen',
    encounterCount: 1,
    correctRecognitionCount: 0,
    incorrectRecognitionCount: 0,
    lastSeenAt: '2026-09-28T00:00:00.000Z',
    contextsSeen: ['dialogue:anna:entry:text'],
  },
};
const base = (extra: Record<string, unknown> = {}) => ({
  profile: createInitialLanguageProfile(),
  vocabularyTutorialSeen: false,
  updatedAt: 1,
  ...extra,
});
const v1 = (extra: Record<string, unknown> = {}) =>
  base({ schemaVersion: 1, translationMode: 'Beginner', ...extra });
const v2 = (extra: Record<string, unknown> = {}) => base({ schemaVersion: 2, ...extra });
const v3 = (extra: Record<string, unknown> = {}) =>
  base({ schemaVersion: 3, onboardingSeen: allOnboardingSeen(false), ...extra });
const withProgress = (r: ReturnType<typeof v2>) => ({
  ...r,
  profile: { ...r.profile, vocabulary: progress },
});
const parse = (raw: unknown) => parseLearningRecord(raw, ['leave'], ['dialogue:anna:entry:text']);

describe('learning record V3 onboarding flags', () => {
  it('creates new records at V3 with every hint unseen', () => {
    const record = createDefaultLearningRecord();
    expect(record.schemaVersion).toBe(3);
    expect(record.onboardingSeen).toEqual(allOnboardingSeen(false));
  });
  it('migrates a fresh V2 player to unseen hints and marks it migrated', () => {
    const parsed = parse(v2());
    expect(parsed.migrated).toBe(true);
    expect(parsed.record).toMatchObject({
      schemaVersion: 3,
      onboardingSeen: allOnboardingSeen(false),
    });
  });
  it('treats a V2 player who saw the vocabulary tutorial as having seen every hint', () => {
    expect(parse(v2({ vocabularyTutorialSeen: true })).record.onboardingSeen).toEqual(
      allOnboardingSeen(true),
    );
  });
  it('treats a V2 player with vocabulary progress as having seen every hint', () => {
    expect(parse(withProgress(v2())).record.onboardingSeen).toEqual(allOnboardingSeen(true));
  });
  it('applies the same rule to V1 and keeps its legacy translation mode', () => {
    const parsed = parse(withProgress(v1()));
    expect(parsed.legacyTranslationMode).toBe('Beginner');
    expect(parsed.record.onboardingSeen).toEqual(allOnboardingSeen(true));
    expect(parse(v1()).record.onboardingSeen).toEqual(allOnboardingSeen(false));
  });
  it('round-trips V3 without migrating', () => {
    const raw = v3({ onboardingSeen: { ...allOnboardingSeen(false), move: true } });
    const parsed = parse(raw);
    expect(parsed.migrated).toBe(false);
    expect(parsed.record).toMatchObject({ schemaVersion: 3, onboardingSeen: raw.onboardingSeen });
  });
  it('rejects malformed onboardingSeen on V3', () => {
    const seen = allOnboardingSeen(false);
    const { board: _board, ...missing } = seen;
    void _board;
    expect(() => parse(v3({ onboardingSeen: missing }))).toThrow();
    expect(() => parse(v3({ onboardingSeen: { ...seen, extra: true } }))).toThrow();
    expect(() => parse(v3({ onboardingSeen: { ...seen, move: 'yes' } }))).toThrow();
    expect(() => parse(v3({ onboardingSeen: undefined }))).toThrow();
  });
  it('rejects unknown fields on V3 and onboardingSeen on older versions', () => {
    expect(() => parse(v3({ surprise: 1 }))).toThrow('Unexpected learning record fields');
    expect(() => parse(v2({ onboardingSeen: allOnboardingSeen(false) }))).toThrow(
      'Unexpected learning record fields',
    );
    expect(() => parse(v1({ onboardingSeen: allOnboardingSeen(false) }))).toThrow(
      'Unexpected learning record fields',
    );
  });
});
