import { PaperPanel } from '@lexicon/ui';
import type { InvestigationLearningProps } from '../investigation/RecordedStatements';

/** Plain, scrollable text: the paginated reader needs a fixed page box that this overlay has no use for. */
export function HowToInvestigate({
  learning,
  onClose,
}: {
  learning: InvestigationLearningProps;
  onClose: () => void;
}): JSX.Element {
  const s = learning.strings;
  const sections = [
    [s.howToControlsHeading, s.howToControlsBody],
    [s.howToLoopHeading, s.howToLoopBody],
    [s.howToWordsHeading, s.howToWordsBody],
    [s.howToPrinciplesHeading, s.howToPrinciplesBody],
  ] as const;
  return (
    <div className="pause-menu-overlay">
      <PaperPanel as="div" className="pause-menu howto">
        <div role="dialog" aria-modal="true" aria-label={s.howToTitle}>
          <h2>{s.howToTitle}</h2>
          <div className="howto-body">
            {sections.map(([heading, body]) => (
              <section key={heading}>
                <h3>{heading}</h3>
                <p>{body}</p>
              </section>
            ))}
          </div>
          <button type="button" autoFocus onClick={onClose}>
            {s.titleBack}
          </button>
        </div>
      </PaperPanel>
    </div>
  );
}
