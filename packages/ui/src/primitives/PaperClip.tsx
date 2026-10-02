import './paper-sheet.css';

/** Decorative paper clip; hidden from assistive technology. */
export function PaperClip(): JSX.Element {
  return <img className="paper-clip" src="/assets/ui/paper_clip.png" alt="" aria-hidden="true" />;
}
