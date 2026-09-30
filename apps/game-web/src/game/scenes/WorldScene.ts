import Phaser from 'phaser';
import { expandWalls } from '@lexicon/game-content';
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
import {
  CHARACTER_FIGURE_HEIGHT,
  INTERACTION_RED,
  PLAYER_SPEED,
  SCENE_FADE_MS,
} from '../constants';
import { installDebugHook, paperOverlayAlpha } from '../debug';
import { shouldEmitAnchor, worldToScreen, type IdAnchor } from '../systems/anchorScreen';
import { computeIsoDepth, computePlayerDepth, PLAYER_DEPTH_EPSILON } from '../systems/depth';
import type { Facing } from '../systems/direction';
import { isTypingTarget, resolveInputVector } from '../systems/input';
import type { InteractableArea } from '../systems/interaction';
import { InteractionTracker } from '../systems/InteractionTracker';
import { markerMotion } from '../systems/markerMotion';
import { isOccluder, occluderAlpha } from '../systems/occlusion';
import { shouldEmitPlayerMoved } from '../systems/playerMoved';
import { markerBaseY, markerPositionY } from '../systems/markerFloat';
import { resolveSceneAssets } from '../systems/sceneAssetResolver';
import {
  projectScenePoint,
  projectVisualAnchor,
  projectInteractionAnchor,
  projectWorldBounds,
} from '../systems/sceneProjection';
import { moveWithCollisions, type LogicalRect } from '../systems/logicalCollision';
import { resolveIsoInput, screenSpeedVector } from '../systems/isoInput';
import { unprojectIso, type LogicalPoint } from '../systems/isometricProjection';
import { facingToward } from '../systems/facingToward';
import { breathing } from '../systems/breathing';
import { nameTagPosition } from '../systems/nameTagLayout';
import { facingTextureKey } from '../assetManifest';
import { registerCharacterAnimations, walkAnimKey } from '../entities/characterAnimations';

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
  private logicalPosition: LogicalPoint | null = null;
  private logicalBounds: LogicalRect | null = null;
  private logicalSolids: LogicalRect[] = [];
  private npcVisuals = new Map<
    string,
    {
      sprite: Phaser.GameObjects.Sprite;
      point: LogicalPoint;
      tag: Phaser.GameObjects.Text;
      tagWidth: number;
      tagHeight: number;
      phase: number;
      facing: Facing;
      walking: boolean;
    }
  >();
  private unsubscribeDialogueStarted: (() => void) | null = null;
  private unsubscribeDialogueEnded: (() => void) | null = null;
  private dialogueNpcId: string | null = null;
  private facingTweens: Phaser.Tweens.Tween[] = [];

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
    this.npcVisuals.clear();
    this.dialogueNpcId = null;
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
    const logicalMode = Boolean(def.projection && 'u' in b && 'u' in spawn);
    this.logicalPosition = logicalMode && 'u' in spawn ? { u: spawn.u, v: spawn.v } : null;
    this.logicalBounds =
      logicalMode && 'u' in b ? { u: b.u, v: b.v, width: b.width, height: b.height } : null;
    this.logicalSolids = [];
    let screenBounds: Bounds;
    if ('u' in b) {
      if (!def.projection)
        throw new Error(`Scene "${def.id}" has logical bounds without projection metadata`);
      screenBounds = projectWorldBounds(b, def.projection);
    } else {
      screenBounds = b;
    }
    this.physics.world.setBounds(
      screenBounds.x,
      screenBounds.y,
      screenBounds.width,
      screenBounds.height,
    );

    const colliders = this.physics.add.staticGroup();
    const resolvedAssets = resolveSceneAssets([
      ...def.assets,
      ...expandWalls(def.walls ?? []).assets,
    ]);
    for (const resolved of resolvedAssets) {
      const { asset } = resolved;
      const floorPoint = projectScenePoint(def, resolved.floorAnchor);
      const visualPoint = projectVisualAnchor(def, resolved.visualAnchor);
      const { sprite, body } = createSceneAsset(this, resolved, def.projection);
      this.depths.set(asset.id, sprite.depth);
      this.assetTextures.set(asset.id, sprite.texture.key);
      if (asset.type === 'npc') {
        if (!(sprite instanceof Phaser.GameObjects.Sprite)) {
          throw new Error(`NPC asset "${asset.id}" must be an animation-capable sprite`);
        }
        createShadow(this, { x: floorPoint.x, y: floorPoint.y, depth: sprite.depth });
        const sheet = options.caseDefinition.characterSheets[asset.id];
        if (sheet?.walk && this.textures.exists(sheet.walk)) {
          registerCharacterAnimations(this, asset.id, sheet.walk);
        }
        const npc = options.caseDefinition.npcs.find(({ id }) => id === asset.id);
        if (npc && 'u' in resolved.floorAnchor) {
          const tag = this.add
            .text(0, 0, npc.name, {
              fontFamily: 'Cambria, "Times New Roman", Georgia, serif',
              fontSize: '18px',
              color: '#332820',
              backgroundColor: '#F2E8D5',
              padding: { x: 8, y: 4 },
            })
            .setOrigin(0.5, 0.5)
            .setDepth(sprite.depth + 1);
          this.npcVisuals.set(asset.id, {
            sprite,
            point: resolved.floorAnchor,
            tag,
            tagWidth: tag.width,
            tagHeight: tag.height,
            phase: Array.from(asset.id).reduce((n, c) => n + c.charCodeAt(0), 0) * 0.37,
            facing: 'SE',
            walking: false,
          });
        }
      }
      if (body) colliders.add(body);
      if (
        logicalMode &&
        resolved.collision &&
        'u' in resolved.collision &&
        'u' in resolved.floorAnchor
      ) {
        this.logicalSolids.push({
          u: resolved.floorAnchor.u + resolved.collision.u,
          v: resolved.floorAnchor.v + resolved.collision.v,
          width: resolved.collision.width,
          height: resolved.collision.height,
        });
      }
      if (isOccluder(asset, b.width)) {
        // Static sprites: bounds are measured once, not every frame.
        const { x, y, width, height } = sprite.getBounds();
        this.occluders.push({
          id: asset.id,
          sprite,
          feetY: floorPoint.y,
          box: { x, y, width, height },
        });
      }
      if (asset.interaction && resolved.interactionAnchor) {
        const interactionPoint = projectVisualAnchor(def, resolved.interactionAnchor);
        // Character frames carry transparent headroom, so use the figure height for NPCs.
        const visualTop =
          asset.type === 'npc' ? visualPoint.y - CHARACTER_FIGURE_HEIGHT : sprite.getTopCenter().y;
        const blockedTop =
          asset.collision && 'y' in asset.collision && 'y' in resolved.floorAnchor
            ? resolved.floorAnchor.y + asset.collision.y
            : undefined;
        this.markerAnchors.set(asset.id, markerBaseY(interactionPoint.y, visualTop, blockedTop));
        this.targetBounds.set(asset.id, () => {
          const box = sprite.getBounds();
          if (asset.type !== 'npc')
            return { x: box.left, y: box.top, width: box.width, height: box.height };
          // Character frames carry transparent margins: outline the figure, not the frame.
          const width = CHARACTER_FIGURE_HEIGHT * NPC_FIGURE_ASPECT;
          return {
            x: floorPoint.x - width / 2,
            y: floorPoint.y - CHARACTER_FIGURE_HEIGHT,
            width,
            height: CHARACTER_FIGURE_HEIGHT,
          };
        });
        this.areas.push({
          id: asset.id,
          ...projectInteractionAnchor(def, resolved.interactionAnchor),
          radius: asset.interaction.radius,
          prompt: asset.interaction.prompt,
        });
      }
    }

    this.roomLabels = (def.labels ?? []).map((label) => ({
      text: label.text,
      sign: createRoomLabel(
        this,
        !('x' in label)
          ? {
              id: label.id,
              text: label.text,
              ...projectScenePoint(def, { u: label.u, v: label.v }),
              angle: label.angle,
            }
          : label,
        LABEL_DEPTH,
      ),
    }));

    const spawnPoint =
      'u' in spawn
        ? def.projection
          ? projectScenePoint(def, spawn)
          : { x: 0, y: 0 }
        : { x: spawn.x, y: spawn.y };
    this.player = createPlayer(
      this,
      spawnPoint.x,
      spawnPoint.y,
      options.caseDefinition.characterSheets.player,
    );
    if (logicalMode) {
      this.player.body.enable = false;
      this.player.setCollideWorldBounds(false);
      this.player.setDepth(
        computeIsoDepth(this.logicalPosition!, def.projection!) + PLAYER_DEPTH_EPSILON,
      );
    }
    this.playerFacing = PLAYER_INITIAL_FACING;
    this.playerShadow = createShadow(this, this.player);
    // Publish the start position once so the HUD minimap has a dot before the first move.
    this.lastPublished = null;
    this.publishPlayerPosition(0);
    // After the physics step has moved the sprite, so the shadow never trails a frame behind.
    this.events.on(Phaser.Scenes.Events.PRE_RENDER, this.syncPlayerShadow, this);
    if (!logicalMode) this.physics.add.collider(this.player, colliders);

    const camera = this.cameras.main;
    camera.setBounds(screenBounds.x, screenBounds.y, screenBounds.width, screenBounds.height);
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
      logicalPlayer: () => (this.logicalPosition ? { ...this.logicalPosition } : null),
      playerTexture: () => this.player.texture.key,
      playerAnim: () => {
        const walk = currentWalk(this.player);
        return { key: walk?.key ?? null, frame: walk?.frame ?? null, playing: walk !== null };
      },
      depthOf: (id) => this.depths.get(id) ?? Number.NaN,
      textureOf: (id) => this.assetTextures.get(id),
      npcTexture: (id) => this.npcVisuals.get(id)?.sprite.texture.key,
      npcScaleY: (id) => this.npcVisuals.get(id)?.sprite.scaleY,
      npcName: (id) => this.npcVisuals.get(id)?.tag.text,
      npcAnim: (id) => {
        const sprite = this.npcVisuals.get(id)?.sprite;
        return sprite
          ? {
              key: sprite.anims.isPlaying ? (sprite.anims.currentAnim?.key ?? null) : null,
              frame:
                sprite.anims.isPlaying && sprite.anims.currentFrame
                  ? sprite.anims.currentFrame.index - 1
                  : null,
              playing: sprite.anims.isPlaying,
            }
          : undefined;
      },
      setNpcWalking: (id, walking) => this.setNpcWalking(id, walking),
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
        if (logicalMode && def.projection && this.logicalPosition) {
          this.logicalPosition = unprojectIso({ x, y }, def.projection);
          this.player.setPosition(x, y);
          this.player.setDepth(
            computeIsoDepth(this.logicalPosition, def.projection) + PLAYER_DEPTH_EPSILON,
          );
        } else {
          this.player.body.reset(x, y);
          this.player.setDepth(computePlayerDepth(y));
        }
      },
      teleportLogical: (u, v) => {
        if (!def.projection || !this.logicalBounds) return;
        this.logicalPosition = { u, v };
        const screen = projectScenePoint(def, this.logicalPosition);
        this.player.setPosition(screen.x, screen.y);
        this.player.setDepth(
          computeIsoDepth(this.logicalPosition, def.projection) + PLAYER_DEPTH_EPSILON,
        );
      },
    });

    this.unsubscribeTransition = this.bus.on('scene:transitionRequested', ({ sceneId, spawnId }) =>
      this.transitionTo(sceneId, spawnId),
    );
    this.unsubscribeDialogueStarted = this.bus.on('dialogue:started', ({ npcId }) => {
      this.dialogueNpcId = npcId;
      const visual = this.npcVisuals.get(npcId);
      if (!visual || !this.logicalPosition) return;
      const du = visual.point.u - this.logicalPosition.u;
      const dv = visual.point.v - this.logicalPosition.v;
      this.playerFacing = movePlayer(
        this.player,
        { x: du - dv, y: du + dv },
        this.playerFacing,
        options.caseDefinition.characterSheets.player,
        false,
      );
      const playerTexture = facingTextureKey(
        options.caseDefinition.characterSheets.player.idle,
        this.playerFacing,
      );
      if (this.textures.exists(playerTexture)) this.changeFacingTexture(this.player, playerTexture);
      const npcFacing = facingToward(visual.point, this.logicalPosition);
      this.setNpcWalking(npcId, false);
      visual.facing = npcFacing;
      const npcSheet = options.caseDefinition.characterSheets[npcId];
      if (npcSheet) {
        const texture = facingTextureKey(npcSheet.idle, npcFacing);
        if (this.textures.exists(texture)) this.changeFacingTexture(visual.sprite, texture);
      }
    });
    this.unsubscribeDialogueEnded = this.bus.on('dialogue:ended', ({ npcId }) => {
      if (this.dialogueNpcId === npcId) this.dialogueNpcId = null;
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanup, this);
  }

  override update(_time: number, delta: number): void {
    this.syncNpcPresentation(_time);
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
    if (this.logicalPosition && this.logicalBounds && this.options.scene.projection) {
      this.updateLogicalMovement(typing, delta);
      this.updateNearby();
      this.updateInteract(typing);
      return;
    }
    this.playerFacing = movePlayer(
      this.player,
      direction,
      this.playerFacing,
      this.options.caseDefinition.characterSheets.player,
    );
    this.updateNearby();
    this.updateInteract(typing);
  }

  private syncNpcPresentation(timeMs: number): void {
    for (const [id, visual] of this.npcVisuals) {
      const scale = breathing({
        timeMs,
        phaseOffset: visual.phase,
        walking: visual.walking,
        inDialogue: this.dialogueNpcId === id,
        reducedMotion: this.options.motion.reducedMotion(),
      });
      visual.sprite.setScale(1, scale.scaleY);
      const promptRect =
        this.interactionTracker.current === id && !this.inputLock.isInputLocked()
          ? {
              x: visual.sprite.x - 64,
              y: visual.sprite.y - CHARACTER_FIGURE_HEIGHT - 56,
              width: 128,
              height: 32,
            }
          : null;
      const pos = nameTagPosition({
        centerX: visual.sprite.x,
        feetY: visual.sprite.y,
        figureHeight: CHARACTER_FIGURE_HEIGHT,
        tagHeight: visual.tagHeight,
        tagWidth: visual.tagWidth,
        gap: 8,
        prompt: promptRect,
      });
      visual.tag.setPosition(pos.x, pos.y);
    }
  }

  private setNpcWalking(id: string, walking: boolean): void {
    const visual = this.npcVisuals.get(id);
    const sheet = this.options.caseDefinition.characterSheets[id];
    if (!visual || !sheet?.walk) return;
    visual.walking = walking;
    if (walking) {
      const key = walkAnimKey(id, visual.facing);
      if (this.anims.exists(key)) visual.sprite.anims.play(key, true);
      return;
    }
    if (visual.sprite.anims.isPlaying) visual.sprite.anims.stop();
    const idleKey = facingTextureKey(sheet.idle, visual.facing);
    if (this.textures.exists(idleKey)) visual.sprite.setTexture(idleKey);
  }

  private changeFacingTexture(
    sprite: Phaser.GameObjects.GameObject & {
      setAlpha(value: number): unknown;
      setTexture(key: string): unknown;
    },
    texture: string,
  ): void {
    this.facingTweens
      .filter((tween) => tween.targets.includes(sprite))
      .forEach((tween) => tween.stop());
    if (this.options.motion.reducedMotion()) {
      sprite.setTexture(texture);
      sprite.setAlpha(1);
      return;
    }
    sprite.setAlpha(0.72);
    sprite.setTexture(texture);
    this.facingTweens.push(
      this.tweens.add({
        targets: sprite,
        alpha: 1,
        duration: 160,
        ease: 'Sine.Out',
      }),
    );
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

  /** Logical collision and projection path used by migrated dimetric scenes. */
  private updateLogicalMovement(typing: boolean, deltaMs: number): void {
    const position = this.logicalPosition;
    const bounds = this.logicalBounds;
    const projection = this.options.scene.projection;
    const keys = this.keys;
    if (!position || !bounds || !projection || !keys) return;
    const input = resolveIsoInput(
      {
        up: keys.W.isDown,
        down: keys.S.isDown,
        left: keys.A.isDown,
        right: keys.D.isDown,
      },
      typing,
    );
    const velocity = screenSpeedVector(input, projection, PLAYER_SPEED);
    const dt = Math.min(Math.max(deltaMs, 0), 50) / 1000;
    const result = moveWithCollisions(
      position,
      { u: velocity.u * dt, v: velocity.v * dt },
      { u: -0.18, v: -0.18, width: 0.36, height: 0.36 },
      this.logicalSolids,
      bounds,
    );
    this.logicalPosition = result.position;
    const screen = projectScenePoint(this.options.scene, result.position);
    this.player.setPosition(screen.x, screen.y);
    this.player.setDepth(computeIsoDepth(result.position, projection) + PLAYER_DEPTH_EPSILON);
    const screenDirection = {
      x: (velocity.u - velocity.v) * (projection.tileWidth / 2),
      y: (velocity.u + velocity.v) * (projection.tileHeight / 2),
    };
    this.playerFacing = movePlayer(
      this.player,
      screenDirection,
      this.playerFacing,
      this.options.caseDefinition.characterSheets.player,
      result.position.u !== position.u || result.position.v !== position.v,
    );
  }

  /** Publishes the player position for the HUD (a view; Phaser stays the source). */
  private publishPlayerPosition(deltaMs: number): void {
    // A leaving scene must not publish a stale position for the destination's minimap.
    if (this.transitioning) return;
    this.sinceLastPublishMs += deltaMs;
    const next = this.logicalPosition
      ? { x: this.logicalPosition.u, y: this.logicalPosition.v }
      : { x: this.player.x, y: this.player.y };
    if (!shouldEmitPlayerMoved(this.lastPublished, next, this.sinceLastPublishMs)) return;
    this.lastPublished = next;
    this.sinceLastPublishMs = 0;
    this.bus.emit('player:moved', {
      ...next,
      coordinateSpace: this.logicalPosition ? 'logical' : 'screen',
    });
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
    this.unsubscribeDialogueStarted?.();
    this.unsubscribeDialogueStarted = null;
    this.unsubscribeDialogueEnded?.();
    this.unsubscribeDialogueEnded = null;
    for (const visual of this.npcVisuals.values()) visual.tag.destroy();
    this.npcVisuals.clear();
    this.dialogueNpcId = null;
    this.facingTweens.forEach((tween) => tween.stop());
    this.facingTweens = [];
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
