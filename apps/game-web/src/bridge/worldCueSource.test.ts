import { describe, expect, it } from 'vitest';
import { loadCaseDefinition } from '@lexicon/game-content';
import { createGameStore } from '../state/gameStore';
import { createWorldCueSource } from './worldCueSource';

describe('world cue source', () => {
  it('shows uncollected evidence and exits, then removes evidence after collection', () => {
    const definition = loadCaseDefinition('case-001');
    const store = createGameStore({ caseDefinition: definition });
    const source = createWorldCueSource(store, definition);
    expect(source.visibleIds('main_office')).toEqual(
      new Set(['meeting_minutes', 'phone_recording', 'hallway_door']),
    );
    store.getState().applyCaseEffects([{ type: 'addEvidence', evidenceId: 'meeting_minutes' }]);
    expect(source.visibleIds('main_office')).not.toContain('meeting_minutes');
    expect(source.visibleIds('archive')).toContain('PLACEHOLDER_archive_door');
  });

  it('hides a condition-gated cue until its reveal evidence exists', () => {
    const definition = structuredClone(loadCaseDefinition('case-001'));
    const minutes = definition.scenes
      .find(({ id }) => id === 'main_office')!
      .assets.find(({ id }) => id === 'meeting_minutes')!;
    if (minutes.cue)
      minutes.cue.visibleWhen = { type: 'hasEvidence', evidenceId: 'leo_phone_recording' };
    const store = createGameStore({ caseDefinition: definition });
    const source = createWorldCueSource(store, definition);
    expect(source.visibleIds('main_office')).not.toContain('meeting_minutes');
    store.getState().applyCaseEffects([{ type: 'addEvidence', evidenceId: 'leo_phone_recording' }]);
    expect(source.visibleIds('main_office')).toContain('meeting_minutes');
  });
});
