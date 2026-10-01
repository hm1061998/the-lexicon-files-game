import { describe, expect, it } from 'vitest';
import { caseAudioDefinitionSchema, dialogueAudioSchema } from './audio';

describe('case audio schema', () => {
  it('allows only local traversal-safe audio URLs and SHA-256 text hashes', () => {
    expect(
      dialogueAudioSchema.safeParse({ url: '/audio/case-001/anna.wav', textSha256: 'a'.repeat(64) })
        .success,
    ).toBe(true);
    for (const url of [
      'https://example.com/voice.wav',
      '/audio/../secret.wav',
      '/assets/voice.wav',
    ])
      expect(dialogueAudioSchema.safeParse({ url, textSha256: 'a'.repeat(64) }).success).toBe(
        false,
      );
  });
  it('requires two footstep variants while allowing legacy cases without audio', () => {
    const sfx = {
      footstep: ['/audio/a.wav', '/audio/b.wav'],
      paper: ['/audio/a.wav'],
      ui: ['/audio/a.wav'],
      evidence: ['/audio/a.wav'],
      door: ['/audio/a.wav'],
      dialogue: ['/audio/a.wav'],
    };
    expect(caseAudioDefinitionSchema.safeParse({ sfx }).success).toBe(true);
    expect(
      caseAudioDefinitionSchema.safeParse({ sfx: { ...sfx, footstep: ['/audio/a.wav'] } }).success,
    ).toBe(false);
  });

  it('accepts an optional local music loop and rejects remote or traversal paths', () => {
    const sfx = {
      footstep: ['/audio/a.wav', '/audio/b.wav'],
      paper: ['/audio/a.wav'],
      ui: ['/audio/a.wav'],
      evidence: ['/audio/a.wav'],
      door: ['/audio/a.wav'],
      dialogue: ['/audio/a.wav'],
    };
    expect(
      caseAudioDefinitionSchema.safeParse({ sfx, music: '/audio/case-001/music.ogg' }).success,
    ).toBe(true);
    expect(
      caseAudioDefinitionSchema.safeParse({ sfx, music: 'https://example.com/music.ogg' }).success,
    ).toBe(false);
    expect(caseAudioDefinitionSchema.safeParse({ sfx, music: '/audio/../music.ogg' }).success).toBe(
      false,
    );
  });
});
