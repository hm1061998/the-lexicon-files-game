import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { createAudioController } from './audioController';

export function useAudioPlayback(src: string) {
  const controller = useMemo(() => createAudioController(src), [src]);
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    () => 'idle' as const,
  );

  useEffect(() => () => controller.dispose(), [controller]);

  return {
    state,
    play: controller.play,
    pause: controller.pause,
    replay: controller.replay,
  };
}
