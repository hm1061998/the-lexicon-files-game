import { PaperPanel } from '@lexicon/ui';
import type { UiStrings } from '@lexicon/shared-types';
import type { CaseCardModel } from './caseCardModel';
import './title.css';

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
    <main className="title-screen">
      <PaperPanel as="section" className="title-card case-picker">
        <h1>{strings.titleChooseCase}</h1>
        <ul className="case-list">
          {cards.map((card) => (
            <li key={card.id}>
              <button
                type="button"
                className="case-card"
                autoFocus={card.id === focusId}
                onClick={() => onSelect(card.id)}
              >
                <strong className="case-card-title">{card.title}</strong>
                {card.recommended ? (
                  <span className="case-card-flag">{strings.caseRecommended}</span>
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
              </button>
            </li>
          ))}
        </ul>
      </PaperPanel>
    </main>
  );
}
