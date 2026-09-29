import Phaser from 'phaser';
import type {
  CaseDefinition,
  EventBus,
  GameEventMap,
  SceneDefinition,
} from '@lexicon/shared-types';
import { loadSceneTextures } from '../assetManifest';
import { createSceneAsset } from '../entities/createSceneAsset';
import {
  PLAYER_INITIAL_FACING,
  createPlayer,
  currentWalk,
  movePlayer,
  type PlayerSprite,
} from '../entities/Player';
import { createShadow, syncShadow } from '../entities/shadow';
import { CHARACTER_FIGURE_HEIGHT, SCENE_FADE_MS } from '../constants';
import { installDebugHook, paperOverlayAlpha } from '../debug';
import { computeDepth } from '../systems/depth';
import type { Facing } from '../systems/direction';
import { isTypingTarget, resolveInputVector } from '../systems/input';
import type { InteractableArea } from '../systems/interaction';
import { InteractionTracker } from '../systems/InteractionTracker';
import { markerMotion } from '../systems/markerMotion';
import { shouldEmitPlayerMoved } from '../systems/playerMoved';
import { markerBaseY, markerPositionY } from '../systems/markerFloat';

export type InputLockSource = { isInputLocked(): boolean };

export type MotionSource = { reducedMotion(): boolean };

export type WorldOptions = {
  caseDefinition: CaseDefinition;
  scene: SceneDefinition;
  spawnId: string;
  bus: EventBus<GameEventMap>;
  input: InputLockSource;
  motion: MotionSource;
};

type MovementKeyMap = Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;

const MARKER_DEPTH = 10000;
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
  private markerAnchors = new Map<string, number>();
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
    this.markerAnchors.clear();
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
      if (asset.type === 'npc') createShadow(this, { x: asset.x, y: asset.y, depth: sprite.depth });
      if (body) colliders.add(body);
      if (asset.interaction) {
        // Character frames carry transparent headroom, so use the figure height for NPCs.
        const visualTop =
          asset.type === 'npc' ? asset.y - CHARACTER_FIGURE_HEIGHT : sprite.getTopCenter().y;
        const blockedTop = asset.collision ? asset.y + asset.collision.y : undefined;
        this.markerAnchors.set(
          asset.id,
          markerBaseY(asset.y + asset.interaction.y, visualTop, blockedTop),
        );
        this.areas.push({
          id: asset.id,
          x: asset.x + asset.interaction.x,
          y: asset.y + asset.interaction.y,
          radius: asset.interaction.radius,
          prompt: asset.interaction.prompt,
        });
      }
    }

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

    this.marker = this.add.sprite(0, 0, 'ph_marker');
    this.marker.setDepth(MARKER_DEPTH);
    this.marker.setVisible(false);
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
      nearby: () => this.interactionTracker.current,
      nearbyEvents: () => this.nearbyEventCount,
      triggeredEvents: () => this.triggeredEventCount,
      markerY: () => (this.marker.visible ? this.marker.y : null),
      markerBaseY: () => (this.marker.visible ? this.markerBaseY : null),
      paperOverlayAlpha,
      requestTransition: (sceneId, spawnId) =>
        this.bus.emit('scene:transitionRequested', { sceneId, spawnId }),
      teleport: (x, y) => {
        this.player.body.reset(x, y);
        this.player.setDepth(computeDepth(y));
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
    if (!this.keys) return;
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
