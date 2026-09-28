import type { EventBus, EventHandler } from '@lexicon/shared-types';

export function createEventBus<M extends Record<string, unknown>>(): EventBus<M> {
  const listeners = new Map<keyof M, Set<EventHandler<M[keyof M]>>>();

  function on<K extends keyof M>(event: K, handler: EventHandler<M[K]>): () => void {
    let handlers = listeners.get(event);
    if (!handlers) {
      handlers = new Set();
      listeners.set(event, handlers);
    }
    handlers.add(handler as EventHandler<M[keyof M]>);
    return () => off(event, handler);
  }

  function off<K extends keyof M>(event: K, handler: EventHandler<M[K]>): void {
    listeners.get(event)?.delete(handler as EventHandler<M[keyof M]>);
  }

  function emit<K extends keyof M>(event: K, payload: M[K]): void {
    listeners.get(event)?.forEach((handler) => handler(payload));
  }

  return { on, off, emit };
}
