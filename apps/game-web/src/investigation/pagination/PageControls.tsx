import type { UiStrings } from '@lexicon/shared-types';
import { InkButton } from '@lexicon/ui';
export function PageControls({
  index,
  count,
  label,
  strings,
  onChange,
}: {
  index: number;
  count: number;
  label: string;
  strings: UiStrings;
  onChange: (n: number) => void;
}) {
  return (
    <nav className="page-controls" aria-label={label}>
      <InkButton
        sfx="paper-close"
        aria-label={`${label}: ${strings.pagePrevious}`}
        disabled={index <= 0}
        onClick={() => onChange(index - 1)}
      >
        ‹
      </InkButton>
      <span className="page-controls__label" aria-live="polite">
        {strings.pagePosition
          .replace('{current}', String(index + 1))
          .replace('{total}', String(Math.max(1, count)))}
      </span>
      <InkButton
        sfx="paper-open"
        aria-label={`${label}: ${strings.pageNext}`}
        disabled={index >= count - 1}
        onClick={() => onChange(index + 1)}
      >
        ›
      </InkButton>
    </nav>
  );
}
