import { useMemo } from 'react';
import { PaperPanel } from '@lexicon/ui';
import type { UiStrings } from '@lexicon/shared-types';
import { useGameStore } from '../state/GameStoreContext';
import { buildMinimapModel, type MinimapMarker } from './minimapModel';
import './minimap.css';

const ROOM_DOT_R = 34;

function Marker({ marker, radius }: { marker: MinimapMarker; radius: number }): JSX.Element {
  const { x, y, kind } = marker;
  const className = `minimap-marker minimap-marker-${kind}`;
  if (kind === 'door') {
    return (
      <rect
        className={className}
        x={x - radius * 0.75}
        y={y - radius * 0.75}
        width={radius * 1.5}
        height={radius * 1.5}
      />
    );
  }
  if (kind === 'npc') return <circle className={className} cx={x} cy={y} r={radius * 0.7} />;
  const points = `${x},${y - radius} ${x + radius},${y} ${x},${y + radius} ${x - radius},${y}`;
  return <polygon className={className} points={points} />;
}

export function Minimap({ strings }: { strings: UiStrings }): JSX.Element | null {
  const visible = useGameStore((state) => state.minimapVisible);
  const toggle = useGameStore((state) => state.toggleMinimap);
  const scene = useGameStore((state) =>
    state.caseDefinition.scenes.find(({ id }) => id === state.activeSceneId),
  );
  const playerPosition = useGameStore((state) => state.playerPosition);
  const model = useMemo(
    () => (scene ? buildMinimapModel(scene, playerPosition) : null),
    [scene, playerPosition],
  );
  if (!visible) {
    return (
      <button
        className="hud-panel-launcher hud-map-launcher"
        type="button"
        aria-expanded={false}
        aria-label={strings.expandMap}
        onClick={toggle}
      >
        <span aria-hidden="true">▦</span>
      </button>
    );
  }
  if (!model || !scene) return null;
  return (
    <PaperPanel className="hud-minimap">
      <button
        className="hud-panel-collapse"
        type="button"
        aria-expanded={true}
        aria-label={strings.collapseMap}
        onClick={toggle}
      >
        −
      </button>
      <svg
        className="minimap-svg"
        viewBox={model.viewBox}
        role="img"
        aria-label={
          model.currentRoomName
            ? `${strings.minimapTitle} — ${model.currentRoomName}`
            : strings.minimapTitle
        }
      >
        <polygon className="minimap-floor" points={model.floorPoints} />
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
        {model.partitions.map((r, index) => (
          <rect
            key={index}
            className="minimap-partition"
            x={r.x}
            y={r.y}
            width={r.width}
            height={r.height}
          />
        ))}
        {model.labels.map((label) => (
          <circle
            key={label.id}
            className="minimap-room"
            cx={label.x}
            cy={label.y}
            r={ROOM_DOT_R}
          />
        ))}
        {model.markers.map((marker) => (
          <Marker key={marker.id} marker={marker} radius={model.markerRadius} />
        ))}
        {model.player && (
          <circle
            className="minimap-player"
            cx={model.player.x}
            cy={model.player.y}
            r={model.playerRadius}
          />
        )}
      </svg>
      <p className="minimap-label">{strings.minimapTitle}</p>
    </PaperPanel>
  );
}
