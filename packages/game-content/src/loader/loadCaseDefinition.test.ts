import { describe, expect, it } from 'vitest';
import { ContentValidationError } from './ContentValidationError';
import { loadCaseDefinition } from './loadCaseDefinition';

describe('loadCaseDefinition', () => {
  it('loads the minimal case, including its scene, evidence, fact, and objective', () => {
    const definition = loadCaseDefinition('case-001');
    expect(definition.scenes.map((scene) => scene.id)).toEqual(['main_office']);
    expect(definition.vocabulary).toHaveLength(20);
    expect(definition.vocabularyContexts).toContainEqual({
      id: 'evidence:meeting_minutes:description',
      vocabularyIds: expect.arrayContaining(['meeting', 'leave', 'client']),
    });
    expect(definition.evidences.map((item) => item.id)).toEqual(['meeting_minutes']);
    expect(definition.facts.map((item) => item.id)).toEqual([
      'meeting_started',
      'david_statement_no_entry_after_20_00',
      'david_collected_folder',
      'david_took_report',
    ]);
    expect(definition.objectives.map((item) => item.id)).toEqual([
      'find_what_happened',
      'talk_to_everyone',
    ]);
  });

  it('Case #001 exposes meeting_minutes as a collectible scene interaction', () => {
    const definition = loadCaseDefinition('case-001');
    const scene = definition.scenes.find((item) => item.id === 'main_office');
    const interaction = scene?.assets.find((item) => item.id === 'meeting_minutes')?.interaction;

    expect(interaction?.prompt).toBeTruthy();
    expect(interaction?.effects).toEqual([{ type: 'addEvidence', evidenceId: 'meeting_minutes' }]);
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
