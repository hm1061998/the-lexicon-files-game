import { useId } from 'react';
import { PaperPanel } from '@lexicon/ui';
import type { UiStrings } from '@lexicon/shared-types';
import type { CaseReport } from './buildCaseReport';
import './conclusion.css';

export function CaseSummaryScreen({
  caseTitle,
  report,
  strings,
}: {
  caseTitle: string;
  report: CaseReport;
  strings: UiStrings;
}): JSX.Element {
  const headingId = useId();
  const profileHeadingId = useId();
  return (
    <div className="case-summary-overlay">
      <PaperPanel as="div" className="case-summary">
        <section aria-labelledby={headingId}>
          <p role="status" aria-live="polite" className="case-summary-stamp">
            {strings.caseClosed}
          </p>
          <h2 id={headingId}>{caseTitle}</h2>
          <h3>{strings.caseReport}</h3>
          <dl className="case-summary-metrics">
            <dt>{strings.evidenceFound}</dt>
            <dd>{`${report.evidenceFound}/${report.evidenceTotal}`}</dd>
            <dt>{strings.keyContradiction}</dt>
            <dd>
              {report.keyContradictionFound
                ? strings.keyContradictionFound
                : strings.keyContradictionMissing}
            </dd>
            <dt>{strings.peopleInterviewed}</dt>
            <dd>{`${report.peopleInterviewed}/${report.peopleTotal}`}</dd>
            <dt>{strings.listeningTask}</dt>
            <dd>
              {report.listeningTaskCompleted
                ? strings.listeningTaskComplete
                : strings.listeningTaskIncomplete}
            </dd>
          </dl>
        </section>
        <section aria-labelledby={profileHeadingId}>
          <h3 id={profileHeadingId}>{strings.overallProfile}</h3>
          <dl className="case-summary-metrics">
            <dt>{strings.vocabularyEncountered}</dt>
            <dd>{report.vocabularyEncountered}</dd>
            <dt>{strings.vocabularyMastered}</dt>
            <dd>{report.vocabularyMastered}</dd>
            <dt>{strings.listeningAccuracy}</dt>
            <dd>
              {report.listeningAccuracyPercent === null
                ? strings.noListeningData
                : `${report.listeningAccuracyPercent}%`}
            </dd>
            <dt>{strings.hintsUsed}</dt>
            <dd>{report.hintsUsed}</dd>
          </dl>
        </section>
      </PaperPanel>
    </div>
  );
}
