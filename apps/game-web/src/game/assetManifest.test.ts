import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { loadCaseDefinition } from '@lexicon/game-content';
import { PAPER_OVERLAY_KEY } from './constants';
import {
  TEXTURE_MANIFEST,
  facingTextureKey,
  loadTextureManifest,
  resolveTextureKey,
} from './assetManifest';

const publicDir = fileURLToPath(new URL('../../public', import.meta.url));

describe('TEXTURE_MANIFEST', () => {
  it('serves every texture from /assets/', () => {
    for (const entry of TEXTURE_MANIFEST) expect(entry.url.startsWith('/assets/')).toBe(true);
  });

  it('uses unique keys', () => {
    const keys = TEXTURE_MANIFEST.map(({ key }) => key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('points at files that exist under public/', () => {
    for (const { url } of TEXTURE_MANIFEST) {
      expect(existsSync(`${publicDir}${url}`), url).toBe(true);
    }
  });

  it('includes all four facings for the player and the real paper texture', () => {
    const keys = TEXTURE_MANIFEST.map(({ key }) => key);
    for (const facing of ['NE', 'SE', 'SW', 'NW'] as const) {
      expect(keys).toContain(facingTextureKey('player', facing));
    }
    expect(keys).toContain(PAPER_OVERLAY_KEY);
  });

  it('covers every non-placeholder texture referenced by case-001 scenes', () => {
    const keys = new Set(TEXTURE_MANIFEST.map(({ key }) => key));
    const sceneTextures = loadCaseDefinition('case-001').scenes.flatMap((scene) =>
      scene.assets.map((asset) => asset.texture),
    );
    for (const texture of sceneTextures) {
      if (texture.startsWith('ph_')) continue;
      expect(keys.has(texture), texture).toBe(true);
    }
  });
});

describe('facingTextureKey', () => {
  it('lowercases the facing into the texture key', () => {
    expect(facingTextureKey('player', 'NE')).toBe('tex_player_ne');
    expect(facingTextureKey('anna', 'SW')).toBe('tex_anna_sw');
  });
});

describe('loadTextureManifest', () => {
  it('queues every manifest entry on the scene loader', () => {
    const image = vi.fn();
    loadTextureManifest({ load: { image } } as never);
    expect(image).toHaveBeenCalledTimes(TEXTURE_MANIFEST.length);
    for (const { key, url } of TEXTURE_MANIFEST) expect(image).toHaveBeenCalledWith(key, url);
  });
});

describe('resolveTextureKey', () => {
  const sceneWith = (keys: string[]) =>
    ({ textures: { exists: (key: string) => keys.includes(key) } }) as never;

  it('returns the key when the texture exists', () => {
    expect(resolveTextureKey(sceneWith(['tex_note']), 'tex_note')).toBe('tex_note');
  });

  it('falls back to ph_missing with a [Scene] warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(resolveTextureKey(sceneWith([]), 'tex_nope')).toBe('ph_missing');
    expect(warn).toHaveBeenCalledWith('[Scene] missing texture tex_nope');
    warn.mockRestore();
  });

  it('accepts a custom fallback', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(resolveTextureKey(sceneWith([]), 'tex_player_se', 'ph_player')).toBe('ph_player');
    warn.mockRestore();
  });
});
