import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type {
  CaseDefinition,
  Condition,
  ContradictionDefinition,
  EvidenceDefinition,
  FactDefinition,
  ObjectiveDefinition,
} from '@lexicon/shared-types';
import case001Vocabulary from '../../cases/case-001/vocabulary.json';
import { vocabularyCatalogueSchema } from './learning';
import { conditionSchema } from './caseEngine';
import { validateVocabularyReferences } from '../validation/vocabularyReferences';

function read<T>(name: string): T {
  const path = fileURLToPath(new URL(`../../cases/case-002/${name}.json`, import.meta.url));
  expect(existsSync(path), `Missing case-002/${name}.json`).toBe(true);
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}
const evidenceIds = [
  'delivery_note',
  'mailroom_access_log',
  'courier_receipt',
  'label_printer_log',
  'client_complaint_email',
  'chat_messages',
];
const factIds = [
  'note_address_14',
  'package_signed_in_16_10',
  'leo_entry_16_40',
  'leo_exit_16_46',
  'label_reprinted_16_44',
  'courier_delivered_41',
  'client_reports_missing_17_45',
  'chat_anna_confirmed_14',
  'david_asked_early_16_25',
  'leo_statement_at_desk_all_afternoon',
  'leo_blames_anna_wrong_number',
  'anna_checked_address_16_10',
];
const readCase = () => read<CaseDefinition>('case');
const readEvidence = () => read<{ evidences: EvidenceDefinition[] }>('evidences').evidences;
const readFacts = () => read<{ facts: FactDefinition[] }>('facts').facts;
const readObjectives = () => read<{ objectives: ObjectiveDefinition[] }>('objectives').objectives;

// Checks authored content against the approved identifiers, rather than duplicating a loader.
describe('Case #002 spine', () => {
  it('declares the six evidences with the exact ids and categories', () => {
    expect(readEvidence().map(({ id, category }) => [id, category])).toEqual([
      ['delivery_note', 'document'],
      ['mailroom_access_log', 'digital'],
      ['courier_receipt', 'document'],
      ['label_printer_log', 'digital'],
      ['client_complaint_email', 'digital'],
      ['chat_messages', 'digital'],
    ]);
    for (const evidence of readEvidence()) {
      expect(evidence.caseId).toBe('case-002');
      expect(evidence.image).toBe(`/assets/evidence/evidence_${evidence.id}.png`);
      expect(evidence.descriptionVi).toBeTruthy();
    }
  });
  it('declares the twelve facts, each with a source evidence or dialogue id', () => {
    expect(readFacts().map(({ id }) => id)).toEqual(factIds);
    for (const fact of readFacts()) {
      expect(fact.sourceEvidenceIds.length + (fact.sourceDialogueIds?.length ?? 0)).toBeGreaterThan(
        0,
      );
      for (const id of fact.sourceEvidenceIds) expect(evidenceIds).toContain(id);
      for (const id of fact.sourceDialogueIds ?? [])
        expect(['anna_delivery', 'leo_delivery', 'david_delivery']).toContain(id);
      expect(conditionSchema.safeParse(fact.unlockCondition).success).toBe(true);
    }
  });
  it('declares exactly the two contradictions of the table', () => {
    expect(
      read<{ contradictions: ContradictionDefinition[] }>('contradictions').contradictions.map(
        ({ id, factIds, objectiveId }) => ({ id, factIds, objectiveId }),
      ),
    ).toEqual([
      {
        id: 'leo_desk_vs_access_log',
        factIds: ['leo_statement_at_desk_all_afternoon', 'leo_entry_16_40'],
        objectiveId: 'compare_leo_desk_statement',
      },
      {
        id: 'leo_blame_vs_label_log',
        factIds: ['leo_blames_anna_wrong_number', 'label_reprinted_16_44'],
        objectiveId: 'compare_leo_blame_statement',
      },
    ]);
  });
  it('has a conclusion naming leo as the culprit among anna, leo, david', () => {
    expect(readCase().conclusion).toEqual({
      suspectNpcIds: ['anna', 'leo', 'david'],
      correctSuspectNpcId: 'leo',
      objectiveId: 'submit_your_conclusion',
    });
  });
  it('has no listening tasks and no audio block', () => {
    expect(read<{ tasks: unknown[] }>('listening-tasks')).toEqual({ tasks: [] });
    expect(readCase()).not.toHaveProperty('audio');
  });
  it('reuses client and early verbatim from case-001 vocabulary', () => {
    const { vocabulary } = vocabularyCatalogueSchema.parse(read('vocabulary'));
    expect(vocabulary.map(({ id }) => id)).toEqual([
      'deliver',
      'address',
      'sign',
      'label',
      'schedule',
      'courier',
      'receipt',
      'urgent',
      'package',
      'complaint',
      'client',
      'early',
    ]);
    for (const id of ['client', 'early'])
      expect(vocabulary.find((entry) => entry.id === id)).toEqual(
        case001Vocabulary.vocabulary.find((entry) => entry.id === id),
      );
  });
  it('timeline slot ids are the eight of the table', () => {
    const timeline = readCase().timeline;
    expect(timeline.slots).toEqual(
      ['15_30', '16_10', '16_25', '16_40', '16_44', '16_46', '17_00', '17_45'].map((id) => ({
        id,
        time: id.replace('_', ':'),
      })),
    );
    expect(timeline.events.map(({ slotId }) => slotId)).toEqual(timeline.slots.map(({ id }) => id));
    for (const event of timeline.events) {
      expect(event.availability.type).toBe('requiresFacts');
      if (event.availability.type === 'requiresFacts')
        for (const id of event.availability.factIds) expect(factIds).toContain(id);
    }
  });
  it('declares medium difficulty, the start scene and translated briefing', () => {
    const data = readCase();
    expect(data).toMatchObject({
      id: 'case-002',
      title: 'The Wrong Delivery',
      evidenceTotal: 6,
      initialObjectiveId: 'find_what_happened',
      startSceneId: 'main_office',
      sceneIds: ['main_office', 'mail_room', 'reception'],
      difficulty: {
        tier: 'medium',
        cefrRange: { from: 'A2', to: 'B1' },
        estimatedMinutes: 28,
        recommendedForNewPlayers: false,
      },
    });
    expect(data.briefing?.from).toBe('Chief, International Investigation Bureau');
    expect(data.briefing?.lines.length).toBeGreaterThanOrEqual(3);
    expect(data.briefing?.lines.length).toBeLessThanOrEqual(4);
    for (const line of data.briefing?.lines ?? []) expect(line.translationVi).toBeTruthy();
  });
  it('annotates evidence vocabulary with valid surface spans', () => {
    const { vocabulary } = vocabularyCatalogueSchema.parse(read('vocabulary'));
    expect(
      validateVocabularyReferences({
        source: 'case-002',
        catalogue: vocabulary,
        evidenceContexts: readEvidence().map((e) => ({
          id: e.id,
          text: e.description,
          spans: e.vocabularySpans,
          vocabularyIds: e.vocabularyIds,
        })),
        dialogueContexts: [],
      }),
    ).toEqual([]);
  });
  it('activates comparison and conclusion objectives only after their prerequisites', () => {
    const objectives = readObjectives();
    expect(objectives.map(({ id }) => id)).toEqual([
      'find_what_happened',
      'review_the_records',
      'speak_to_everyone',
      'compare_leo_desk_statement',
      'compare_leo_blame_statement',
      'submit_your_conclusion',
    ]);
    expect(objectives[0]?.initialStatus).toBe('active');
    expect(objectives[2]?.activationCondition).toEqual({
      type: 'objectiveCompleted',
      objectiveId: 'review_the_records',
    });
    for (const [index, ids] of [
      [3, ['leo_statement_at_desk_all_afternoon', 'leo_entry_16_40']],
      [4, ['leo_blames_anna_wrong_number', 'label_reprinted_16_44']],
    ] as const) {
      expect(objectives[index]?.activationCondition).toEqual({
        type: 'all',
        conditions: ids.map((factId) => ({ type: 'hasFact', factId })),
      });
    }
    expect(objectives[5]?.activationCondition).toEqual({
      type: 'all',
      conditions: ['compare_leo_desk_statement', 'compare_leo_blame_statement'].map(
        (objectiveId) => ({ type: 'objectiveCompleted', objectiveId }),
      ),
    });
    for (const objective of objectives)
      for (const condition of [objective.activationCondition, objective.completionCondition])
        if (condition) expect(conditionSchema.safeParse(condition).success).toBe(true);
  });
  it('reviews any three of the six records without forcing an exploration order', () => {
    const condition = readObjectives().find(
      ({ id }) => id === 'review_the_records',
    )?.completionCondition;
    const evaluate = (node: Condition, owned: string[]): boolean => {
      if (node.type === 'hasEvidence') return owned.includes(node.evidenceId);
      if (node.type === 'all') return node.conditions.every((child) => evaluate(child, owned));
      if (node.type === 'any') return node.conditions.some((child) => evaluate(child, owned));
      throw new Error('Record review must use evidence conditions');
    };
    expect(condition).toBeDefined();
    for (let mask = 0; mask < 64; mask++) {
      const owned = evidenceIds.filter((_, index) => mask & (1 << index));
      expect(evaluate(condition!, owned), owned.join(',')).toBe(owned.length >= 3);
    }
  });
});
