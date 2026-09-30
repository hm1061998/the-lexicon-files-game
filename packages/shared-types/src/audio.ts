export type AudioCue = 'footstep' | 'paper' | 'ui' | 'evidence' | 'door' | 'dialogue';
export interface DialogueAudio {
  readonly url: string;
  readonly textSha256: string;
}
export interface CaseAudioDefinition {
  readonly sfx: Readonly<Record<AudioCue, readonly string[]>>;
}
