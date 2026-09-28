import { describe, expect, it } from 'vitest';
import { parseCaseSummary } from './case';
import { ContentValidationError } from '../loader/ContentValidationError';
import caseRaw from '../../cases/case-001/case.json';
import objectivesRaw from '../../cases/case-001/objectives.json';

describe('parseCaseSummary', () => {
  it('accepts case-001', () => {
    const summary = parseCaseSummary(caseRaw, objectivesRaw, 'case-001/case.json');
    expect(summary.title).toBe('The Missing Report');
    expect(summary.evidenceTotal).toBe(5);
    expect(summary.initialObjective.text).toBe('Tìm hiểu điều gì đã xảy ra với bản báo cáo');
  });

  it('rejects unknown initialObjectiveId', () => {
    const badCase = { ...caseRaw, initialObjectiveId: 'does_not_exist' };
    try {
      parseCaseSummary(badCase, objectivesRaw, 'case-001/case.json');
      throw new Error('expected parseCaseSummary to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ContentValidationError);
      const validationError = err as ContentValidationError;
      expect(validationError.issues.some((issue) => issue.includes('initialObjectiveId'))).toBe(
        true,
      );
    }
  });

  it('rejects negative evidenceTotal', () => {
    const badCase = { ...caseRaw, evidenceTotal: -1 };
    try {
      parseCaseSummary(badCase, objectivesRaw, 'case-001/case.json');
      throw new Error('expected parseCaseSummary to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ContentValidationError);
      const validationError = err as ContentValidationError;
      expect(validationError.issues.some((issue) => issue.includes('evidenceTotal'))).toBe(true);
    }
  });

  it('rejects non-integer evidenceTotal', () => {
    const badCase = { ...caseRaw, evidenceTotal: 1.5 };
    try {
      parseCaseSummary(badCase, objectivesRaw, 'case-001/case.json');
      throw new Error('expected parseCaseSummary to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ContentValidationError);
      const validationError = err as ContentValidationError;
      expect(validationError.issues.some((issue) => issue.includes('evidenceTotal'))).toBe(true);
    }
  });
});
