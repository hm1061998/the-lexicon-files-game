import type { ReactNode } from 'react';
import './form-controls.css';
import './folder-cover.css';

/** A manila folder cover: case label, title, handwritten tagline, content and a tab column. */
export function FolderCover({
  label,
  title,
  tagline,
  headingLevel = 1,
  className,
  tabs,
  children,
}: {
  label?: string;
  title: string;
  tagline?: string;
  headingLevel?: 1 | 2;
  className?: string;
  tabs?: ReactNode;
  children?: ReactNode;
}): JSX.Element {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  return (
    <section className={['folder-cover', className].filter(Boolean).join(' ')}>
      <div className="folder-cover__sheet">
        {label ? <p className="folder-cover__label">{label}</p> : null}
        <Heading className="folder-cover__title">{title}</Heading>
        {tagline ? <p className="folder-cover__tagline">{tagline}</p> : null}
        <div className="folder-cover__body">{children}</div>
      </div>
      {tabs}
    </section>
  );
}
