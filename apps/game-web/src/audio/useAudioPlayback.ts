import { useEffect, useState, useSyncExternalStore } from 'react';
import { createAudioController, type AudioController } from './audioController';
import { startProgressLoop } from './progressLoop';

const noOp = () => undefined;
const subscribeToNothing = () => () => undefined;

export function useAudioPlayback(src: string, onPlayingChange?: (playing: boolean) => void) {
  const [controller, setController] = useState<AudioController | null>(null);
  const [progress, setProgress] = useState(0);

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

  // The frame loop runs only while the recording plays; the settled value covers the rest.
  useEffect(() => {
    if (!controller) return undefined;
    if (state !== 'playing') {
      setProgress(controller.getProgress());
      return undefined;
    }
    return startProgressLoop(controller.getProgress, setProgress);
  }, [controller, state]);

  return {
    state,
    progress,
    duration: controller?.getDuration() ?? 0,
    play: controller?.play ?? noOp,
    pause: controller?.pause ?? noOp,
    replay: controller?.replay ?? noOp,
  };
}
