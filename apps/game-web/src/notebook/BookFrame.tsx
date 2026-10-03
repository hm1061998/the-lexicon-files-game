import type { CSSProperties, ReactNode } from 'react';
import './book-frame.css';

const COILS = 7;

/** One spiral loop: it goes through a punched hole in each leaf and over the gutter between them. */
function BookCoil({ index }: { index: number }): JSX.Element {
  return (
    <svg
      className="book-coil"
      style={{ '--coil': index } as CSSProperties}
      viewBox="0 0 112 46"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="24" cy="23" r="7" fill="#1c1611" />
      <circle cx="24" cy="21.5" r="5.2" fill="#0d0a08" />
      <circle cx="88" cy="23" r="7" fill="#1c1611" />
      <circle cx="88" cy="21.5" r="5.2" fill="#0d0a08" />
      <path d="M24 29 C 34 44, 78 44, 88 29" stroke="rgba(0,0,0,.35)" strokeWidth="6" fill="none" />
      <path
        d="M24 23 C 32 36, 80 36, 88 23"
        stroke="#5d5448"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M24 23 C 32 6, 80 6, 88 23"
        stroke="#a79d8a"
        strokeWidth="5.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M27 19 C 36 9, 76 9, 85 19"
        stroke="#efe9db"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        opacity=".85"
      />
    </svg>
  );
}

/**
 * The notebook as an object: a dark stitched cover, two stacked leaves with a curved gutter and spiral
 * coils, index tabs glued to the right edge. The cover and the leaves are decoration behind the content;
 * `header` and `children` are laid over the leaves in reading order, `rightEdge` hangs off the right.
 */
export function BookFrame({
  header,
  rightEdge,
  children,
}: {
  header: ReactNode;
  rightEdge: ReactNode;
  children: ReactNode;
}): JSX.Element {
  return (
    <div className="book-frame">
      <div className="book-cover" aria-hidden="true">
        <div className="book-leaves">
          <div className="book-leaf book-leaf--left" />
          <div className="book-crease" />
          <div className="book-leaf book-leaf--right" />
        </div>
        {Array.from({ length: COILS }, (_, i) => (
          <BookCoil index={i} key={i} />
        ))}
      </div>
      <div className="book-slot book-slot--header">{header}</div>
      <div className="book-slot book-slot--edge">{rightEdge}</div>
      <div className="book-slot book-slot--content">{children}</div>
    </div>
  );
}
