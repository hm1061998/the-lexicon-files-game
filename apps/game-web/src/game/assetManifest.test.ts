import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { REGISTERED_CASE_IDS, loadCaseDefinition } from '@lexicon/game-content';
import type { TextureEntry } from '@lexicon/shared-types';
import { facingTextureKey, loadSceneTextures, resolveTextureKey } from './assetManifest';

const publicDir = fileURLToPath(new URL('../../public', import.meta.url));
const gameDir = fileURLToPath(new URL('.', import.meta.url));
const cases = REGISTERED_CASE_IDS.map((id) => loadCaseDefinition(id));

describe('content texture manifests', () => {
  it('point at files that exist under public/', () => {
    for (const definition of cases) {
      const entries = [
        ...definition.sharedTextures,
        ...definition.scenes.flatMap((scene) => scene.textures),
      ];
      expect(entries.length).toBeGreaterThan(0);
      for (const { url } of entries) expect(existsSync(`${publicDir}${url}`), url).toBe(true);
    }
  });

  it('point evidence images at files that exist under public/', () => {
    for (const definition of cases) {
      const images = definition.evidences.flatMap(({ image }) => (image ? [image] : []));
      expect(images.length).toBeGreaterThan(0);
      for (const url of images) expect(existsSync(`${publicDir}${url}`), url).toBe(true);
    }
  });

  it('map all four player facings', () => {
    for (const definition of cases) {
      const shared = new Set(definition.sharedTextures.map(({ key }) => key));
      for (const facing of ['NE', 'SE', 'SW', 'NW'] as const) {
        expect(shared.has(definition.characterSheets.player.idle[facing]), facing).toBe(true);
      }
    }
  });

  it('declare walk sheets as 8x4 spritesheets of 160 px frames', () => {
    for (const definition of cases) {
      for (const [name, sheet] of Object.entries(definition.characterSheets)) {
        if (sheet.walk === null) continue;
        const entry = definition.sharedTextures.find(({ key }) => key === sheet.walk);
        expect(entry, name).toMatchObject({ frameWidth: 160, frameHeight: 160 });
        // PNG IHDR: width and height are big-endian at bytes 16 and 20.
        const png = readFileSync(`${publicDir}${entry!.url}`);
        expect([png.readUInt32BE(16), png.readUInt32BE(20)], name).toEqual([1280, 640]);
      }
    }
  });

  it('declares and ships a walk sheet for each NPC actor', () => {
    for (const name of ['anna', 'leo', 'david']) {
      const definition = cases[0]!;
      const sheet = definition.characterSheets[name];
      expect(sheet?.walk).toBe(`sheet_${name}_walk`);
      const entry = definition.sharedTextures.find(({ key }) => key === sheet?.walk);
      expect(entry?.url).toBe(`/assets/characters/${name}/chr_${name}_walk.png`);
      expect(existsSync(`${publicDir}${entry?.url}`)).toBe(true);
    }
  });

  it('declare per scene only textures that the scene assets use', () => {
    for (const definition of cases) {
      for (const scene of definition.scenes) {
        const used = new Set(scene.assets.map(({ texture }) => texture));
        for (const { key } of scene.textures)
          expect(used.has(key), `${scene.id}:${key}`).toBe(true);
      }
    }
  });
});

describe('Phaser game source', () => {
  const sourceFiles = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) return sourceFiles(path);
      return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
    });

  it('has no case-specific character ids, case ids or asset urls', () => {
    const forbidden = /\b(?:anna|leo|david)\b|case-001|\/assets\//i;
    const files = sourceFiles(gameDir);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const match = forbidden.exec(readFileSync(file, 'utf8'));
      expect(match?.[0], file).toBeUndefined();
    }
  });
});

describe('facingTextureKey', () => {
  it('reads the key for a facing from the content map', () => {
    const map = { NE: 'a_ne', SE: 'a_se', SW: 'a_sw', NW: 'a_nw' };
    expect(facingTextureKey(map, 'NE')).toBe('a_ne');
    expect(facingTextureKey(map, 'SW')).toBe('a_sw');
  });
});

type Listener = (file: { key: string }) => void;

function fakeScene(existing: string[], failing: string[] = [], autoComplete = true) {
  const listeners = new Map<string, Listener[]>();
  const sceneListeners = new Map<string, Array<() => void>>();
  const queued: TextureEntry[] = [];
  const on = (event: string, fn: Listener) => {
    listeners.set(event, [...(listeners.get(event) ?? []), fn]);
  };
  const off = (event: string, fn: Listener) => {
    listeners.set(
      event,
      (listeners.get(event) ?? []).filter((candidate) => candidate !== fn),
    );
  };
  const emit = (event: string, file: { key: string }) => {
    for (const fn of listeners.get(event) ?? []) fn(file);
  };
  const emitScene = (event: string) => {
    for (const fn of [...(sceneListeners.get(event) ?? [])]) fn();
  };
  const sceneEvents = {
    on: vi.fn((event: string, fn: () => void) => {
      sceneListeners.set(event, [...(sceneListeners.get(event) ?? []), fn]);
    }),
    once: vi.fn((event: string, fn: () => void) => {
      const wrapped = () => {
        sceneEvents.off(event, wrapped);
        fn();
      };
      sceneListeners.set(event, [...(sceneListeners.get(event) ?? []), wrapped]);
    }),
    off: vi.fn((event: string, fn: () => void) => {
      sceneListeners.set(
        event,
        (sceneListeners.get(event) ?? []).filter((candidate) => candidate !== fn),
      );
    }),
  };
  const load = {
    image: vi.fn((key: string, url: string) => queued.push({ key, url })),
    spritesheet: vi.fn((key: string, url: string) => queued.push({ key, url })),
    on: vi.fn(on),
    off: vi.fn(off),
    once: vi.fn((event: string, fn: Listener) => {
      const wrapped: Listener = (file) => {
        off(event, wrapped);
        fn(file);
      };
      on(event, wrapped);
    }),
    start: vi.fn(() => {
      if (!autoComplete) return;
      // Simulate the async loader: report failures, add the rest, then complete.
      queueMicrotask(() => {
        for (const entry of queued.splice(0)) {
          if (failing.includes(entry.key)) emit('loaderror', entry);
          else existing.push(entry.key);
        }
        emit('complete', { key: '' });
      });
    }),
  };
  const scene = {
    load,
    events: sceneEvents,
    textures: { exists: (key: string) => existing.includes(key) },
  };
  return { scene: scene as never, load, listeners, sceneListeners, emitScene };
}

describe('loadSceneTextures', () => {
  const entries: TextureEntry[] = [
    { key: 'tex_a', url: '/a.png' },
    { key: 'tex_b', url: '/b.png' },
  ];

  it('queues only textures that are not loaded yet and resolves on complete', async () => {
    const { scene, load } = fakeScene(['tex_a']);
    await loadSceneTextures(scene, entries);
    expect(load.image).toHaveBeenCalledTimes(1);
    expect(load.image).toHaveBeenCalledWith('tex_b', '/b.png');
    expect(load.start).toHaveBeenCalledTimes(1);
  });

  it('queues an entry with frame dimensions as a spritesheet', async () => {
    const { scene, load } = fakeScene([]);
    await loadSceneTextures(scene, [
      { key: 'sheet_walk', url: '/walk.png', frameWidth: 160, frameHeight: 160 },
    ]);
    expect(load.image).not.toHaveBeenCalled();
    expect(load.spritesheet).toHaveBeenCalledWith('sheet_walk', '/walk.png', {
      frameWidth: 160,
      frameHeight: 160,
    });
  });

  it('resolves without starting the loader when everything is loaded', async () => {
    const { scene, load } = fakeScene(['tex_a', 'tex_b']);
    await loadSceneTextures(scene, entries);
    expect(load.image).not.toHaveBeenCalled();
    expect(load.start).not.toHaveBeenCalled();
  });

  it('warns with [Assets] on a failed file, still resolves and removes its listener', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { scene, listeners } = fakeScene([], ['tex_b']);
    await loadSceneTextures(scene, entries);
    expect(warn).toHaveBeenCalledWith('[Assets] failed to load tex_b');
    expect(listeners.get('loaderror') ?? []).toHaveLength(0);
    warn.mockRestore();
  });

  it.each(['shutdown', 'destroy'])('settles and cleans listeners on scene %s', async (event) => {
    const { scene, load, listeners, sceneListeners, emitScene } = fakeScene([], [], false);
    const pending = loadSceneTextures(scene, entries);
    emitScene(event);
    await expect(pending).resolves.toBeUndefined();
    expect(listeners.get('loaderror') ?? []).toHaveLength(0);
    expect(sceneListeners.get('shutdown') ?? []).toHaveLength(0);
    expect(sceneListeners.get('destroy') ?? []).toHaveLength(0);
    expect(load.off).toHaveBeenCalledTimes(2);
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
