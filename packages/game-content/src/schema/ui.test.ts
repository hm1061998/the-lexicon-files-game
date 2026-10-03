import { describe, expect, it } from 'vitest';
import { parseUiStrings } from './ui';
import { ContentValidationError } from '../loader/ContentValidationError';
import viStrings from '../../ui/vi.json';

describe('parseUiStrings', () => {
  it('requires pagination labels and a readable current/total template', () => {
    const strings = parseUiStrings(viStrings, 'ui/vi.json') as unknown as Record<string, string>;
    expect(strings.pagePosition).toContain('{current}');
    expect(strings.pagePosition).toContain('{total}');
    expect(() => parseUiStrings({ ...viStrings, pagePrevious: undefined }, 'ui/vi.json')).toThrow(
      'pagePrevious',
    );
  });
  it('provides labels for the separate deduction board and readable notebook pages', () => {
    const strings = parseUiStrings(viStrings, 'ui/vi.json') as unknown as Record<string, string>;
    for (const key of [
      'deductionBoard',
      'openDeductionBoard',
      'openNotebookFromBoard',
      'notebookPeopleHeading',
      'notebookEvidenceHeading',
      'notebookVocabularyHeading',
      'notebookVocabularyExamples',
      'notebookVocabularySources',
      'notebookRelatedPeople',
      'deductionFactsHeading',
      'deductionCluesHeading',
      'deductionInstructions',
      'deductionClearSelection',
      'deductionRelationships',
      'vocabularyStageUnknown',
      'vocabularyStageRecognized',
      'vocabularyStageUnderstood',
      'vocabularyStageUsed',
      'vocabularyStageMastered',
    ])
      expect(strings[key]?.length).toBeGreaterThan(0);
  });
  it('rejects an empty board label with a readable content error', () => {
    expect(() => parseUiStrings({ ...viStrings, deductionBoard: '' }, 'ui/vi.json')).toThrow(
      'deductionBoard',
    );
  });
  it('provides notebook statement and interview status labels', () => {
    const strings = parseUiStrings(viStrings, 'ui/vi.json');
    expect(strings.notebookStatementsHeading).toBe('Lời khai đã ghi nhận');
    expect(strings.notebookInterviewInProgress).toBe('Đang phỏng vấn');
    expect(strings.notebookInterviewComplete).toBe('Đã phỏng vấn xong');
  });

  it.each([
    'notebookStatementsHeading',
    'notebookInterviewInProgress',
    'notebookInterviewComplete',
  ])('requires a nonempty %s label', (key) => {
    expect(() => parseUiStrings({ ...viStrings, [key]: '' }, 'ui/vi.json')).toThrow(key);
  });
  it('accepts vi strings', () => {
    const strings = parseUiStrings(viStrings, 'ui/vi.json');
    expect(strings.objectiveHeading).toBe('Mục tiêu hiện tại');
  });

  it('provides settings strings', () => {
    const strings = parseUiStrings(viStrings, 'ui/vi.json');
    expect(strings.settingsVolume).toBe('Âm lượng');
    expect(strings.settingsSubtitles).toBe('Phụ đề bản ghi');
    expect(strings.settingsSubtitlesAuto).toBe('Theo chế độ dịch');
    expect(strings.settingsSubtitlesOn).toBe('Luôn hiện');
    expect(strings.settingsSubtitlesOff).toBe('Tắt');
    expect(strings.settingsReducedMotion).toBe('Giảm chuyển động');
    expect(strings.settingsTextSpeed).toBe('Tốc độ chữ');
    expect(strings.settingsUiSounds).toBe('Âm thanh giao diện');
    expect(strings.settingsRecovered).toContain('khôi phục');
    expect(strings.settingsUnavailable).toContain('phiên này');
  });

  it('provides localized bootstrap and save recovery strings', () => {
    const strings = parseUiStrings(viStrings, 'ui/vi.json');
    expect(strings.loadingGame).toBe('Đang mở hồ sơ...');
    expect(strings.saveRecoveryTitle).toBeTruthy();
    expect(strings.createFreshSave).toBeTruthy();
    expect(strings.notebook).toBe('Sổ tay điều tra');
    expect(strings.openNotebook).toBeTruthy();
    expect(strings.minimapTitle).toBe('Bản đồ nhỏ');
    expect(strings.toggleMap).toBe('Bản đồ');
    expect(strings.move).toBe('Di chuyển: W lên, A trái, S xuống, D phải');
  });

  it('provides localized timeline and contradiction controls and feedback', () => {
    const strings = parseUiStrings(viStrings, 'ui/vi.json');
    expect(strings.timeline).toBe('Dòng thời gian');
    expect(strings.timelineEmpty).toBeTruthy();
    expect(strings.timelineSelectEvent).toBeTruthy();
    expect(strings.timelineSelectSlot).toBeTruthy();
    expect(strings.timelinePlace).toBeTruthy();
    expect(strings.timelineMismatch).toBe('Something in the timeline is inconsistent.');
    expect(strings.contradictionSelectFacts).toBeTruthy();
    expect(strings.contradictionSubmit).toBeTruthy();
    expect(strings.contradictionMismatch).toBe("This interpretation doesn't match the evidence.");
    expect(strings.conclusionMismatch).toBe(
      "The evidence doesn't fully support this conclusion. Review the timeline.",
    );
    expect(strings.conclusion).toBe('Kết luận');
    expect(strings.caseClosed).toBe('CASE CLOSED');
    expect(strings.evidenceReview).toBe('Xem lại');
    expect(strings.overallProfile).toContain('toàn hồ sơ');
    expect(strings.noListeningData.length).toBeGreaterThan(0);
    expect(strings.conclusionSubmit.length).toBeGreaterThan(0);
    expect(strings.conclusionPrompt.length).toBeGreaterThan(0);
    expect(strings.conclusionUnavailable.length).toBeGreaterThan(0);
    expect(strings.contradictionFound).toBeTruthy();
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

  it.each([
    'titleGame',
    'titleTagline',
    'titleContinue',
    'titleNewCase',
    'titleHowTo',
    'titleSettings',
    'titleBack',
    'newCaseConfirmTitle',
    'newCaseConfirmBody',
    'newCaseConfirmAccept',
    'supportTitle',
    'supportBeginnerHint',
    'supportLearningHint',
    'supportImmersionHint',
    'supportUseDefault',
    'briefingTitle',
    'briefingAccept',
    'briefingStamp',
    'coachMove',
    'coachInteract',
    'coachNotebook',
    'coachBoard',
    'coachDismiss',
    'howToTitle',
    'howToControlsHeading',
    'howToControlsBody',
    'howToLoopHeading',
    'howToLoopBody',
    'howToWordsHeading',
    'howToWordsBody',
    'howToPrinciplesHeading',
    'howToPrinciplesBody',
    'pauseHowTo',
  ])('requires a nonempty onboarding label %s', (key) => {
    const strings = parseUiStrings(viStrings, 'ui/vi.json') as unknown as Record<string, string>;
    expect(strings[key]?.length).toBeGreaterThan(0);
    expect(() => parseUiStrings({ ...viStrings, [key]: '' }, 'ui/vi.json')).toThrow(key);
  });
});
