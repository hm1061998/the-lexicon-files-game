import { describe, expect, it } from 'vitest';
import { loadSceneDefinition, DEFAULT_START } from './loadScene';
import { ContentValidationError } from './ContentValidationError';

describe('loadSceneDefinition', () => {
  it('loads DEFAULT_START scene', () => {
    const scene = loadSceneDefinition(DEFAULT_START.caseId, DEFAULT_START.sceneId);
    expect(scene.id).toBe(DEFAULT_START.sceneId);
  });

  it('unknown scene throws ContentValidationError mentioning case and scene id', () => {
    try {
      loadSceneDefinition('case-001', 'unknown_scene');
      throw new Error('expected loadSceneDefinition to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ContentValidationError);
      const validationError = err as ContentValidationError;
      expect(validationError.message).toContain('case-001');
      expect(validationError.message).toContain('unknown_scene');
    }
  });
});
