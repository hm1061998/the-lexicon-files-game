import { useState } from 'react';
import './portrait.css';

/** At most two capital letters from a name; the stand-in when a portrait is missing. */
export function initialsOf(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join('');
  return letters || '?';
}

/**
 * A photo pinned to the file: the NPC portrait, or an initials card when it is missing or fails to load.
 * Decorative, so it has no alt text (the speaker's name is read from the heading).
 */
export function Portrait({
  npcName,
  src,
  reducedMotion,
}: {
  npcName: string;
  src?: string | undefined;
  reducedMotion: boolean;
}): JSX.Element {
  const [failed, setFailed] = useState<string | null>(null);
  const showImage = src !== undefined && failed !== src;
  const classes = [
    'portrait',
    showImage ? undefined : 'portrait--initials',
    reducedMotion ? 'portrait--still' : undefined,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <span className={classes} aria-hidden="true">
      {showImage ? (
        <img src={src} alt="" onError={() => setFailed(src)} />
      ) : (
        <span className="portrait__initials">{initialsOf(npcName)}</span>
      )}
    </span>
  );
}
