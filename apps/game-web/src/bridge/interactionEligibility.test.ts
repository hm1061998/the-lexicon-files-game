import { describe, expect, it } from 'vitest';
import { loadCaseDefinition } from '@lexicon/game-content';
import { createGameStore } from '../state/gameStore';
import { createInteractionEligibilitySource } from './interactionEligibility';

describe('interaction eligibility', () => {
  it('hides evidence interactables after their evidence is collected', () => {
    const definition = loadCaseDefinition('case-001');
    const store = createGameStore({ caseDefinition: definition });
    const source = createInteractionEligibilitySource(store, definition);
    expect(source.isAvailable('main_office', 'phone_recording')).toBe(true);
    store.getState().applyCaseEffects([{ type: 'addEvidence', evidenceId: 'leo_phone_recording' }]);
    expect(source.isAvailable('main_office', 'phone_recording')).toBe(false);
  });

  it('keeps non-evidence interactions available and rejects unknown ids', () => {
    const definition = loadCaseDefinition('case-001');
    const source = createInteractionEligibilitySource(
      createGameStore({ caseDefinition: definition }),
      definition,
    );
    expect(source.isAvailable('main_office', 'hallway_door')).toBe(true);
    expect(source.isAvailable('main_office', 'unknown')).toBe(false);
  });
});
