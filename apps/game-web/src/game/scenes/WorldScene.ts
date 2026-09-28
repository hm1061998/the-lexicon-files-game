import Phaser from 'phaser';
import type { EventBus, GameEventMap, SceneDefinition } from '@lexicon/shared-types';
import { createSceneAsset } from '../entities/createSceneAsset';
import { createPlayer, movePlayer, type PlayerSprite } from '../entities/Player';
import { installDebugHook } from '../debug';
import { computeDepth } from '../systems/depth';
import { isTypingTarget, resolveInputVector } from '../systems/input';
import type { InteractableArea } from '../systems/interaction';
import { InteractionTracker } from '../systems/InteractionTracker';

export type WorldOptions = { scene: SceneDefinition; bus: EventBus<GameEventMap> };

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
  private areas: InteractableArea[] = [];
  private depths = new Map<string, number>();
  private interactionTracker!: InteractionTracker;
  private nearbyEventCount = 0;
  private marker!: Phaser.GameObjects.Sprite;
  private markerTween: Phaser.Tweens.Tween | null = null;
  private unsubscribeNearby: (() => void) | null = null;
  private uninstallDebug: (() => void) | null = null;

  constructor() {
    super(WorldScene.KEY);
  }

  create(): void {
    const options = this.registry.get('world') as WorldOptions;
    const def = options.scene;
    this.bus = options.bus;
    this.areas = [];
    this.depths.clear();
    this.interactionTracker = new InteractionTracker(this.bus);
    this.nearbyEventCount = 0;
    this.unsubscribeNearby = this.bus.on('interaction:nearby', () => {
      this.nearbyEventCount += 1;
    });

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
        });
      }
    }

    this.player = createPlayer(this, def.spawn.x, def.spawn.y);
    this.physics.add.collider(this.player, colliders);

    const camera = this.cameras.main;
    camera.setBounds(b.x, b.y, b.width, b.height);
    camera.startFollow(this.player, true);

    const keyboard = this.input.keyboard;
    if (keyboard) this.keys = keyboard.addKeys('W,A,S,D') as MovementKeyMap;

    this.marker = this.add.sprite(0, 0, 'ph_marker');
    this.marker.setDepth(MARKER_DEPTH);
    this.marker.setVisible(false);
    this.markerTween = this.tweens.add({
      targets: this.marker,
      y: `-=${MARKER_FLOAT_DISTANCE}`,
      duration: MARKER_FLOAT_DURATION_MS,
      yoyo: true,
      repeat: -1,
    });

    this.uninstallDebug = installDebugHook({
      player: () => ({ x: this.player.x, y: this.player.y, depth: this.player.depth }),
      depthOf: (id) => this.depths.get(id) ?? Number.NaN,
      nearby: () => this.interactionTracker.current,
      nearbyEvents: () => this.nearbyEventCount,
      teleport: (x, y) => {
        this.player.body.reset(x, y);
        this.player.setDepth(computeDepth(y));
      },
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanup, this);
  }

  override update(): void {
    if (!this.keys) return;
    const direction = resolveInputVector(
      {
        up: this.keys.W.isDown,
        down: this.keys.S.isDown,
        left: this.keys.A.isDown,
        right: this.keys.D.isDown,
      },
      isTypingTarget(document.activeElement),
    );
    movePlayer(this.player, direction);
    this.updateNearby();
  }

  private updateNearby(): void {
    const id = this.interactionTracker.update(this.player, this.areas);
    const area = id ? this.areas.find((candidate) => candidate.id === id) : undefined;
    if (area) {
      this.marker.setPosition(area.x, area.y + MARKER_OFFSET_Y);
      this.marker.setVisible(true);
    } else {
      this.marker.setVisible(false);
    }
  }

  private cleanup(): void {
    if (this.keys) {
      for (const key of Object.values(this.keys)) this.input.keyboard?.removeKey(key, true);
      this.keys = null;
    }
    this.markerTween?.destroy();
    this.markerTween = null;
    this.unsubscribeNearby?.();
    this.unsubscribeNearby = null;
    this.uninstallDebug?.();
    this.uninstallDebug = null;
    this.events.off(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.events.off(Phaser.Scenes.Events.DESTROY, this.cleanup, this);
  }
}
