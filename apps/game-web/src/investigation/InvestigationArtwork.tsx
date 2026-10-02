import { useState } from 'react';
export function InvestigationArtwork({
  url,
  name,
  portrait = false,
}: {
  url?: string | undefined;
  name: string;
  portrait?: boolean;
}): JSX.Element {
  const [failed, setFailed] = useState<string>();
  return (
    <span
      className={
        portrait ? 'investigation-artwork investigation-portrait' : 'investigation-artwork'
      }
      aria-hidden="true"
    >
      {(!url || failed === url) && (
        <span className="artwork-fallback">
          {name
            .split(' ')
            .map((s) => s[0])
            .slice(0, 2)
            .join('')}
        </span>
      )}
      {url && failed !== url && <img src={url} alt="" onError={() => setFailed(url)} />}
    </span>
  );
}
