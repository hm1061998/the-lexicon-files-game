import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadCaseDefinition } from './loadCaseDefinition';
import { listCaseCatalogue } from './caseCatalogue';

const registry = vi.hoisted(() => ({ ids: ['case-001'] }));
vi.mock('./loadCaseDefinition', async (importOriginal) => {
  const original = await importOriginal<typeof import('./loadCaseDefinition')>();
  return {
    ...original,
    REGISTERED_CASE_IDS: registry.ids,
    loadCaseDefinition: vi.fn(original.loadCaseDefinition),
  };
});
afterEach(() => {
  registry.ids.splice(0, registry.ids.length, 'case-001');
  vi.mocked(loadCaseDefinition).mockRestore();
});

describe('case catalogue', () => {
  it('lists registered cases in registration order with computed stats', () => {
    const definition = loadCaseDefinition('case-001');
    registry.ids.push('another-case');
    vi.mocked(loadCaseDefinition).mockImplementation((id) => ({ ...definition, id }));
    const entries = listCaseCatalogue();
    expect(entries.map(({ id }) => id)).toEqual(['case-001', 'another-case']);
    expect(entries[0]).toMatchObject({
      title: 'The Missing Report',
      stats: { suspects: 3, clues: 5, contradictions: 1, scenes: 2 },
    });
    expect(entries[0]?.difficulty).toEqual(definition.difficulty);
  });
  it('derives stats from the parsed definition, not from authored fields', () => {
    const definition = loadCaseDefinition('case-001');
    vi.mocked(loadCaseDefinition).mockReturnValue({
      ...definition,
      evidenceTotal: 8,
      conclusion: undefined,
      contradictions: [],
      scenes: definition.scenes.slice(0, 1),
    });
    expect(listCaseCatalogue()[0]?.stats).toEqual({
      suspects: 0,
      clues: 8,
      contradictions: 0,
      scenes: 1,
    });
  });
});
