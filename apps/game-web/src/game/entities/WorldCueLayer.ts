import Phaser from 'phaser';
import { INTERACTION_RED } from '../constants';
import {
  OFFSCREEN_MARGIN,
  OFFSCREEN_MAX,
  offscreenCues,
  type HudInsetsLike,
} from '../systems/offscreenCues';

export type CueAnchor = {
  x: number;
  y: number;
  depth: number;
  /** Where the object stands on the floor; the ink ripple is drawn here. */
  floor?: { x: number; y: number };
};
const MARKER_COLOR = Number.parseInt(INTERACTION_RED.slice(1), 16);
const CREAM = 0xf2e8d5;
const RIPPLE_KEY = 'tex_evidence_ripple';
const FLOAT_PX = 4;
const FLOAT_HALF_CYCLE_MS = 500; // 1000ms full cycle
const RIPPLE_CYCLE_MS = 2400;
const POINTER_DEPTH = 100_000;

type CueVisual = {
  marker: Phaser.GameObjects.Graphics | null;
  ripple: Phaser.GameObjects.Image | null;
  tweens: Phaser.Tweens.Tween[];
};

/**
 * Evidence cues: a floating red diamond with an ink ripple on the floor beneath, plus small
 * edge pointers for cues outside the camera view. The nearest target keeps its own outline.
 */
export class WorldCueLayer {
  private readonly visuals = new Map<string, CueVisual>();
  private readonly pointers = new Map<string, Phaser.GameObjects.Graphics>();
  private reduced: boolean | null = null;

  /** Number of floating markers (the nearest target is excluded, it has its own outline). */
  get activeCount(): number {
    let count = 0;
    for (const visual of this.visuals.values()) if (visual.marker) count += 1;
    return count;
  }

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly anchors: ReadonlyMap<string, CueAnchor>,
  ) {}

  sync(visibleIds: ReadonlySet<string>, nearestId: string | null, reducedMotion: boolean): void {
    const wanted = new Set([...visibleIds].filter((id) => this.anchors.has(id)));
    for (const [id, visual] of this.visuals) {
      if (wanted.has(id)) continue;
      this.destroyVisual(visual);
      this.visuals.delete(id);
    }
    const motionChanged = this.reduced !== null && this.reduced !== reducedMotion;
    this.reduced = reducedMotion;
    for (const id of wanted) {
      const anchor = this.anchors.get(id)!;
      let visual = this.visuals.get(id);
      if (!visual) {
        visual = { marker: null, ripple: null, tweens: [] };
        this.visuals.set(id, visual);
      }
      const wantsMarker = id !== nearestId;
      if (!wantsMarker && visual.marker) {
        visual.marker.destroy();
        visual.marker = null;
        this.restartTweens(visual, anchor, reducedMotion);
      }
      const created = this.ensureObjects(visual, anchor, wantsMarker);
      if (created || motionChanged) this.restartTweens(visual, anchor, reducedMotion);
    }
    this.stalePointers(wanted);
  }

  /**
   * Draws edge pointers for cues outside the camera view. `insets` are in game pixels.
   * Positions are screen pixels; the pointers are unscrolled, so they undo the camera zoom.
   */
  syncOffscreen(
    camera: Phaser.Cameras.Scene2D.Camera,
    player: { x: number; y: number },
    insets: HudInsetsLike,
  ): void {
    const view = camera.worldView;
    const toScreen = (p: { x: number; y: number }) => ({
      x: (p.x - view.x) * camera.zoom,
      y: (p.y - view.y) * camera.zoom,
    });
    const cues = [...this.visuals.keys()].map((id) => {
      const anchor = this.anchors.get(id)!;
      return { id, ...toScreen(anchor.floor ?? anchor) };
    });
    const pointers = offscreenCues({
      cues,
      view: { x: 0, y: 0, width: camera.width, height: camera.height },
      player: toScreen(player),
      insets,
      margin: OFFSCREEN_MARGIN,
      max: OFFSCREEN_MAX,
    });
    const keep = new Set(pointers.map(({ id }) => id));
    for (const [id, graphic] of this.pointers) {
      if (keep.has(id)) continue;
      graphic.destroy();
      this.pointers.delete(id);
    }
    const originX = camera.width / 2;
    const originY = camera.height / 2;
    for (const pointer of pointers) {
      let graphic = this.pointers.get(pointer.id);
      if (!graphic) {
        graphic = this.drawPointer();
        this.pointers.set(pointer.id, graphic);
      }
      // scrollFactor 0 objects are still zoomed about the camera centre: invert that.
      graphic
        .setPosition(
          (pointer.x - originX) / camera.zoom + originX,
          (pointer.y - originY) / camera.zoom + originY,
        )
        .setScale(1 / camera.zoom)
        .setRotation(pointer.angle);
    }
  }

  /** Ids that currently have an edge pointer (debug/test hook). */
  offscreenIds(): string[] {
    return [...this.pointers.keys()];
  }

  destroy(): void {
    for (const visual of this.visuals.values()) this.destroyVisual(visual);
    this.visuals.clear();
    for (const graphic of this.pointers.values()) graphic.destroy();
    this.pointers.clear();
  }

  private drawPointer(): Phaser.GameObjects.Graphics {
    const kite = [
      { x: 9, y: 0 },
      { x: -5, y: -7 },
      { x: -2, y: 0 },
      { x: -5, y: 7 },
    ];
    const graphic = this.scene.add.graphics().setScrollFactor(0).setDepth(POINTER_DEPTH);
    graphic.fillStyle(MARKER_COLOR, 0.95);
    graphic.lineStyle(2, CREAM, 0.98);
    graphic.fillPoints(kite, true);
    graphic.strokePoints(kite, true);
    return graphic;
  }

  private ensureObjects(visual: CueVisual, anchor: CueAnchor, wantsMarker: boolean): boolean {
    let created = false;
    if (wantsMarker && !visual.marker) {
      const marker = this.scene.add
        .graphics()
        .setPosition(anchor.x, anchor.y)
        .setDepth(anchor.depth);
      const diamond = [
        { x: 0, y: -12 },
        { x: 10, y: 0 },
        { x: 0, y: 12 },
        { x: -10, y: 0 },
      ];
      marker.fillStyle(MARKER_COLOR, 0.95);
      marker.lineStyle(2, CREAM, 0.98);
      marker.fillPoints(diamond, true);
      marker.strokePoints(diamond, true);
      visual.marker = marker;
      created = true;
    }
    if (!visual.ripple && anchor.floor && this.scene.textures.exists(RIPPLE_KEY)) {
      visual.ripple = this.scene.add
        .image(anchor.floor.x, anchor.floor.y, RIPPLE_KEY)
        .setOrigin(0.5, 0.5)
        .setDepth(anchor.depth - 3);
      created = true;
    }
    return created;
  }

  private restartTweens(visual: CueVisual, anchor: CueAnchor, reducedMotion: boolean): void {
    for (const tween of visual.tweens) tween.stop();
    visual.tweens = [];
    if (visual.marker) visual.marker.setY(anchor.y);
    if (visual.ripple) {
      visual.ripple.setScale(reducedMotion ? 1 : 0.6).setAlpha(reducedMotion ? 0.5 : 0.7);
    }
    if (reducedMotion) return;
    if (visual.marker) {
      visual.tweens.push(
        this.scene.tweens.add({
          targets: visual.marker,
          y: anchor.y - FLOAT_PX,
          duration: FLOAT_HALF_CYCLE_MS,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        }),
      );
    }
    if (visual.ripple) {
      visual.tweens.push(
        this.scene.tweens.add({
          targets: visual.ripple,
          scale: 1,
          alpha: 0,
          duration: RIPPLE_CYCLE_MS,
          repeat: -1,
          ease: 'Sine.easeOut',
        }),
      );
    }
  }

  private stalePointers(wanted: ReadonlySet<string>): void {
    for (const [id, graphic] of this.pointers) {
      if (wanted.has(id)) continue;
      graphic.destroy();
      this.pointers.delete(id);
    }
  }

  private destroyVisual(visual: CueVisual): void {
    for (const tween of visual.tweens) tween.stop();
    visual.tweens = [];
    visual.marker?.destroy();
    visual.ripple?.destroy();
    visual.marker = null;
    visual.ripple = null;
  }
}
