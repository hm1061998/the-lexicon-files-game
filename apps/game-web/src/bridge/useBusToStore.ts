import { useEffect } from 'react';
import type { EventBus, GameEventMap } from '@lexicon/shared-types';
import type { GameStore } from '../state/gameStore';
import { connectBusToStore } from './connectBusToStore';

/** Keeps the store in sync with bus interaction events for the lifetime of the component. */
export function useBusToStore(bus: EventBus<GameEventMap>, store: GameStore): void {
  useEffect(() => connectBusToStore(bus, store), [bus, store]);
}
