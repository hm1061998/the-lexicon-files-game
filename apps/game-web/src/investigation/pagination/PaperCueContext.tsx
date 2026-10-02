import { createContext, useContext } from 'react';

/** One paper sound per valid page turn; the game shell supplies the real cue, tests use the no-op. */
export const PaperCueContext = createContext<() => void>(() => undefined);
export const usePaperCue = (): (() => void) => useContext(PaperCueContext);
