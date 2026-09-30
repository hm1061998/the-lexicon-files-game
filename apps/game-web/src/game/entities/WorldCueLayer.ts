import Phaser from 'phaser';
import { INTERACTION_RED } from '../constants';

export type CueAnchor = { x: number; y: number; depth: number };
const MARKER_COLOR = Number.parseInt(INTERACTION_RED.slice(1), 16);

/** Small, static scene markers; the already-nearby target keeps using its existing outline. */
export class WorldCueLayer {
  private readonly markers = new Map<string, Phaser.GameObjects.Graphics>();

  get activeCount(): number {
    return this.markers.size;
  }

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly anchors: ReadonlyMap<string, CueAnchor>,
  ) {}

  sync(visibleIds: ReadonlySet<string>, nearestId: string | null, reducedMotion: boolean): void {
    void reducedMotion;
    const wanted = new Set(
      [...visibleIds].filter((id) => id !== nearestId && this.anchors.has(id)),
    );
    for (const [id, marker] of this.markers) {
      if (wanted.has(id)) continue;
      marker.destroy();
      this.markers.delete(id);
    }
    for (const id of wanted) {
      if (this.markers.has(id)) continue;
      const anchor = this.anchors.get(id)!;
      const marker = this.scene.add
        .graphics()
        .setPosition(anchor.x, anchor.y)
        .setDepth(anchor.depth);
      marker.fillStyle(MARKER_COLOR, 0.92);
      marker.lineStyle(2, 0xf2e8d5, 0.98);
      marker.fillPoints(
        [
          { x: 0, y: -8 },
          { x: 7, y: 0 },
          { x: 0, y: 8 },
          { x: -7, y: 0 },
        ],
        true,
      );
      marker.strokePoints(
        [
          { x: 0, y: -8 },
          { x: 7, y: 0 },
          { x: 0, y: 8 },
          { x: -7, y: 0 },
        ],
        true,
      );
      this.markers.set(id, marker);
    }
  }

  destroy(): void {
    for (const marker of this.markers.values()) marker.destroy();
    this.markers.clear();
  }
}
