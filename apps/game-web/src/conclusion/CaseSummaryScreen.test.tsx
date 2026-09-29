import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { loadUiStrings } from '@lexicon/game-content';
import { CaseSummaryScreen } from './CaseSummaryScreen';
import type { CaseReport } from './buildCaseReport';

const strings = loadUiStrings('vi');
const report: CaseReport = {
  evidenceFound: 5,
  evidenceTotal: 5,
  keyContradictionFound: true,
  peopleInterviewed: 3,
  peopleTotal: 3,
  listeningTaskCompleted: true,
  vocabularyEncountered: 18,
  vocabularyMastered: 4,
  listeningAccuracyPercent: 80,
  hintsUsed: 2,
};

function render(value: CaseReport, title = 'The Missing Report') {
  return renderToString(<CaseSummaryScreen caseTitle={title} report={value} strings={strings} />);
}

describe('CaseSummaryScreen', () => {
  it('announces the closed case and shows the case metrics', () => {
    const html = render(report);
    expect(html).toContain('role="status"');
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain(strings.caseClosed);
    expect(html).toContain('The Missing Report');
    expect(html).toContain('5/5');
    expect(html).toContain('3/3');
    expect(html).toContain(strings.keyContradictionFound);
    expect(html).toContain(strings.listeningTaskComplete);
  });

  it('labels learning metrics as profile-wide and shows their values', () => {
    const html = render(report);
    expect(html).toContain(strings.overallProfile);
    expect(html).toContain(strings.vocabularyEncountered);
    expect(html).toContain('>18<');
    expect(html).toContain(strings.vocabularyMastered);
    expect(html).toContain('80%');
    expect(html).toContain(strings.hintsUsed);
  });

  it('shows the no-data state instead of 0% when there are no listening answers', () => {
    const html = render({
      ...report,
      listeningAccuracyPercent: null,
      keyContradictionFound: false,
      listeningTaskCompleted: false,
    });
    expect(html).toContain(strings.noListeningData);
    expect(html).not.toContain('0%');
    expect(html).toContain(strings.keyContradictionMissing);
    expect(html).toContain(strings.listeningTaskIncomplete);
  });
});
