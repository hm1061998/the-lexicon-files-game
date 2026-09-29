import Phaser from 'phaser';
import type {
  CaseDefinition,
  EventBus,
  GameEventMap,
  SceneDefinition,
} from '@lexicon/shared-types';
import { createSceneAsset } from '../entities/createSceneAsset';
import { createPlayer, movePlayer, type PlayerSprite } from '../entities/Player';
import { installDebugHook } from '../debug';
import { computeDepth } from '../systems/depth';
import { isTypingTarget, resolveInputVector } from '../systems/input';
import type { InteractableArea } from '../systems/interaction';
import { InteractionTracker } from '../systems/InteractionTracker';
import { markerMotion } from '../systems/markerMotion';

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
const MARKER_OFFSET_Y = -90;
const MARKER_FLOAT_DISTANCE = 4;
const MARKER_FLOAT_DURATION_MS = 1000;

export class WorldScene extends Phaser.Scene {
  static readonly KEY = 'World';

  private player!: PlayerSprite;
  private keys: MovementKeyMap | null = null;
  private bus!: EventBus<GameEventMap>;
  private options!: WorldOptions;
  private inputLock!: InputLockSource;
  private interactKey: Phaser.Input.Keyboard.Key | null = null;
  private triggeredEventCount = 0;
  private unsubscribeTriggered: (() => void) | null = null;
  private areas: InteractableArea[] = [];
  private depths = new Map<string, number>();
  private interactionTracker!: InteractionTracker;
  private nearbyEventCount = 0;
  private marker!: Phaser.GameObjects.Sprite;
  private markerTween: Phaser.Tweens.Tween | null = null;
  private markerBaseY = 0;
  private reducedMotion = false;
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
    this.areas = [];
    this.depths.clear();
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
      if (body) colliders.add(body);
      if (asset.interaction) {
        this.areas.push({
          id: asset.id,
          x: asset.x + asset.interaction.x,
          y: asset.y + asset.interaction.y,
          radius: asset.interaction.radius,
          prompt: asset.interaction.prompt,
        });
      }
    }

    this.player = createPlayer(this, spawn.x, spawn.y);
    this.physics.add.collider(this.player, colliders);

    const camera = this.cameras.main;
    camera.setBounds(b.x, b.y, b.width, b.height);
    camera.startFollow(this.player, true);

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
      targets: this.marker,
      y: `-=${MARKER_FLOAT_DISTANCE}`,
      duration: MARKER_FLOAT_DURATION_MS,
      yoyo: true,
      repeat: -1,
    });
    if (this.reducedMotion) this.markerTween.pause();

    this.uninstallDebug = installDebugHook({
      player: () => ({ x: this.player.x, y: this.player.y, depth: this.player.depth }),
      depthOf: (id) => this.depths.get(id) ?? Number.NaN,
      nearby: () => this.interactionTracker.current,
      nearbyEvents: () => this.nearbyEventCount,
      triggeredEvents: () => this.triggeredEventCount,
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

  override update(): void {
    this.syncMarkerMotion();
    if (!this.keys) return;
    if (this.inputLock.isInputLocked()) {
      movePlayer(this.player, { x: 0, y: 0 });
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
    movePlayer(this.player, direction);
    this.updateNearby();
    this.updateInteract(typing);
  }

  private syncMarkerMotion(): void {
    const next = this.options.motion.reducedMotion();
    const action = markerMotion(this.reducedMotion, next);
    this.reducedMotion = next;
    if (action === 'pause') {
      this.markerTween?.pause();
      this.marker.y = this.markerBaseY;
    } else if (action === 'resume') {
      this.markerTween?.resume();
    }
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
      this.markerBaseY = area.y + MARKER_OFFSET_Y;
      this.marker.setPosition(area.x, this.markerBaseY);
      this.marker.setVisible(true);
    } else {
      this.marker.setVisible(false);
    }
  }

  private transitionTo(sceneId: string, spawnId: string): void {
    const scene = this.options.caseDefinition.scenes.find((candidate) => candidate.id === sceneId);
    if (!scene || !scene.spawnPoints[spawnId]) return;
    this.interactionTracker.clear();
    this.registry.set('world', { ...this.options, scene, spawnId } satisfies WorldOptions);
    this.scene.restart();
  }

  private cleanup(): void {
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
    this.events.off(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.events.off(Phaser.Scenes.Events.DESTROY, this.cleanup, this);
  }
}
