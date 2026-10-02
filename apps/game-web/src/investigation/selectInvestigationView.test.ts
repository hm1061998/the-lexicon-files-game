import { describe, expect, it } from 'vitest';
import { loadCaseDefinition } from '@lexicon/game-content';
import { createCaseState } from '@lexicon/game-core';
import { selectInvestigationView } from './selectInvestigationView';
import { resolveInvestigationArtwork } from './resolveInvestigationArtwork';
import { resolveVocabularySources } from './resolveVocabularySources';
const definition = loadCaseDefinition('case-001');
const initial = createCaseState(definition);
describe('investigation presentation', () => {
  it('hides undiscovered people, facts and connections and does not expose answer slots', () => {
    const view = selectInvestigationView(definition, initial);
    expect(view.people).toEqual([]);
    expect(view.evidence).toEqual([]);
    expect(view.facts).toEqual([]);
    expect(view.relationships).toEqual([]);
    expect(view.placedEvents).toEqual([]);
    expect(view.availableEvents.map((e) => e.id)).toEqual(['report_missing_21_05']);
    expect(view.availableEvents[0]).not.toHaveProperty('slotId');
    expect(view.confirmedContradictions).toEqual([]);
    expect(view.conclusionAvailable).toBe(false);
  });
  it('keeps content ordering, original recorded statements and confirmed times', () => {
    const view = selectInvestigationView(definition, {
      ...initial,
      flags: { anna_q1_read: true },
      evidenceIds: ['meeting_minutes'],
      discoveredFactIds: ['meeting_started'],
      timelineEventIds: ['report_missing_21_05', 'meeting_started'],
    });
    expect(view.people.map((p) => p.npc.id)).toEqual(['anna']);
    expect(view.people[0]!.statements.map((n) => n.id)).toEqual(['entry', 'answer1']);
    expect(view.evidence.map((e) => e.id)).toEqual(['meeting_minutes']);
    expect(view.placedEvents.map((e) => e.time)).toEqual(['20:00', '21:05']);
    expect(view.relationships).toContainEqual({
      from: 'fact:meeting_started',
      to: 'evidence:meeting_minutes',
    });
    expect(initial.discoveredFactIds).toEqual([]);
  });
  it('adds only discovered source relations and hides unconfirmed explanations', () => {
    const view = selectInvestigationView(definition, {
      ...initial,
      evidenceIds: ['leo_phone_recording'],
      flags: { leo_q1_read: true },
      discoveredFactIds: ['leo_outside_at_2029'],
    });
    expect(view.relationships).toContainEqual({
      from: 'evidence:leo_phone_recording',
      to: 'person:leo',
    });
    expect(view.relationships).toContainEqual({
      from: 'fact:leo_outside_at_2029',
      to: 'evidence:leo_phone_recording',
    });
    expect(view.confirmedContradictions).toEqual([]);
    const confirmed = selectInvestigationView(definition, {
      ...initial,
      contradictionIds: ['david_statement_vs_access_log'],
    });
    expect(confirmed.confirmedContradictions[0]!.explanation).toContain('20:32');
  });
  it('resolves generic content artwork and safely handles missing textures', () => {
    expect(resolveInvestigationArtwork(definition, 'anna')).toBe(
      '/assets/characters/anna/chr_anna_idle_sw.png',
    );
    expect(resolveInvestigationArtwork(definition, 'missing')).toBeUndefined();
    expect(
      resolveInvestigationArtwork({ ...definition, sharedTextures: [], scenes: [] }, 'anna'),
    ).toBeUndefined();
  });
  it('names real vocabulary sources, deduplicates them and drops stale IDs', () => {
    expect(
      resolveVocabularySources(definition, [
        'evidence:meeting_minutes:description',
        'dialogue:anna_initial:answer1:text',
        'dialogue:anna_initial:answer2:text',
        'dialogue:anna_initial:missing:text',
        'unknown:stale',
      ]),
    ).toEqual(['Meeting Minutes', 'Anna Reed']);
  });
});
