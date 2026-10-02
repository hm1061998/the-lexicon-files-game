import { describe, expect, it } from 'vitest';
import { ContentValidationError } from './ContentValidationError';
import { loadCaseDefinition, REGISTERED_CASE_IDS } from './loadCaseDefinition';
import { loadSceneDefinition } from './loadScene';

describe('loadCaseDefinition', () => {
  it('loads case-002 with three scenes, six evidences, two contradictions and no listening tasks', () => {
    const definition = loadCaseDefinition('case-002');
    expect(definition.scenes.map(({ id }) => id)).toEqual([
      'main_office',
      'mail_room',
      'reception',
    ]);
    expect(definition.evidences).toHaveLength(6);
    expect(definition.contradictions).toHaveLength(2);
    expect(definition.listeningTasks).toEqual([]);
    expect(definition.npcs.map(({ dialogueTreeId }) => dialogueTreeId)).toEqual([
      'anna_delivery',
      'leo_delivery',
      'david_delivery',
    ]);
    for (const scene of definition.scenes)
      expect(loadSceneDefinition('case-002', scene.id)).toEqual(scene);
  });

  it('registers both cases', () => {
    expect(REGISTERED_CASE_IDS).toEqual(['case-001', 'case-002']);
  });

  it('case-002 has no audio and no dialogue voice', () => {
    const definition = loadCaseDefinition('case-002');
    expect(definition.audio).toBeUndefined();
    for (const node of definition.dialogues.flatMap(({ nodes }) => nodes))
      expect(node.audio).toBeUndefined();
  });

  it('gates Leo confrontation on the access log and his earlier desk statement', () => {
    const tree = loadCaseDefinition('case-002').dialogues.find(({ id }) => id === 'leo_delivery')!;
    const blame = tree.nodes.find((node) =>
      node.effects?.some(
        (effect) =>
          effect.type === 'setFlag' && effect.key === 'leo_blame_statement_read' && effect.value,
      ),
    )!;
    const gate = {
      type: 'all',
      conditions: [
        { type: 'hasEvidence', evidenceId: 'mailroom_access_log' },
        { type: 'flag', key: 'leo_desk_statement_read', value: true },
      ],
    };
    expect(blame.condition).toEqual(gate);
    const challenge = tree.nodes
      .flatMap(({ choices }) => choices)
      .find(({ nextNodeId }) => nextNodeId === blame.id)!;
    expect(challenge.condition).toEqual(gate);
    expect(tree.notebookStatements).toContainEqual({
      nodeId: blame.id,
      recordedCondition: { type: 'flag', key: 'leo_blame_statement_read', value: true },
    });
  });

  it('records Anna and David statements and gates Anna confirmation on the chat', () => {
    const definition = loadCaseDefinition('case-002');
    for (const [treeId, flag] of [
      ['anna_delivery', 'anna_address_checked_read'],
      ['david_delivery', 'david_early_request_read'],
    ]) {
      const tree = definition.dialogues.find(({ id }) => id === treeId)!;
      const node = tree.nodes.find((item) =>
        item.effects?.some(
          (effect) => effect.type === 'setFlag' && effect.key === flag && effect.value,
        ),
      )!;
      expect(node).toBeDefined();
      expect(tree.notebookStatements).toContainEqual({
        nodeId: node.id,
        recordedCondition: { type: 'flag', key: flag, value: true },
      });
    }
    const anna = definition.dialogues.find(({ id }) => id === 'anna_delivery')!;
    const gated = anna.nodes.find(
      (node) =>
        node.condition?.type === 'hasEvidence' && node.condition.evidenceId === 'chat_messages',
    )!;
    expect(gated).toBeDefined();
    expect(gated.text).toContain('14 Bridge Street');
    expect(
      anna.nodes.flatMap(({ choices }) => choices).find(({ nextNodeId }) => nextNodeId === gated.id)
        ?.condition,
    ).toEqual({ type: 'hasEvidence', evidenceId: 'chat_messages' });
  });

  it('loads the minimal case, including its scene, evidence, fact, and objective', () => {
    const definition = loadCaseDefinition('case-001');
    expect(definition.scenes.map((scene) => scene.id)).toEqual(['main_office', 'archive']);
    expect(definition.vocabulary).toHaveLength(20);
    expect(definition.vocabulary.map(({ id }) => id)).toEqual([
      'meeting',
      'client',
      'early',
      'leave',
      'return',
      'before',
      'end',
      'report',
      'confidential',
      'folder',
      'access',
      'security',
      'entry',
      'exit',
      'log',
      'receipt',
      'purchase',
      'outside',
      'several',
      'certain',
    ]);
    expect(definition.vocabularyContexts).toContainEqual({
      id: 'evidence:meeting_minutes:description',
      vocabularyIds: expect.arrayContaining(['meeting', 'leave', 'client']),
    });
    expect(
      definition.dialogues.find((tree) => tree.id === 'anna_initial')?.nodes[0]?.vocabularySpans,
    ).toHaveLength(4);
    expect(definition.evidences.map((item) => item.id)).toEqual([
      'leo_phone_recording',
      'meeting_minutes',
      'security_access_log',
    ]);
    expect(definition.listeningTasks).toHaveLength(1);
    expect(definition.listeningTasks[0]).toMatchObject({
      id: 'leo_phone_recording_location',
      evidenceId: 'leo_phone_recording',
      audioAsset: '/audio/case-001/leo-phone-recording.wav',
      correctOptionId: 'outside',
    });
    expect(definition.evidenceTotal).toBe(5);
    expect(definition.facts.map((item) => item.id)).toEqual([
      'leo_outside_at_2029',
      'meeting_started',
      'david_statement_no_entry_after_20_00',
      'david_collected_folder',
      'david_took_report',
      'anna_exit_20_18',
      'leo_exit_20_27',
      'david_entry_20_32',
      'david_exit_20_36',
      'leo_entry_20_40',
      'meeting_ended_20_45',
    ]);
    expect(definition.objectives.map((item) => item.id)).toEqual([
      'find_what_happened',
      'talk_to_everyone',
      'check_security_records',
      'compare_david_statement',
      'submit_your_conclusion',
    ]);
  });

  it('Case #001 exposes meeting_minutes as a collectible scene interaction', () => {
    const definition = loadCaseDefinition('case-001');
    const scene = definition.scenes.find((item) => item.id === 'main_office');
    const interaction = scene?.assets.find((item) => item.id === 'meeting_minutes')?.interaction;

    expect(interaction?.prompt).toBeTruthy();
    expect(interaction?.effects).toEqual([{ type: 'addEvidence', evidenceId: 'meeting_minutes' }]);
  });

  it('Case #001 exposes the phone recording as a collectible audio interaction', () => {
    const definition = loadCaseDefinition('case-001');
    const evidence = definition.evidences.find((item) => item.id === 'leo_phone_recording');
    const scene = definition.scenes.find((item) => item.id === 'main_office');
    const interaction = scene?.assets.find((item) => item.id === 'phone_recording')?.interaction;

    expect(evidence?.category).toBe('audio');
    expect(interaction?.prompt).toBeTruthy();
    expect(interaction?.effects).toEqual([
      { type: 'addEvidence', evidenceId: 'leo_phone_recording' },
    ]);
  });

  it('Case #001 declares Anna, Leo and David as suspects with David as the answer', () => {
    const definition = loadCaseDefinition('case-001');
    expect(definition.conclusion).toEqual({
      suspectNpcIds: ['anna', 'leo', 'david'],
      correctSuspectNpcId: 'david',
      objectiveId: 'submit_your_conclusion',
    });
    const objective = definition.objectives.find(({ id }) => id === 'submit_your_conclusion');
    expect(objective?.initialStatus).toBe('locked');
    expect(objective?.activationCondition).toEqual({
      type: 'all',
      conditions: [
        { type: 'flag', key: 'david_confession_read', value: true },
        { type: 'hasFact', factId: 'david_took_report' },
      ],
    });
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
