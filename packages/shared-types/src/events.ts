export type GameEventMap = {
  'interaction:nearby': { interactableId: string };
  'interaction:cleared': Record<string, never>;
};

export type EventHandler<T> = (payload: T) => void;

export type EventBus<M extends Record<string, unknown>> = {
  on<K extends keyof M>(event: K, handler: EventHandler<M[K]>): () => void;
  off<K extends keyof M>(event: K, handler: EventHandler<M[K]>): void;
  emit<K extends keyof M>(event: K, payload: M[K]): void;
};
