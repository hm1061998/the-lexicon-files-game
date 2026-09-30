import Phaser from 'phaser';
import type {
  CaseDefinition,
  EventBus,
  GameEventMap,
  SceneDefinition,
} from '@lexicon/shared-types';
import { loadSceneTextures } from '../assetManifest';
import { createRoomLabel } from '../entities/createRoomLabel';
import { createSceneAsset } from '../entities/createSceneAsset';
import {
  PLAYER_INITIAL_FACING,
  createPlayer,
  currentWalk,
  movePlayer,
  type PlayerSprite,
} from '../entities/Player';
import { createShadow, syncShadow } from '../entities/shadow';
import { CHARACTER_FIGURE_HEIGHT, INTERACTION_RED, SCENE_FADE_MS } from '../constants';
import { installDebugHook, paperOverlayAlpha } from '../debug';
import { shouldEmitAnchor, worldToScreen, type IdAnchor } from '../systems/anchorScreen';
import { computePlayerDepth } from '../systems/depth';
import type { Facing } from '../systems/direction';
import { isTypingTarget, resolveInputVector } from '../systems/input';
import type { InteractableArea } from '../systems/interaction';
import { InteractionTracker } from '../systems/InteractionTracker';
import { markerMotion } from '../systems/markerMotion';
import { isOccluder, occluderAlpha } from '../systems/occlusion';
import { shouldEmitPlayerMoved } from '../systems/playerMoved';
import { markerBaseY, markerPositionY } from '../systems/markerFloat';

export type InputLockSource = { isInputLocked(): boolean };

/** Store-backed scene transitions: the same flow the case engine uses for door interactions. */
export type TransitionSource = {
  request(sceneId: string, spawnId: string): boolean;
  activeSceneId(): string;
};

export type MotionSource = { reducedMotion(): boolean };

export type WorldOptions = {
  caseDefinition: CaseDefinition;
  scene: SceneDefinition;
  spawnId: string;
  bus: EventBus<GameEventMap>;
  input: InputLockSource;
  transitions: TransitionSource;
  motion: MotionSource;
};

type MovementKeyMap = Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;

const MARKER_DEPTH = 10000;
/** Red target outline: above the sprites, just under the marker. */
const OUTLINE_DEPTH = MARKER_DEPTH - 1;
const OUTLINE_WIDTH_PX = 2;
/** Room signs: above every wall and prop, under the target outline and the marker. */
const LABEL_DEPTH = OUTLINE_DEPTH - 1;
const OUTLINE_PADDING = 6;
/** Figure width / height of an NPC, used to outline the figure rather than its sprite frame. */
const NPC_FIGURE_ASPECT = 0.45;

type Bounds = { x: number; y: number; width: number; height: number };
const MARKER_FLOAT_DISTANCE = 4;
const MARKER_FLOAT_DURATION_MS = 1000;

export class WorldScene extends Phaser.Scene {
  static readonly KEY = 'World';

  private player!: PlayerSprite;
  private playerShadow: Phaser.GameObjects.Image | null = null;
  private playerFacing: Facing = PLAYER_INITIAL_FACING;
  private keys: MovementKeyMap | null = null;
  private bus!: EventBus<GameEventMap>;
  private options!: WorldOptions;
  private inputLock!: InputLockSource;
  private interactKey: Phaser.Input.Keyboard.Key | null = null;
  private triggeredEventCount = 0;
  private unsubscribeTriggered: (() => void) | null = null;
  private areas: InteractableArea[] = [];
  private depths = new Map<string, number>();
  private assetTextures = new Map<string, string>();
  private markerAnchors = new Map<string, number>();
  private targetBounds = new Map<string, () => Bounds>();
  private outline: Phaser.GameObjects.Graphics | null = null;
  private roomLabels: Array<{ text: string; sign: Phaser.GameObjects.Container }> = [];
  /** Inner walls and wall-hung boards that fade while the player stands behind them. */
  private occluders: Array<{
    id: string;
    sprite: Phaser.GameObjects.Image;
    feetY: number;
    box: Bounds;
  }> = [];
  private outlineBounds: Bounds | null = null;
  private lastAnchor: IdAnchor | null = null;
  /** Canvas CSS size, cached; refreshed on Phaser scale 'resize' instead of every frame. */
  private canvasSize = { width: 1920, height: 1080 };
  private sinceAnchorMs = 0;
  private interactionTracker!: InteractionTracker;
  private nearbyEventCount = 0;
  private marker!: Phaser.GameObjects.Sprite;
  private markerTween: Phaser.Tweens.Tween | null = null;
  private markerBaseX = 0;
  private markerBaseY = 0;
  private markerFloat = { offset: 0 };
  private reducedMotion = false;
  private transitioning = false;
  private lastPublished: { x: number; y: number } | null = null;
  private sinceLastPublishMs = 0;
  private fadeInPending = false;
  private fadeOutHandler: (() => void) | null = null;
  private pendingTransition: { loaded: boolean; faded: boolean } | null = null;
  private unsubscribeNearby: (() => void) | null = null;
  private unsubscribeTransition: (() => void) | null = null;
  private uninstallDebug: (() => void) | null = null;

  constructor() {
    super(WorldScene.KEY);
  }

  create(): void {
    const options = this.registry.get('world') as WorldOptions;
    this.options = options;
    const def = options.scene;
    const spawn = def.spawnPoints[options.spawnId];
    if (!spawn) throw new Error(`Scene "${def.id}" has no spawn "${options.spawnId}"`);
    this.bus = options.bus;
    this.inputLock = options.input;
    this.transitioning = false;
    this.areas = [];
    this.depths.clear();
    this.assetTextures.clear();
    this.occluders = [];
    this.markerAnchors.clear();
    this.targetBounds.clear();
    this.lastAnchor = null;
    this.outlineBounds = null;
    this.interactionTracker = new InteractionTracker(this.bus);
    this.nearbyEventCount = 0;
    this.triggeredEventCount = 0;
    if (import.meta.env.DEV) {
      this.unsubscribeTriggered = this.bus.on('interaction:triggered', () => {
        this.triggeredEventCount += 1;
      });
      this.unsubscribeNearby = this.bus.on('interaction:nearby', () => {
        this.nearbyEventCount += 1;
      });
    }

    const b = def.worldBounds;
    this.physics.world.setBounds(b.x, b.y, b.width, b.height);

    const colliders = this.physics.add.staticGroup();
    for (const asset of def.assets) {
      const { sprite, body } = createSceneAsset(this, asset);
      this.depths.set(asset.id, sprite.depth);
      this.assetTextures.set(asset.id, sprite.texture.key);
      if (asset.type === 'npc') createShadow(this, { x: asset.x, y: asset.y, depth: sprite.depth });
      if (body) colliders.add(body);
      if (isOccluder(asset, b.width)) {
        // Static sprites: bounds are measured once, not every frame.
        const { x, y, width, height } = sprite.getBounds();
        this.occluders.push({ id: asset.id, sprite, feetY: asset.y, box: { x, y, width, height } });
      }
      if (asset.interaction) {
        // Character frames carry transparent headroom, so use the figure height for NPCs.
        const visualTop =
          asset.type === 'npc' ? asset.y - CHARACTER_FIGURE_HEIGHT : sprite.getTopCenter().y;
        const blockedTop = asset.collision ? asset.y + asset.collision.y : undefined;
        this.markerAnchors.set(
          asset.id,
          markerBaseY(asset.y + asset.interaction.y, visualTop, blockedTop),
        );
        this.targetBounds.set(asset.id, () => {
          const box = sprite.getBounds();
          if (asset.type !== 'npc')
            return { x: box.left, y: box.top, width: box.width, height: box.height };
          // Character frames carry transparent margins: outline the figure, not the frame.
          const width = CHARACTER_FIGURE_HEIGHT * NPC_FIGURE_ASPECT;
          return {
            x: asset.x - width / 2,
            y: asset.y - CHARACTER_FIGURE_HEIGHT,
            width,
            height: CHARACTER_FIGURE_HEIGHT,
          };
        });
        this.areas.push({
          id: asset.id,
          x: asset.x + asset.interaction.x,
          y: asset.y + asset.interaction.y,
          radius: asset.interaction.radius,
          prompt: asset.interaction.prompt,
        });
      }
    }

    this.roomLabels = (def.labels ?? []).map((label) => ({
      text: label.text,
      sign: createRoomLabel(this, label, LABEL_DEPTH),
    }));

    this.player = createPlayer(
      this,
      spawn.x,
      spawn.y,
      options.caseDefinition.characterSheets.player,
    );
    this.playerFacing = PLAYER_INITIAL_FACING;
    this.playerShadow = createShadow(this, this.player);
    // Publish the start position once so the HUD minimap has a dot before the first move.
    this.lastPublished = null;
    this.publishPlayerPosition(0);
    // After the physics step has moved the sprite, so the shadow never trails a frame behind.
    this.events.on(Phaser.Scenes.Events.PRE_RENDER, this.syncPlayerShadow, this);
    this.physics.add.collider(this.player, colliders);

    const camera = this.cameras.main;
    camera.setBounds(b.x, b.y, b.width, b.height);
    camera.startFollow(this.player, true);
    // Fade in only when arriving through a transition; the initial boot stays instant so
    // first-frame input latency is unaffected.
    if (this.fadeInPending && !options.motion.reducedMotion()) camera.fadeIn(SCENE_FADE_MS);
    this.fadeInPending = false;

    const keyboard = this.input.keyboard;
    if (keyboard) {
      this.keys = keyboard.addKeys('W,A,S,D', false) as MovementKeyMap;
      this.interactKey = keyboard.addKey('E', false);
    }

    this.refreshCanvasSize();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.refreshCanvasSize, this);
    this.marker = this.add.sprite(0, 0, 'ph_marker');
    this.marker.setDepth(MARKER_DEPTH);
    this.marker.setVisible(false);
    this.outline = this.add.graphics();
    this.outline.setDepth(OUTLINE_DEPTH);
    this.outline.setVisible(false);
    this.reducedMotion = options.motion.reducedMotion();
    this.markerTween = this.tweens.add({
      targets: this.markerFloat,
      offset: -MARKER_FLOAT_DISTANCE,
      duration: MARKER_FLOAT_DURATION_MS,
      yoyo: true,
      repeat: -1,
    });
    if (this.reducedMotion) this.markerTween.pause();

    this.uninstallDebug = installDebugHook({
      player: () => ({ x: this.player.x, y: this.player.y, depth: this.player.depth }),
      playerTexture: () => this.player.texture.key,
      playerAnim: () => {
        const walk = currentWalk(this.player);
        return { key: walk?.key ?? null, frame: walk?.frame ?? null, playing: walk !== null };
      },
      depthOf: (id) => this.depths.get(id) ?? Number.NaN,
      textureOf: (id) => this.assetTextures.get(id),
      labels: () => this.roomLabels.map(({ text }) => text),
      alphaOf: (id) => this.occluders.find((o) => o.id === id)?.sprite.alpha ?? Number.NaN,
      nearby: () => this.interactionTracker.current,
      nearbyEvents: () => this.nearbyEventCount,
      triggeredEvents: () => this.triggeredEventCount,
      markerY: () => (this.marker.visible ? this.marker.y : null),
      highlightBounds: () => (this.outline?.visible ? this.outlineBounds : null),
      markerBaseY: () => (this.marker.visible ? this.markerBaseY : null),
      paperOverlayAlpha,
      requestTransition: (sceneId, spawnId) => {
        this.options.transitions.request(sceneId, spawnId);
      },
      storeSceneId: () => this.options.transitions.activeSceneId(),
      teleport: (x, y) => {
        this.player.body.reset(x, y);
        this.player.setDepth(computePlayerDepth(y));
      },
    });

    this.unsubscribeTransition = this.bus.on('scene:transitionRequested', ({ sceneId, spawnId }) =>
      this.transitionTo(sceneId, spawnId),
    );

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanup, this);
  }

  override update(_time: number, delta: number): void {
    this.syncMarkerMotion();
    this.applyMarkerPosition();
    this.publishPlayerPosition(delta);
    this.syncTargetVisuals(delta);
    this.syncOccluders();
    if (!this.keys) return;
    if (this.transitioning || this.pendingTransition) {
      this.holdForTransition();
      return;
    }
    if (this.inputLock.isInputLocked()) {
      this.playerFacing = movePlayer(
        this.player,
        { x: 0, y: 0 },
        this.playerFacing,
        this.options.caseDefinition.characterSheets.player,
      );
      // Consume a press made while locked so it does not fire after unlock.
      if (this.interactKey) Phaser.Input.Keyboard.JustDown(this.interactKey);
      return;
    }
    const typing = isTypingTarget(document.activeElement);
    const direction = resolveInputVector(
      {
        up: this.keys.W.isDown,
        down: this.keys.S.isDown,
        left: this.keys.A.isDown,
        right: this.keys.D.isDown,
      },
      typing,
    );
    this.playerFacing = movePlayer(
      this.player,
      direction,
      this.playerFacing,
      this.options.caseDefinition.characterSheets.player,
    );
    this.updateNearby();
    this.updateInteract(typing);
  }

  /**
   * While a transition waits for textures or the fade, the old scene is frozen: the player
   * stops, nothing is nearby, no marker/outline/anchor and E is consumed, so nothing can
   * trigger against a scene that is about to be replaced.
   */
  private holdForTransition(): void {
    this.playerFacing = movePlayer(
      this.player,
      { x: 0, y: 0 },
      this.playerFacing,
      this.options.caseDefinition.characterSheets.player,
    );
    this.interactionTracker.clear();
    this.marker.setVisible(false);
    if (this.interactKey) Phaser.Input.Keyboard.JustDown(this.interactKey);
  }

  /** Publishes the player position for the HUD (a view; Phaser stays the source). */
  private publishPlayerPosition(deltaMs: number): void {
    // A leaving scene must not publish a stale position for the destination's minimap.
    if (this.transitioning) return;
    this.sinceLastPublishMs += deltaMs;
    const next = { x: this.player.x, y: this.player.y };
    if (!shouldEmitPlayerMoved(this.lastPublished, next, this.sinceLastPublishMs)) return;
    this.lastPublished = next;
    this.sinceLastPublishMs = 0;
    this.bus.emit('player:moved', next);
  }

  /** Red outline around the nearby target and its published screen anchor (view only). */
  private syncTargetVisuals(deltaMs: number): void {
    this.sinceAnchorMs += deltaMs;
    const id = this.interactionTracker.current;
    const boundsOf = id ? this.targetBounds.get(id) : undefined;
    const active = boundsOf && !this.transitioning && !this.inputLock.isInputLocked();
    if (!active || !this.outline) {
      this.hideOutline();
      this.clearAnchor();
      return;
    }
    const box = boundsOf();
    this.drawOutline(box);
    const camera = this.cameras.main;
    const anchor = worldToScreen(
      { x: box.x + box.width, y: box.y },
      {
        scrollX: camera.scrollX,
        scrollY: camera.scrollY,
        zoom: camera.zoom,
        width: camera.width,
        height: camera.height,
      },
      this.canvasSize,
    );
    const next = { id: id!, x: anchor.x, y: anchor.y };
    if (!shouldEmitAnchor(this.lastAnchor, next, this.sinceAnchorMs)) return;
    this.lastAnchor = next;
    this.sinceAnchorMs = 0;
    this.bus.emit('interaction:anchor', { interactableId: id!, x: anchor.x, y: anchor.y });
  }

  /** Walls the player is behind drop to 45% so the player never disappears (art/06 §29). */
  private syncOccluders(): void {
    if (this.occluders.length === 0) return;
    const width = CHARACTER_FIGURE_HEIGHT * NPC_FIGURE_ASPECT;
    const figure = {
      x: this.player.x - width / 2,
      y: this.player.y - CHARACTER_FIGURE_HEIGHT,
      width,
      height: CHARACTER_FIGURE_HEIGHT,
    };
    for (const { sprite, feetY, box } of this.occluders) {
      sprite.setAlpha(occluderAlpha(box, feetY, figure, this.player.y));
    }
  }

  private refreshCanvasSize(): void {
    const rect = this.game.canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0)
      this.canvasSize = { width: rect.width, height: rect.height };
  }

  private drawOutline(box: Bounds): void {
    const g = this.outline;
    if (!g) return;
    const pad = OUTLINE_PADDING;
    // Keep a crisp 2 CSS px line however far the canvas is scaled down; no glow, no fill.
    const width = OUTLINE_WIDTH_PX * this.scale.displayScale.x;
    this.outlineBounds = {
      x: box.x - pad,
      y: box.y - pad,
      width: box.width + pad * 2,
      height: box.height + pad * 2,
    };
    g.clear();
    g.lineStyle(width, Phaser.Display.Color.HexStringToColor(INTERACTION_RED).color, 1);
    g.strokeRect(
      this.outlineBounds.x,
      this.outlineBounds.y,
      this.outlineBounds.width,
      this.outlineBounds.height,
    );
    g.setVisible(true);
  }

  private hideOutline(): void {
    this.outlineBounds = null;
    this.outline?.setVisible(false);
  }

  private clearAnchor(): void {
    if (this.lastAnchor === null) return;
    this.lastAnchor = null;
    this.bus.emit('interaction:anchor', { interactableId: null });
  }

  private syncPlayerShadow(): void {
    if (this.playerShadow) syncShadow(this.playerShadow, this.player);
  }

  // Reduced motion pauses decorative motion only (marker float, fades). The walk animation is
  // functional movement feedback and keeps playing (Phase 11B ruling).
  private syncMarkerMotion(): void {
    const next = this.options.motion.reducedMotion();
    const action = markerMotion(this.reducedMotion, next);
    this.reducedMotion = next;
    if (action === 'pause') {
      this.markerTween?.pause();
      this.markerFloat.offset = 0;
    } else if (action === 'resume') {
      this.markerTween?.resume();
    }
  }

  private applyMarkerPosition(): void {
    this.marker.setPosition(
      this.markerBaseX,
      markerPositionY(this.markerBaseY, this.markerFloat.offset),
    );
  }

  private updateInteract(typing: boolean): void {
    if (!this.interactKey || !Phaser.Input.Keyboard.JustDown(this.interactKey)) return;
    const id = this.interactionTracker.current;
    if (id === null || typing) return;
    this.bus.emit('interaction:triggered', { interactableId: id });
  }

  private updateNearby(): void {
    const id = this.interactionTracker.update(this.player, this.areas);
    const area = id ? this.areas.find((candidate) => candidate.id === id) : undefined;
    if (area) {
      this.markerBaseX = area.x;
      this.markerBaseY = this.markerAnchors.get(area.id) ?? area.y;
      this.applyMarkerPosition();
      this.marker.setVisible(true);
    } else {
      this.marker.setVisible(false);
    }
  }

  private transitionTo(sceneId: string, spawnId: string): void {
    const scene = this.options.caseDefinition.scenes.find((candidate) => candidate.id === sceneId);
    if (this.transitioning || !scene || !scene.spawnPoints[spawnId]) return;
    this.transitioning = true;
    this.fadeInPending = true;
    this.interactionTracker.clear();
    this.hideOutline();
    this.clearAnchor();
    this.registry.set('world', { ...this.options, scene, spawnId } satisfies WorldOptions);
    // Restart once the destination textures are loaded (failures only warn) and, unless
    // motion is reduced, the fade-out has finished; the load runs during the fade.
    const pending = { loaded: false, faded: this.options.motion.reducedMotion() };
    this.pendingTransition = pending;
    const restartWhenReady = () => {
      if (this.pendingTransition !== pending || !pending.loaded || !pending.faded) return;
      this.pendingTransition = null;
      this.scene.restart();
    };
    void loadSceneTextures(this, scene.textures).then(() => {
      pending.loaded = true;
      restartWhenReady();
    });
    if (pending.faded) return;
    const camera = this.cameras.main;
    this.fadeOutHandler = () => {
      this.fadeOutHandler = null;
      pending.faded = true;
      restartWhenReady();
    };
    camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, this.fadeOutHandler);
    // Camera.fadeOut passes force=true, so it also restarts a fade-in that is still running.
    camera.fadeOut(SCENE_FADE_MS);
  }

  private cleanup(): void {
    // A load that settles after shutdown must not restart this scene again.
    this.pendingTransition = null;
    if (this.fadeOutHandler) {
      this.cameras.main?.off(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, this.fadeOutHandler);
      this.fadeOutHandler = null;
    }
    this.interactionTracker?.clear();
    this.clearAnchor();
    this.scale.off(Phaser.Scale.Events.RESIZE, this.refreshCanvasSize, this);
    this.outline?.destroy();
    this.outline = null;
    for (const { sign } of this.roomLabels) sign.destroy();
    this.roomLabels = [];
    this.occluders = [];
    this.outlineBounds = null;
    this.unsubscribeTransition?.();
    this.unsubscribeTransition = null;
    if (this.keys) {
      for (const key of Object.values(this.keys)) this.input.keyboard?.removeKey(key, true);
      this.keys = null;
    }
    if (this.interactKey) {
      this.input.keyboard?.removeKey(this.interactKey, true);
      this.interactKey = null;
    }
    this.markerTween?.destroy();
    this.markerTween = null;
    this.unsubscribeNearby?.();
    this.unsubscribeNearby = null;
    this.unsubscribeTriggered?.();
    this.unsubscribeTriggered = null;
    this.uninstallDebug?.();
    this.uninstallDebug = null;
    this.events.off(Phaser.Scenes.Events.PRE_RENDER, this.syncPlayerShadow, this);
    // Scene display objects (shadows, sprites) are destroyed by the scene itself.
    this.playerShadow = null;
    this.events.off(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.events.off(Phaser.Scenes.Events.DESTROY, this.cleanup, this);
  }
}
