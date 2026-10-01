import type { Condition, DialogueTree } from '@lexicon/shared-types';

export function validateNotebookStatements(tree: DialogueTree, issues: string[]): void {
  const writers = new Set(
    tree.nodes
      .flatMap((node) => [
        ...(node.effects ?? []),
        ...node.choices.flatMap((choice) => choice.effects ?? []),
      ])
      .flatMap((effect) => (effect.type === 'setFlag' && effect.value ? [effect.key] : [])),
  );
  const seen = new Set<string>();

  function validateCondition(condition: Condition, path: string): void {
    if (condition.type === 'all' || condition.type === 'any') {
      if (condition.conditions.length === 0) issues.push(`${path}: empty recorded group`);
      condition.conditions.forEach((child, index) =>
        validateCondition(child, `${path}.conditions.${index}`),
      );
    } else if (
      condition.type !== 'flag' ||
      condition.value !== true ||
      condition.key === tree.completionFlag ||
      !writers.has(condition.key)
    ) {
      issues.push(
        `${path}: must refer to own-tree authored positive recording flags, excluding completionFlag`,
      );
    }
  }

  tree.notebookStatements?.forEach((statement, index) => {
    const path = `dialogues.${tree.id}.notebookStatements.${index}`;
    const node = tree.nodes.find(({ id }) => id === statement.nodeId);
    if (!node) issues.push(`${path}.nodeId: missing node "${statement.nodeId}"`);
    else if (node.speakerId !== tree.npcId)
      issues.push(`${path}.nodeId: statement speaker must match tree NPC`);
    if (seen.has(statement.nodeId))
      issues.push(`${path}.nodeId: duplicate statement "${statement.nodeId}"`);
    seen.add(statement.nodeId);
    validateCondition(statement.recordedCondition, `${path}.recordedCondition`);
  });
}
