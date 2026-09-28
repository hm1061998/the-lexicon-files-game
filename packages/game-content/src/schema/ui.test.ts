import { describe, expect, it } from 'vitest';
import { parseUiStrings } from './ui';
import { ContentValidationError } from '../loader/ContentValidationError';
import viStrings from '../../ui/vi.json';

describe('parseUiStrings', () => {
  it('accepts vi strings', () => {
    const strings = parseUiStrings(viStrings, 'ui/vi.json');
    expect(strings.objectiveHeading).toBe('Mục tiêu hiện tại');
  });

  it('provides localized bootstrap and save recovery strings', () => {
    const strings = parseUiStrings(viStrings, 'ui/vi.json');
    expect(strings.loadingGame).toBe('Đang mở hồ sơ...');
    expect(strings.saveRecoveryTitle).toBeTruthy();
    expect(strings.createFreshSave).toBeTruthy();
    expect(strings.notebook).toBe('Sổ tay điều tra');
    expect(strings.openNotebook).toBeTruthy();
  });

  it('rejects missing key', () => {
    const raw = { ...(viStrings as Record<string, unknown>) };
    delete raw.resume;
    try {
      parseUiStrings(raw, 'ui/vi.json');
      throw new Error('expected parseUiStrings to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ContentValidationError);
      const validationError = err as ContentValidationError;
      expect(validationError.issues.some((issue) => issue.includes('resume'))).toBe(true);
    }
  });

  it('rejects empty string', () => {
    const raw = { ...(viStrings as Record<string, unknown>), caseFile: '' };
    try {
      parseUiStrings(raw, 'ui/vi.json');
      throw new Error('expected parseUiStrings to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ContentValidationError);
      const validationError = err as ContentValidationError;
      expect(validationError.issues.some((issue) => issue.includes('caseFile'))).toBe(true);
    }
  });
});
