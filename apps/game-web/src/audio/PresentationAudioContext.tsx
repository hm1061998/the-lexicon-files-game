import { createContext, useContext, type ReactNode } from 'react';
import type { PresentationAudio } from './presentationAudio';

const PresentationAudioContext = createContext<PresentationAudio | null>(null);

export function PresentationAudioProvider({
  audio,
  children,
}: {
  audio: PresentationAudio;
  children: ReactNode;
}): JSX.Element {
  return (
    <PresentationAudioContext.Provider value={audio}>{children}</PresentationAudioContext.Provider>
  );
}

export function usePresentationAudio(): PresentationAudio {
  const audio = useContext(PresentationAudioContext);
  if (!audio) throw new Error('usePresentationAudio must be used inside PresentationAudioProvider');
  return audio;
}

export function useOptionalPresentationAudio(): PresentationAudio | null {
  return useContext(PresentationAudioContext);
}
