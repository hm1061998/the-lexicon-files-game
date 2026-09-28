import { describe, expect, it } from 'vitest';
import { ContentValidationError } from './ContentValidationError';
import { loadCaseDefinition } from './loadCaseDefinition';

describe('loadCaseDefinition', () => {
  it('loads the minimal case, including its scene, evidence, fact, and objective', () => {
    const definition = loadCaseDefinition('case-001');
    expect(definition.scenes.map((scene) => scene.id)).toEqual(['main_office']);
    expect(definition.evidences.map((item) => item.id)).toEqual(['meeting_minutes']);
    expect(definition.facts.map((item) => item.id)).toEqual(['meeting_started']);
    expect(definition.objectives.map((item) => item.id)).toEqual(['find_what_happened']);
  });

  it('throws a content validation error naming an unknown case', () => {
    try {
      loadCaseDefinition('case-999');
      throw new Error('expected loadCaseDefinition to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(ContentValidationError);
      expect((error as ContentValidationError).source).toContain('case-999');
    }
  });
});
