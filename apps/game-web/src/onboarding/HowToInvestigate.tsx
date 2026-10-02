import { PaperPanel } from '@lexicon/ui';
import { ReadDocument, textBlock } from '../investigation/pagination/ReadDocument';
import type { InvestigationLearningProps } from '../investigation/RecordedStatements';

export function HowToInvestigate({
  learning,
  onClose,
}: {
  learning: InvestigationLearningProps;
  onClose: () => void;
}): JSX.Element {
  const s = learning.strings;
  const blocks = [
    textBlock('howto:controls:h', s.howToControlsHeading),
    textBlock('howto:controls:b', s.howToControlsBody),
    textBlock('howto:loop:h', s.howToLoopHeading),
    textBlock('howto:loop:b', s.howToLoopBody),
    textBlock('howto:words:h', s.howToWordsHeading),
    textBlock('howto:words:b', s.howToWordsBody),
    textBlock('howto:principles:h', s.howToPrinciplesHeading),
    textBlock('howto:principles:b', s.howToPrinciplesBody),
  ];
  return (
    <div className="pause-menu-overlay">
      <PaperPanel as="div" className="pause-menu howto">
        <div role="dialog" aria-modal="true" aria-label={s.howToTitle}>
          <h2>{s.howToTitle}</h2>
          <ReadDocument blocks={blocks} learning={learning} label={s.howToTitle} />
          <button type="button" autoFocus onClick={onClose}>
            {s.titleBack}
          </button>
        </div>
      </PaperPanel>
    </div>
  );
}
