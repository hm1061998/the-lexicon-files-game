import type { CaseDefinition, Condition, Effect } from '@lexicon/shared-types';
import { validateNotebookStatements } from './notebookStatements';
export function validateDialogueReferences(
  definition: Pick<
    CaseDefinition,
    'npcs' | 'dialogues' | 'scenes' | 'facts' | 'evidences' | 'objectives'
  >,
  issues: string[],
  conditionRefs: (condition: Condition, path: string) => void,
  effectRefs: (effect: Effect, path: string) => void,
): void {
  const { npcs, dialogues } = definition;
  const npcIds = new Set(npcs.map((n) => n.id));
  const treeIds = new Set(dialogues.map((t) => t.id));
  function duplicates(ids: readonly string[], path: string) {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) issues.push(`${path}: duplicate id "${id}"`);
      seen.add(id);
    }
  }
  duplicates(
    npcs.map((n) => n.id),
    'npcs',
  );
  duplicates(
    dialogues.map((t) => t.id),
    'dialogues',
  );
  duplicates(
    dialogues.map((t) => t.completionFlag),
    'dialogues.completionFlag',
  );
  for (const npc of npcs) {
    const tree = dialogues.find((t) => t.id === npc.dialogueTreeId);
    if (!tree || tree.npcId !== npc.id)
      issues.push(`npcs.${npc.id}.dialogueTreeId: missing or mismatched owner`);
  }
  for (const tree of dialogues) {
    validateNotebookStatements(tree, issues);
    const path = `dialogues.${tree.id}`;
    if (!npcIds.has(tree.npcId)) issues.push(`${path}.npcId: unknown NPC`);
    duplicates(
      tree.nodes.map((n) => n.id),
      `${path}.nodes`,
    );
    const entry = tree.nodes.find((n) => n.id === tree.entryNodeId);
    if (!entry || entry.condition)
      issues.push(`${path}.entryNodeId: missing entry or conditional entry`);
    const setFlags = new Set(
      tree.nodes
        .flatMap((n) => n.choices.flatMap((c) => c.effects ?? []))
        .filter((e) => e.type === 'setFlag' && e.value)
        .map((e) => (e.type === 'setFlag' ? e.key : '')),
    );
    function completion(c: Condition): void {
      if (c.type === 'all' || c.type === 'any') {
        if (!c.conditions.length) issues.push(`${path}.completionCondition: empty group`);
        c.conditions.forEach(completion);
      } else if (
        c.type !== 'flag' ||
        !c.value ||
        !setFlags.has(c.key) ||
        c.key === tree.completionFlag
      ) {
        issues.push(
          `${path}.completionCondition: must refer to own choice-authored positive branch flags`,
        );
      }
    }
    completion(tree.completionCondition);
    const reachable = new Set<string>();
    function visit(id: string) {
      if (reachable.has(id)) return;
      reachable.add(id);
      tree.nodes.find((n) => n.id === id)?.choices.forEach((c) => visit(c.nextNodeId));
    }
    visit(tree.entryNodeId);
    for (const node of tree.nodes) {
      const nodePath = `${path}.nodes.${node.id}`;
      if (!reachable.has(node.id)) issues.push(`${nodePath}: unreachable node`);
      if (node.speakerId !== 'investigator' && !npcIds.has(node.speakerId))
        issues.push(`${nodePath}.speakerId: unknown NPC`);
      if (node.condition) conditionRefs(node.condition, `${nodePath}.condition`);
      node.effects?.forEach((e) => effectRefs(e, `${nodePath}.effects`));
      duplicates(
        node.choices.map((c) => c.id),
        `${nodePath}.choices`,
      );
      for (const choice of node.choices) {
        const choicePath = `${nodePath}.choices.${choice.id}`;
        if (!tree.nodes.some((n) => n.id === choice.nextNodeId))
          issues.push(`${choicePath}.nextNodeId: unknown node`);
        if (choice.condition) conditionRefs(choice.condition, `${choicePath}.condition`);
        choice.effects?.forEach((e) => effectRefs(e, `${choicePath}.effects`));
      }
    }
  }
  for (const scene of definition.scenes)
    for (const asset of scene.assets) {
      const interaction = asset.interaction;
      if (!interaction?.npcId) continue;
      if (!npcIds.has(interaction.npcId) || asset.type !== 'npc')
        issues.push(
          `scenes.${scene.id}.${asset.id}.interaction.npcId: unknown NPC or non-NPC asset`,
        );
      if (interaction.effects?.length)
        issues.push(
          `scenes.${scene.id}.${asset.id}.interaction: NPC effects conflict with dialogue`,
        );
    }
  for (const evidence of definition.evidences)
    for (const id of evidence.relatedNpcIds ?? []) {
      if (!npcIds.has(id))
        issues.push(`evidences.${evidence.id}.relatedNpcIds: unknown NPC "${id}"`);
    }
  for (const fact of definition.facts) {
    if (!fact.sourceEvidenceIds.length && !fact.sourceDialogueIds?.length)
      issues.push(`facts.${fact.id}: at least one source required`);
    for (const id of fact.sourceDialogueIds ?? [])
      if (!treeIds.has(id))
        issues.push(`facts.${fact.id}.sourceDialogueIds: unknown dialogue "${id}"`);
  }
  for (const objective of definition.objectives)
    if (objective.completionCondition)
      conditionRefs(
        objective.completionCondition,
        `objectives.${objective.id}.completionCondition`,
      );
}
