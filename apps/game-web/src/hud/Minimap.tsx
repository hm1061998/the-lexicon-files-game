import { useMemo } from 'react';
import { PaperPanel } from '@lexicon/ui';
import type { UiStrings } from '@lexicon/shared-types';
import { useGameStore } from '../state/GameStoreContext';
import { buildMinimapModel, type MinimapMarker } from './minimapModel';
import './minimap.css';

// Marker sizes are in world units: the map is ~2400 units wide drawn at ~200 px.
const MARKER_R = 88;
const PLAYER_R = 84;

function Marker({ marker }: { marker: MinimapMarker }): JSX.Element {
  const { x, y, kind } = marker;
  const className = `minimap-marker minimap-marker-${kind}`;
  if (kind === 'door') {
    return (
      <rect
        className={className}
        x={x - MARKER_R * 0.75}
        y={y - MARKER_R * 0.75}
        width={MARKER_R * 1.5}
        height={MARKER_R * 1.5}
      />
    );
  }
  if (kind === 'npc') return <circle className={className} cx={x} cy={y} r={MARKER_R * 0.7} />;
  const points = `${x},${y - MARKER_R} ${x + MARKER_R},${y} ${x},${y + MARKER_R} ${x - MARKER_R},${y}`;
  return <polygon className={className} points={points} />;
}

export function Minimap({ strings }: { strings: UiStrings }): JSX.Element | null {
  const visible = useGameStore((state) => state.minimapVisible);
  const scene = useGameStore((state) =>
    state.caseDefinition.scenes.find(({ id }) => id === state.activeSceneId),
  );
  const playerPosition = useGameStore((state) => state.playerPosition);
  const model = useMemo(
    () => (scene ? buildMinimapModel(scene, playerPosition) : null),
    [scene, playerPosition],
  );
  if (!visible || !model || !scene) return null;
  const b = scene.worldBounds;

  return (
    <PaperPanel className="hud-minimap">
      <svg
        className="minimap-svg"
        viewBox={model.viewBox}
        role="img"
        aria-label={strings.minimapTitle}
      >
        <rect className="minimap-floor" x={b.x} y={b.y} width={b.width} height={b.height} />
        {model.solids.map((r, index) => (
          <rect
            key={index}
            className="minimap-solid"
            x={r.x}
            y={r.y}
            width={r.width}
            height={r.height}
          />
        ))}
        {model.markers.map((marker) => (
          <Marker key={marker.id} marker={marker} />
        ))}
        {model.player && (
          <circle className="minimap-player" cx={model.player.x} cy={model.player.y} r={PLAYER_R} />
        )}
      </svg>
      <p className="minimap-label">{strings.minimapTitle}</p>
    </PaperPanel>
  );
}
