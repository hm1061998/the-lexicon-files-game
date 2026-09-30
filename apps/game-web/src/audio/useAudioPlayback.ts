import { useEffect, useState, useSyncExternalStore } from 'react';
import { createAudioController, type AudioController } from './audioController';

const noOp = () => undefined;
const subscribeToNothing = () => () => undefined;

export function useAudioPlayback(src: string, onPlayingChange?: (playing: boolean) => void) {
  const [controller, setController] = useState<AudioController | null>(null);

  useEffect(() => {
    const nextController = createAudioController(src);
    setController(nextController);
    return () => nextController.dispose();
  }, [src]);

  const state = useSyncExternalStore(
    controller?.subscribe ?? subscribeToNothing,
    controller?.getSnapshot ?? (() => 'idle' as const),
    () => 'idle' as const,
  );

  useEffect(() => {
    onPlayingChange?.(state === 'playing');
    return () => onPlayingChange?.(false);
  }, [onPlayingChange, state]);

  return {
    state,
    play: controller?.play ?? noOp,
    pause: controller?.pause ?? noOp,
    replay: controller?.replay ?? noOp,
  };
}
