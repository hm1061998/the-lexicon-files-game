import { describe, expect, it } from 'vitest';
import { parseSceneDefinition } from './scene';
import { ContentValidationError } from '../loader/ContentValidationError';
import mainOffice from '../../cases/case-001/scenes/main_office.json';
import archive from '../../cases/case-001/scenes/archive.json';

describe('parseSceneDefinition', () => {
  it('accepts the Main Office scene', () => {
    const scene = parseSceneDefinition(mainOffice, 'main_office.json');
    expect(scene.id).toBe('main_office');
  });

  it('accepts the optional fixed dimetric 2:1 projection metadata', () => {
    const scene = parseSceneDefinition(
      {
        ...(mainOffice as Record<string, unknown>),
        projection: {
          type: 'dimetric-2:1',
          originX: 0,
          originY: 0,
          tileWidth: 128,
          tileHeight: 64,
        },
      },
      'main_office.json',
    );
    expect(scene.projection?.type).toBe('dimetric-2:1');
  });

  it('accepts a logical asset position and a tabletop attachment', () => {
    const raw = structuredClone(mainOffice) as {
      assets: Array<Record<string, unknown>>;
    };
    const texture = raw.assets[0]!.texture;
    raw.assets[0] = {
      id: 'desk',
      type: 'prop',
      texture,
      position: { u: 2, v: 3 },
      origin: [0.5, 1],
      scale: 1,
      depthBias: 0,
    };
    raw.assets.push({
      id: 'test_surface_item',
      type: 'interactable',
      texture,
      restsOn: 'desk',
      surfaceOffset: { u: 0.25, v: -0.5, elevationPx: 44 },
      origin: [0.5, 0.5],
      scale: 1,
      depthBias: 0,
    });

    expect(() => parseSceneDefinition(raw, 'main_office.json')).not.toThrow();
  });

  it('rejects an isometric surface child without a complete finite surface offset', () => {
    const raw = structuredClone(mainOffice) as {
      assets: Array<Record<string, unknown>>;
    };
    raw.assets.push({
      id: 'paper',
      type: 'interactable',
      texture: 'paper',
      restsOn: 'desk',
      surfaceOffset: { u: 0.25, v: 0, elevationPx: Number.POSITIVE_INFINITY },
      origin: [0.5, 0.5],
      scale: 1,
      depthBias: 0,
    });
    expect(() => parseSceneDefinition(raw, 'bad.json')).toThrow(ContentValidationError);
  });

  it.each([
    { type: 'dimetric-3:2', originX: 0, originY: 0, tileWidth: 128, tileHeight: 64 },
    { type: 'dimetric-2:1', originX: 0, originY: 0, tileWidth: 96, tileHeight: 64 },
    { type: 'dimetric-2:1', originX: 0, originY: Number.NaN, tileWidth: 128, tileHeight: 64 },
    { type: 'dimetric-2:1', originX: Number.POSITIVE_INFINITY, originY: 0, tileWidth: 128, tileHeight: 64 },
  ])('rejects invalid projection metadata: %o', (projection) => {
    expect(() =>
      parseSceneDefinition({ ...(mainOffice as Record<string, unknown>), projection }, 'bad.json'),
    ).toThrow(ContentValidationError);
  });

  it('accepts named spawn points and an interaction scene transition', () => {
    const raw = structuredClone(mainOffice) as {
      spawn?: unknown;
      spawnPoints?: unknown;
      assets: Array<{ id: string; interaction?: Record<string, unknown> }>;
    };
    delete raw.spawn;
    raw.spawnPoints = {
      default: { x: 1200, y: 1100 },
      from_archive: { x: 2050, y: 720 },
    };
    const door = raw.assets.find(({ id }) => id === 'hallway_door')!;
    door.interaction = {
      x: 0,
      y: 20,
      radius: 80,
      prompt: 'Ra hành lang',
      transition: { targetSceneId: 'archive', targetSpawnId: 'from_office' },
    };

    const scene = parseSceneDefinition(raw, 'main_office.json');

    expect(scene.spawnPoints).toEqual({
      default: { x: 1200, y: 1100 },
      from_archive: { x: 2050, y: 720 },
    });
    expect(scene.assets.find(({ id }) => id === 'hallway_door')?.interaction?.transition).toEqual({
      targetSceneId: 'archive',
      targetSpawnId: 'from_office',
    });
  });

  it('rejects scene without a default named spawn point', () => {
    const raw = structuredClone(mainOffice) as {
      spawn?: unknown;
      spawnPoints?: unknown;
    };
    delete raw.spawn;
    raw.spawnPoints = { from_archive: { x: 2050, y: 720 } };

    expect(() => parseSceneDefinition(raw, 'main_office.json')).toThrow(ContentValidationError);
  });

  it('rejects missing spawn', () => {
    const raw = { ...(mainOffice as Record<string, unknown>) };
    delete raw.spawnPoints;
    try {
      parseSceneDefinition(raw, 'main_office.json');
      throw new Error('expected parseSceneDefinition to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ContentValidationError);
      const validationError = err as ContentValidationError;
      expect(validationError.issues.some((issue) => issue.includes('spawn'))).toBe(true);
    }
  });

  it('rejects duplicate asset ids', () => {
    const raw = mainOffice as { assets: Array<Record<string, unknown>> };
    const duplicated = {
      ...raw,
      assets: [...raw.assets, { ...raw.assets[0] }],
    };
    try {
      parseSceneDefinition(duplicated, 'main_office.json');
      throw new Error('expected parseSceneDefinition to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ContentValidationError);
      const validationError = err as ContentValidationError;
      expect(
        validationError.issues.some(
          (issue) => issue.includes('assets') && issue.includes('duplicate'),
        ),
      ).toBe(true);
    }
  });

  it('rejects spawn outside worldBounds', () => {
    const raw = {
      ...(mainOffice as Record<string, unknown>),
      spawnPoints: {
        ...(mainOffice as { spawnPoints: Record<string, unknown> }).spawnPoints,
        default: { x: -50, y: -50 },
      },
    };
    try {
      parseSceneDefinition(raw, 'main_office.json');
      throw new Error('expected parseSceneDefinition to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ContentValidationError);
      const validationError = err as ContentValidationError;
      expect(validationError.issues.some((issue) => issue.includes('spawn'))).toBe(true);
    }
  });

  it('defaults asset scale to 1 and accepts an explicit positive scale', () => {
    const raw = mainOffice as { assets: Array<Record<string, unknown>> };
    const assets = raw.assets.map((asset, index) => {
      const rest = { ...asset };
      delete rest.scale;
      return index === 0 ? rest : { ...rest, scale: 0.5 };
    });
    const scene = parseSceneDefinition({ ...raw, assets }, 'main_office.json');
    expect(scene.assets[0]?.scale).toBe(1);
    expect(scene.assets[1]?.scale).toBe(0.5);
  });

  it('rejects a non-positive asset scale', () => {
    const raw = mainOffice as { assets: Array<Record<string, unknown>> };
    const assets = raw.assets.map((asset, index) => (index === 0 ? { ...asset, scale: 0 } : asset));
    try {
      parseSceneDefinition({ ...raw, assets }, 'main_office.json');
      throw new Error('expected parseSceneDefinition to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ContentValidationError);
      const validationError = err as ContentValidationError;
      expect(validationError.issues.some((issue) => issue.includes('scale'))).toBe(true);
    }
  });

  it('rejects interaction radius 0', () => {
    const raw = mainOffice as { assets: Array<Record<string, unknown>> };
    const assets = raw.assets.map((asset, index) =>
      index === 0 ? { ...asset, interaction: { x: 0, y: 0, radius: 0 } } : asset,
    );
    try {
      parseSceneDefinition({ ...raw, assets }, 'main_office.json');
      throw new Error('expected parseSceneDefinition to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ContentValidationError);
      const validationError = err as ContentValidationError;
      expect(validationError.issues.some((issue) => issue.includes('radius'))).toBe(true);
    }
  });

  it('rejects interaction without prompt', () => {
    const raw = mainOffice as { assets: Array<Record<string, unknown>> };
    const assets = raw.assets.map((asset, index) =>
      index === 3 ? { ...asset, interaction: { x: 0, y: 0, radius: 90 } } : asset,
    );
    try {
      parseSceneDefinition({ ...raw, assets }, 'main_office.json');
      throw new Error('expected parseSceneDefinition to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ContentValidationError);
      const validationError = err as ContentValidationError;
      expect(validationError.issues.some((issue) => issue.includes('prompt'))).toBe(true);
    }
  });

  it('error message names the source file', () => {
    const raw = { ...(mainOffice as Record<string, unknown>) };
    delete raw.spawnPoints;
    try {
      parseSceneDefinition(raw, 'main_office.json');
      throw new Error('expected parseSceneDefinition to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ContentValidationError);
      expect((err as Error).message).toContain('main_office.json');
    }
  });
});

describe('scene textures', () => {
  type RawScene = {
    textures: Array<{ key: string; url: string }>;
    assets: Array<{ id: string; texture: string }>;
  };
  const withTextures = (edit: (raw: RawScene) => void): unknown => {
    const raw = structuredClone(mainOffice) as unknown as RawScene;
    edit(raw);
    return raw;
  };
  const issuesOf = (raw: unknown): string[] => {
    try {
      parseSceneDefinition(raw, 'main_office.json');
    } catch (err) {
      expect(err).toBeInstanceOf(ContentValidationError);
      return (err as ContentValidationError).issues;
    }
    throw new Error('expected parseSceneDefinition to throw');
  };

  it('accepts the real Main Office and Archive textures', () => {
    for (const [raw, source] of [
      [mainOffice, 'main_office.json'],
      [archive, 'archive.json'],
    ] as const) {
      const scene = parseSceneDefinition(raw, source);
      expect(scene.textures.length).toBeGreaterThan(0);
      for (const { url } of scene.textures) expect(url.startsWith('/assets/')).toBe(true);
    }
  });

  it('rejects a texture url outside /assets/', () => {
    const issues = issuesOf(
      withTextures((raw) => {
        raw.textures[0]!.url = '/images/floor.png';
      }),
    );
    expect(issues.some((issue) => issue.includes('textures') && issue.includes('/assets/'))).toBe(
      true,
    );
  });

  it('rejects a texture url that climbs out with ".."', () => {
    const issues = issuesOf(
      withTextures((raw) => {
        raw.textures[0]!.url = '/assets/../secret.png';
      }),
    );
    expect(issues.some((issue) => issue.includes('textures'))).toBe(true);
  });

  it('rejects duplicate texture keys within a scene', () => {
    const issues = issuesOf(
      withTextures((raw) => {
        raw.textures.push({ ...raw.textures[0]! });
      }),
    );
    expect(
      issues.some((issue) => issue.includes('duplicate texture key') && issue.includes(raw0Key())),
    ).toBe(true);
  });

  it('rejects an asset texture that is not declared in textures, naming scene and key', () => {
    const issues = issuesOf(
      withTextures((raw) => {
        raw.assets[0]!.texture = 'tex_not_declared';
      }),
    );
    expect(
      issues.some(
        (issue) =>
          issue.includes('main_office') &&
          issue.includes('tex_not_declared') &&
          issue.includes('textures'),
      ),
    ).toBe(true);
  });

  it('accepts ph_* placeholder textures without a declaration', () => {
    const raw = withTextures((scene) => {
      scene.assets[0]!.texture = 'ph_missing';
    });
    expect(parseSceneDefinition(raw, 'main_office.json').assets[0]?.texture).toBe('ph_missing');
  });
});

function raw0Key(): string {
  return (mainOffice as unknown as { textures: Array<{ key: string }> }).textures[0]!.key;
}

describe('scene labels', () => {
  type RawLabel = { id: string; text: string; x: number; y: number; angle?: number };
  const withLabels = (labels: RawLabel[]): unknown => ({
    ...(structuredClone(mainOffice) as Record<string, unknown>),
    labels,
  });
  const issuesOf = (raw: unknown): string[] => {
    try {
      parseSceneDefinition(raw, 'main_office.json');
    } catch (err) {
      expect(err).toBeInstanceOf(ContentValidationError);
      return (err as ContentValidationError).issues;
    }
    throw new Error('expected parseSceneDefinition to throw');
  };

  it('accepts room labels with an optional angle', () => {
    const scene = parseSceneDefinition(
      withLabels([
        { id: 'room_a', text: 'PHÒNG A', x: 400, y: 800 },
        { id: 'room_b', text: 'PHÒNG B', x: 1400, y: 900, angle: -4 },
      ]),
      'main_office.json',
    );
    expect(scene.labels).toEqual([
      { id: 'room_a', text: 'PHÒNG A', x: 400, y: 800 },
      { id: 'room_b', text: 'PHÒNG B', x: 1400, y: 900, angle: -4 },
    ]);
  });

  it('keeps labels optional', () => {
    const raw = structuredClone(mainOffice) as Record<string, unknown>;
    delete raw.labels;
    expect(parseSceneDefinition(raw, 'main_office.json').labels).toBeUndefined();
  });

  it('rejects an empty or blank label text', () => {
    for (const text of ['', '   ']) {
      const issues = issuesOf(withLabels([{ id: 'room_a', text, x: 400, y: 800 }]));
      expect(issues.some((issue) => issue.includes('labels'))).toBe(true);
    }
  });

  it('rejects duplicate label ids', () => {
    const issues = issuesOf(
      withLabels([
        { id: 'room_a', text: 'A', x: 400, y: 800 },
        { id: 'room_a', text: 'B', x: 500, y: 800 },
      ]),
    );
    expect(
      issues.some((issue) => issue.includes('labels') && issue.includes('duplicate label id')),
    ).toBe(true);
  });

  it('rejects a label outside worldBounds', () => {
    const issues = issuesOf(withLabels([{ id: 'room_a', text: 'A', x: 400, y: 20 }]));
    expect(issues.some((issue) => issue.includes('labels') && issue.includes('worldBounds'))).toBe(
      true,
    );
  });

  it('gives every real scene at least one uniquely named room label', () => {
    for (const [raw, source] of [
      [mainOffice, 'main_office.json'],
      [archive, 'archive.json'],
    ] as const) {
      const labels = parseSceneDefinition(raw, source).labels ?? [];
      expect(labels.length, source).toBeGreaterThan(0);
      expect(new Set(labels.map(({ id }) => id)).size, source).toBe(labels.length);
    }
  });
});
