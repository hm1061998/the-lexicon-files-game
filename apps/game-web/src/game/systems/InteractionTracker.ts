import type { EventBus, GameEventMap } from '@lexicon/shared-types';
import { findNearestInteractable, type InteractableArea } from './interaction';

/** Tracks the nearest interactable area and emits bus events only when it changes. */
export class InteractionTracker {
  private bus: EventBus<GameEventMap>;
  private currentId: string | null = null;

  constructor(bus: EventBus<GameEventMap>) {
    this.bus = bus;
  }

  get current(): string | null {
    return this.currentId;
  }

  update(pos: { x: number; y: number }, areas: readonly InteractableArea[]): string | null {
    const nearest = findNearestInteractable(pos, areas);
    const id = nearest?.id ?? null;
    if (id === this.currentId) return this.currentId;

    this.currentId = id;
    if (nearest)
      this.bus.emit('interaction:nearby', { interactableId: nearest.id, prompt: nearest.prompt });
    else this.bus.emit('interaction:cleared', {});
    return this.currentId;
  }
}
