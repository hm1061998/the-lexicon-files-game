import { DeskBackdrop, Stamp, PaperButton } from '@lexicon/ui';
import type { UiStrings } from '@lexicon/shared-types';
import type { CaseCardModel } from './caseCardModel';
import './case-picker.css';

export function CasePicker({
  strings,
  cards,
  onSelect,
}: {
  strings: UiStrings;
  cards: readonly CaseCardModel[];
  onSelect: (caseId: string) => void;
}): JSX.Element {
  const focusId = cards.find(({ recommended }) => recommended)?.id ?? cards[0]?.id;
  return (
    <main className="title-screen case-picker-screen">
      <DeskBackdrop>
        <section className="case-picker" aria-labelledby="case-picker-heading">
          <h1 id="case-picker-heading" className="case-picker-heading">
            {strings.titleChooseCase}
          </h1>
          <ul className="case-list">
            {cards.map((card) => (
              <li key={card.id}>
                <PaperButton
                  className="case-card"
                  autoFocus={card.id === focusId}
                  onClick={() => onSelect(card.id)}
                >
                  <strong className="case-card-title">{card.title}</strong>
                  {card.recommended ? (
                    <Stamp className="case-card-flag">{strings.caseRecommended}</Stamp>
                  ) : null}
                  <span className="case-card-meta">
                    {card.tierLabel} · {card.cefrLabel} · {card.minutesLabel}
                  </span>
                  <span className="case-card-summary">{card.summary}</span>
                  <span className="case-card-stats">
                    {card.stats.map(({ label, value }) => (
                      <span key={label}>
                        {label}: {value}
                      </span>
                    ))}
                  </span>
                </PaperButton>
              </li>
            ))}
          </ul>
        </section>
      </DeskBackdrop>
    </main>
  );
}
