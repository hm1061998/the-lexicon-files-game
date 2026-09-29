import type Phaser from 'phaser';
import type { FacingTextureMap, TextureEntry } from '@lexicon/shared-types';
import type { Facing } from './systems/direction';

// Phaser.Loader.Events.FILE_LOAD_ERROR / COMPLETE; literals keep this module free of the
// Phaser runtime so it can be unit tested without a canvas.
const FILE_LOAD_ERROR = 'loaderror';
const LOAD_COMPLETE = 'complete';

/** Texture key for a facing, as declared by content (`CharacterSheet.idle`). */
export function facingTextureKey(textures: FacingTextureMap, facing: Facing): string {
  return textures[facing];
}

export function warnFailedTexture(file: { key: string }): void {
  console.warn(`[Assets] failed to load ${file.key}`);
}

/** Queues on the scene loader every entry whose texture is not in the texture manager yet. */
export function queueMissingTextures(
  scene: Phaser.Scene,
  textures: readonly TextureEntry[],
): number {
  let queued = 0;
  for (const { key, url, frameWidth, frameHeight } of textures) {
    if (scene.textures.exists(key)) continue;
    if (frameWidth !== undefined && frameHeight !== undefined) {
      scene.load.spritesheet(key, url, { frameWidth, frameHeight });
    } else {
      scene.load.image(key, url);
    }
    queued += 1;
  }
  return queued;
}

/**
 * Loads the textures that are not loaded yet, outside of `preload`. Always resolves: a file
 * that fails is reported with `[Assets] failed to load <key>` and its assets fall back to
 * placeholders through `resolveTextureKey`.
 */
export function loadSceneTextures(
  scene: Phaser.Scene,
  textures: readonly TextureEntry[],
): Promise<void> {
  if (queueMissingTextures(scene, textures) === 0) return Promise.resolve();
  const loader = scene.load;
  return new Promise((resolve) => {
    // A dedicated handler so `off` never removes another caller's listener.
    const onError = (file: { key: string }) => warnFailedTexture(file);
    loader.on(FILE_LOAD_ERROR, onError);
    loader.once(LOAD_COMPLETE, () => {
      loader.off(FILE_LOAD_ERROR, onError);
      resolve();
    });
    loader.start();
  });
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
