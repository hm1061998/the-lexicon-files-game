import { describe, expect, it } from 'vitest';
import { loadSceneDefinition } from './loadScene';
import { loadCaseDefinition, REGISTERED_CASE_IDS } from './loadCaseDefinition';
import { ContentValidationError } from './ContentValidationError';

describe('loadSceneDefinition', () => {
  it("loads each registered case's start scene", () => {
    for (const caseId of REGISTERED_CASE_IDS) {
      const { startSceneId } = loadCaseDefinition(caseId);
      expect(loadSceneDefinition(caseId, startSceneId).id).toBe(startSceneId);
    }
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
