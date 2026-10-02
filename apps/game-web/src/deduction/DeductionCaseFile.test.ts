import { describe, expect, it } from 'vitest';
import { loadCaseDefinition, loadUiStrings } from '@lexicon/game-content';
import { createCaseState } from '@lexicon/game-core';
import { buildCaseFileBlocks } from './DeductionCaseFile';

const strings = loadUiStrings('vi');

describe('buildCaseFileBlocks', () => {
  it('keeps the briefing readable between the title and the objective', () => {
    const definition = loadCaseDefinition('case-001');
    const blocks = buildCaseFileBlocks(definition, createCaseState(definition), strings);
    const ids = blocks.map((block) => block.id);
    expect(ids.slice(0, 6)).toEqual([
      'case:title',
      'briefing:welcome',
      'briefing:incident',
      'briefing:first_step',
      'briefing:sign_off',
      'case:objective',
    ]);
    const incident = blocks.find((block) => block.id === 'briefing:incident');
    expect(incident).toMatchObject({
      kind: 'text',
      contextId: 'briefing:case-001:incident:text',
    });
    expect(incident?.kind === 'text' && incident.spans.length).toBeGreaterThan(0);
  });
  it('is unchanged for a case without a briefing', () => {
    const definition = { ...loadCaseDefinition('case-001'), briefing: undefined };
    const ids = buildCaseFileBlocks(definition, createCaseState(definition), strings).map(
      (block) => block.id,
    );
    expect(ids.some((id) => id.startsWith('briefing:'))).toBe(false);
    expect(ids.slice(0, 2)).toEqual(['case:title', 'case:objective']);
  });
});
