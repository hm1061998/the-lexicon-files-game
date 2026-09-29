import type Phaser from 'phaser';
import { PAPER_OVERLAY_KEY } from './constants';
import type { Facing } from './systems/direction';

export type TextureManifestEntry = { readonly key: string; readonly url: string };

const FACINGS: readonly Facing[] = ['NE', 'SE', 'SW', 'NW'];
const CHARACTERS = ['player', 'anna', 'leo', 'david'] as const;

export function facingTextureKey(character: string, facing: Facing): string {
  return `tex_${character}_${facing.toLowerCase()}`;
}

const characterEntries: TextureManifestEntry[] = CHARACTERS.flatMap((character) =>
  FACINGS.map((facing) => ({
    key: facingTextureKey(character, facing),
    url: `/assets/characters/${character}/chr_${character}_idle_${facing.toLowerCase()}.png`,
  })),
);

/**
 * Processed art (tools/art-codegen, Phase 11 Task 5) used by the case scenes; ph_* placeholders
 * stay as fallbacks. Unused props and the diagonal wall slabs are left out so they are not preloaded.
 */
export const TEXTURE_MANIFEST: readonly TextureManifestEntry[] = [
  { key: 'tex_office_floor', url: '/assets/environment/office/scene_office_floor.png' },
  { key: 'tex_archive_floor', url: '/assets/environment/archive/scene_archive_floor.png' },
  { key: 'tex_office_desk', url: '/assets/environment/props/prop_office_desk_01.png' },
  { key: 'tex_note', url: '/assets/environment/props/prop_note_01.png' },
  { key: 'tex_audio_recorder', url: '/assets/environment/props/prop_audio_recorder_01.png' },
  { key: 'tex_door_hallway', url: '/assets/environment/props/prop_door_hallway_01.png' },
  {
    key: 'tex_security_terminal',
    url: '/assets/environment/props/prop_security_terminal_01.png',
  },
  ...characterEntries,
  { key: PAPER_OVERLAY_KEY, url: '/assets/textures/paper_texture.png' },
];

export function loadTextureManifest(scene: Phaser.Scene): void {
  for (const { key, url } of TEXTURE_MANIFEST) scene.load.image(key, url);
}

/** Returns `key` when loaded, otherwise warns and returns the placeholder fallback. */
export function resolveTextureKey(
  scene: Phaser.Scene,
  key: string,
  fallback = 'ph_missing',
): string {
  if (scene.textures.exists(key)) return key;
  console.warn(`[Scene] missing texture ${key}`);
  return fallback;
}
