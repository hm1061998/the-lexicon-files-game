import { z } from 'zod';
import type { TranslationMode } from '@lexicon/shared-types';

export type SubtitlePreference = 'auto' | 'on' | 'off';
export type SettingsV1 = {
  schemaVersion: 1;
  translationMode: TranslationMode;
  volume: number;
  subtitles: SubtitlePreference;
  reducedMotion: boolean;
};

const settingsSchema = z
  .object({
    schemaVersion: z.literal(1),
    translationMode: z.enum(['Beginner', 'Learning', 'Immersion']),
    volume: z.number().int().min(0).max(100),
    subtitles: z.enum(['auto', 'on', 'off']),
    reducedMotion: z.boolean(),
  })
  .strict();

export function detectPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function createDefaultSettings(
  options: { prefersReducedMotion?: boolean; translationMode?: TranslationMode } = {},
): SettingsV1 {
  return {
    schemaVersion: 1,
    translationMode: options.translationMode ?? 'Learning',
    volume: 80,
    subtitles: 'auto',
    reducedMotion: options.prefersReducedMotion ?? detectPrefersReducedMotion(),
  };
}

export function parseSettings(raw: unknown): SettingsV1 {
  return settingsSchema.parse(raw);
}
