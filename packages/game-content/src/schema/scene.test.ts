import { describe, expect, it } from 'vitest';
import { parseSceneDefinition } from './scene';
import { ContentValidationError } from '../loader/ContentValidationError';
import mainOffice from '../../cases/case-001/scenes/main_office.json';

describe('parseSceneDefinition', () => {
  it('accepts the Main Office scene', () => {
    const scene = parseSceneDefinition(mainOffice, 'main_office.json');
    expect(scene.id).toBe('main_office');
  });

  it('rejects missing spawn', () => {
    const raw = { ...(mainOffice as Record<string, unknown>) };
    delete raw.spawn;
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
    const raw = { ...(mainOffice as Record<string, unknown>), spawn: { x: -50, y: -50 } };
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
    delete raw.spawn;
    try {
      parseSceneDefinition(raw, 'main_office.json');
      throw new Error('expected parseSceneDefinition to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ContentValidationError);
      expect((err as Error).message).toContain('main_office.json');
    }
  });
});
