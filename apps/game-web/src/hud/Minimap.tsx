import { useMemo } from 'react';
import { PaperSheet } from '@lexicon/ui';
import type { UiStrings } from '@lexicon/shared-types';
import { useGameStore } from '../state/GameStoreContext';
import { buildMinimapModel } from './minimapModel';
import './minimap.css';

const ROOM_DOT_R = 34;

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
        <span className="hud-panel-launcher-text">{strings.minimapTitle}</span>
      </button>
    );
  }
  if (!model || !scene) return null;
  const [vx, vy, vw, vh] = model.viewBox.split(' ').map(Number) as [number, number, number, number];
  const placement = (point: { x: number; y: number }) => ({
    left: `${((point.x - vx) / vw) * 100}%`,
    top: `${((point.y - vy) / vh) * 100}%`,
  });
  return (
    <PaperSheet tape="tl" tilt={0.6} className="hud-minimap">
      <button
        className="hud-panel-collapse"
        type="button"
        aria-expanded={true}
        aria-label={strings.collapseMap}
        onClick={toggle}
      />
      <div className="minimap-drawing">
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
        </svg>
        <div className="minimap-overlay" aria-hidden="true">
          {model.markers.map((marker) => (
            <span
              key={marker.id}
              className={`minimap-marker minimap-marker-${marker.kind}`}
              style={placement(marker)}
            />
          ))}
          {model.player && (
            <span
              className="minimap-player"
              data-world-x={model.player.x}
              data-world-y={model.player.y}
              style={placement(model.player)}
            />
          )}
        </div>
      </div>
      <p className="minimap-label visually-hidden">{strings.minimapTitle}</p>
    </PaperSheet>
  );
}
