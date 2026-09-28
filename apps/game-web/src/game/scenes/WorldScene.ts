import Phaser from 'phaser';
import type { EventBus, GameEventMap, SceneDefinition } from '@lexicon/shared-types';
import { createSceneAsset } from '../entities/createSceneAsset';
import { createPlayer, movePlayer, type PlayerSprite } from '../entities/Player';
import { installDebugHook } from '../debug';
import { computeDepth } from '../systems/depth';
import { isTypingTarget, resolveInputVector } from '../systems/input';
import { findNearestInteractable, type InteractableArea } from '../systems/interaction';

export type WorldOptions = { scene: SceneDefinition; bus: EventBus<GameEventMap> };

type MovementKeyMap = Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;

export class WorldScene extends Phaser.Scene {
  static readonly KEY = 'World';

  private player!: PlayerSprite;
  private keys: MovementKeyMap | null = null;
  private bus!: EventBus<GameEventMap>;
  private areas: InteractableArea[] = [];
  private depths = new Map<string, number>();
  private nearbyId: string | null = null;
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
    this.nearbyId = null;

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

    this.uninstallDebug = installDebugHook({
      player: () => ({ x: this.player.x, y: this.player.y, depth: this.player.depth }),
      depthOf: (id) => this.depths.get(id) ?? Number.NaN,
      nearby: () => this.nearbyId,
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
    const nearest = findNearestInteractable(this.player, this.areas);
    const id = nearest?.id ?? null;
    if (id === this.nearbyId) return;
    this.nearbyId = id;
    if (id) this.bus.emit('interaction:nearby', { interactableId: id });
    else this.bus.emit('interaction:cleared', {});
  }

  private cleanup(): void {
    if (this.keys) {
      for (const key of Object.values(this.keys)) this.input.keyboard?.removeKey(key, true);
      this.keys = null;
    }
    this.uninstallDebug?.();
    this.uninstallDebug = null;
    this.events.off(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.events.off(Phaser.Scenes.Events.DESTROY, this.cleanup, this);
  }
}
