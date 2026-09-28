import { describe, expect, it } from 'vitest';
import { loadCaseSummary } from './loadCase';
import { ContentValidationError } from './ContentValidationError';

describe('loadCaseSummary', () => {
  it('loads case-001 summary', () => {
    const summary = loadCaseSummary('case-001');
    expect(summary.id).toBe('case-001');
    expect(summary.title).toBe('The Missing Report');
  });

  it('unknown case throws ContentValidationError', () => {
    expect(() => loadCaseSummary('case-999')).toThrow(ContentValidationError);
  });
});
