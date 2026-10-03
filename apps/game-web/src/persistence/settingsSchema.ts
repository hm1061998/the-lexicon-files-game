import { z } from 'zod';
import type { TranslationMode } from '@lexicon/shared-types';

export type SubtitlePreference = 'auto' | 'on' | 'off';
export type TextSpeed = 'instant' | 'normal' | 'fast';
export type SettingsV2 = {
  schemaVersion: 2;
  translationMode: TranslationMode;
  volume: number;
  subtitles: SubtitlePreference;
  reducedMotion: boolean;
  textSpeed: TextSpeed;
  uiSounds: boolean;
};

/** Characters per second for the typewriter reveal; `instant` shows the whole line at once. */
export const TEXT_SPEED_CPS = { normal: 45, fast: 90 } as const;

const baseFields = {
  translationMode: z.enum(['Beginner', 'Learning', 'Immersion']),
  volume: z.number().int().min(0).max(100),
  subtitles: z.enum(['auto', 'on', 'off']),
  reducedMotion: z.boolean(),
};

const settingsV1Schema = z
  .object({ schemaVersion: z.literal(1), ...baseFields })
  .strict()
  .transform((v1): SettingsV2 => ({
    ...v1,
    schemaVersion: 2,
    textSpeed: 'normal',
    uiSounds: true,
  }));

const settingsV2Schema = z
  .object({
    schemaVersion: z.literal(2),
    ...baseFields,
    textSpeed: z.enum(['instant', 'normal', 'fast']),
    uiSounds: z.boolean(),
  })
  .strict();

const settingsSchema = z.union([settingsV2Schema, settingsV1Schema]);

export function detectPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function createDefaultSettings(
  options: { prefersReducedMotion?: boolean; translationMode?: TranslationMode } = {},
): SettingsV2 {
  return {
    schemaVersion: 2,
    translationMode: options.translationMode ?? 'Learning',
    volume: 80,
    subtitles: 'auto',
    reducedMotion: options.prefersReducedMotion ?? detectPrefersReducedMotion(),
    textSpeed: 'normal',
    uiSounds: true,
  };
}

/** Accepts a v2 record, or a v1 record that is upgraded with the v2 defaults. */
export function parseSettings(raw: unknown): SettingsV2 {
  return settingsSchema.parse(raw);
}
