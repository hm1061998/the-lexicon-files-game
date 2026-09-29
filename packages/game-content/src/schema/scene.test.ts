import { describe, expect, it } from 'vitest';
import { parseSceneDefinition } from './scene';
import { ContentValidationError } from '../loader/ContentValidationError';
import mainOffice from '../../cases/case-001/scenes/main_office.json';

describe('parseSceneDefinition', () => {
  it('accepts the Main Office scene', () => {
    const scene = parseSceneDefinition(mainOffice, 'main_office.json');
    expect(scene.id).toBe('main_office');
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
