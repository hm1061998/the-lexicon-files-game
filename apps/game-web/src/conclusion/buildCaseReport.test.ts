import { describe, expect, it } from 'vitest';
import { loadCaseDefinition } from '@lexicon/game-content';
import { createCaseState } from '@lexicon/game-core';
import { createInitialLanguageProfile } from '@lexicon/learning-engine';
import type { LanguageProfile, VocabularyProgress } from '@lexicon/shared-types';
import { buildCaseReport } from './buildCaseReport';

const definition = loadCaseDefinition('case-001');

function progress(vocabularyId: string, changes: Partial<VocabularyProgress>): VocabularyProgress {
  return {
    vocabularyId,
    stage: 'seen',
    encounterCount: 1,
    correctRecognitionCount: 0,
    incorrectRecognitionCount: 0,
    lastSeenAt: '2026-09-29T00:00:00.000Z',
    contextsSeen: [],
    ...changes,
  };
}

function profileWith(changes: Partial<LanguageProfile>): LanguageProfile {
  return { ...createInitialLanguageProfile(), ...changes };
}

describe('buildCaseReport', () => {
  it('reads case progress from collected IDs and completion flags', () => {
    const state = {
      ...createCaseState(definition),
      evidenceIds: ['meeting_minutes', 'security_access_log'],
      contradictionIds: definition.contradictions.map(({ id }) => id),
      flags: {
        anna_interviewed: true,
        david_interviewed: true,
        leo_phone_recording_understood: true,
      },
    };
    const report = buildCaseReport(definition, state, createInitialLanguageProfile());
    expect(report).toMatchObject({
      evidenceFound: 2,
      evidenceTotal: 5,
      keyContradictionFound: true,
      peopleInterviewed: 2,
      peopleTotal: 3,
      listeningTaskCompleted: true,
    });
  });

  it('reports a missing key contradiction and an incomplete listening task', () => {
    const report = buildCaseReport(
      definition,
      createCaseState(definition),
      createInitialLanguageProfile(),
    );
    expect(report.keyContradictionFound).toBe(false);
    expect(report.listeningTaskCompleted).toBe(false);
    expect(report.peopleInterviewed).toBe(0);
    expect(report.evidenceFound).toBe(0);
  });

  it('never reports a key contradiction for a case that declares none', () => {
    const report = buildCaseReport(
      { ...definition, contradictions: [], listeningTasks: [] },
      createCaseState(definition),
      createInitialLanguageProfile(),
    );
    expect(report.keyContradictionFound).toBe(false);
    expect(report.listeningTaskCompleted).toBe(false);
  });

  it('counts only encountered vocabulary and mastered entries from the whole profile', () => {
    const profile = profileWith({
      vocabulary: {
        a: progress('a', { encounterCount: 3, stage: 'mastered' }),
        b: progress('b', { encounterCount: 1, stage: 'recognized' }),
        c: progress('c', { encounterCount: 0, stage: 'unknown' }),
      },
      assistance: { translations: 4, hints: 2, transcriptOpens: 1, audioReplays: 0 },
    });
    const report = buildCaseReport(definition, createCaseState(definition), profile);
    expect(report.vocabularyEncountered).toBe(2);
    expect(report.vocabularyMastered).toBe(1);
    expect(report.hintsUsed).toBe(2);
  });

  it('rounds listening accuracy to a whole percent', () => {
    const base = createInitialLanguageProfile();
    const profile = profileWith({
      listening: { ...base.listening, correctAnswers: 2, incorrectAnswers: 1 },
    });
    expect(
      buildCaseReport(definition, createCaseState(definition), profile).listeningAccuracyPercent,
    ).toBe(67);
  });

  it('reports no listening accuracy when the profile has no answers yet', () => {
    expect(
      buildCaseReport(definition, createCaseState(definition), createInitialLanguageProfile())
        .listeningAccuracyPercent,
    ).toBeNull();
  });
});
