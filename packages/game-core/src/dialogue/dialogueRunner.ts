import type {
  CaseDefinition,
  Condition,
  DialogueAction,
  DialogueChoice,
  DialogueError,
  DialogueNode,
  DialogueSession,
  DialogueTransitionResult,
  Effect,
  GameState,
} from '@lexicon/shared-types';
import { applyEffects } from '../effect/applyEffects';
import { evaluateCondition } from '../condition/evaluateCondition';
import { reconcileDialogueProgress } from './reconcileDialogueProgress';

/** Missing flags mean false only for dialogue; the general interpreter is unchanged. */
function allowed(state: GameState, condition: Condition | undefined): boolean {
  if (!condition) return true;
  if (condition.type === 'flag') return (state.flags[condition.key] ?? false) === condition.value;
  if (condition.type === 'all') return condition.conditions.every((c) => allowed(state, c));
  if (condition.type === 'any') return condition.conditions.some((c) => allowed(state, c));
  return evaluateCondition(state, condition);
}
function fail(
  state: GameState,
  session: DialogueSession | null,
  code: DialogueError['code'],
  detail: string,
): DialogueTransitionResult {
  return { ok: false, state, session, error: { code, detail } };
}
function enter(
  definition: CaseDefinition,
  state: GameState,
  previous: DialogueSession | null,
  session: DialogueSession,
  node: DialogueNode,
  effects: readonly Effect[],
): DialogueTransitionResult {
  const applied = applyEffects(definition, state, [...effects, ...(node.effects ?? [])]);
  if (!applied.ok)
    return fail(state, previous, 'effectFailed', `${applied.error.code}: ${applied.error.id}`);
  const progress = reconcileDialogueProgress(definition, applied.state);
  if (!progress.ok)
    return fail(state, previous, 'effectFailed', `${progress.error.code}: ${progress.error.id}`);
  return {
    ok: true,
    state: progress.state,
    session,
    events: [...applied.events, ...progress.events],
  };
}
export function startDialogue(
  definition: CaseDefinition,
  state: GameState,
  npcId: string,
): DialogueTransitionResult {
  const npc = definition.npcs.find((n) => n.id === npcId);
  if (!npc) return fail(state, null, 'unknownNpc', npcId);
  const tree = definition.dialogues.find((t) => t.id === npc.dialogueTreeId && t.npcId === npcId);
  if (!tree) return fail(state, null, 'unknownTree', npc.dialogueTreeId);
  const node = tree.nodes.find((n) => n.id === tree.entryNodeId);
  if (!node) return fail(state, null, 'unknownNode', tree.entryNodeId);
  if (!allowed(state, node.condition)) return fail(state, null, 'conditionNotMet', node.id);
  return enter(
    definition,
    state,
    null,
    { treeId: tree.id, npcId, nodeId: node.id, revision: 0 },
    node,
    [],
  );
}
export function getAvailableChoices(
  definition: CaseDefinition,
  state: GameState,
  session: DialogueSession,
): readonly DialogueChoice[] {
  const tree = definition.dialogues.find(
    (t) => t.id === session.treeId && t.npcId === session.npcId,
  );
  const node = tree?.nodes.find((n) => n.id === session.nodeId);
  if (!node || node.terminal || !allowed(state, node.condition)) return [];
  return node.choices.filter((choice) => {
    const target = tree?.nodes.find((n) => n.id === choice.nextNodeId);
    return target && allowed(state, choice.condition) && allowed(state, target.condition);
  });
}
export function chooseDialogueChoice(
  definition: CaseDefinition,
  state: GameState,
  session: DialogueSession,
  action: DialogueAction,
): DialogueTransitionResult {
  if (action.nodeId !== session.nodeId || action.revision !== session.revision)
    return fail(state, session, 'staleAction', action.choiceId);
  const tree = definition.dialogues.find(
    (t) => t.id === session.treeId && t.npcId === session.npcId,
  );
  if (!tree) return fail(state, session, 'unknownTree', session.treeId);
  const node = tree.nodes.find((n) => n.id === session.nodeId);
  if (!node) return fail(state, session, 'unknownNode', session.nodeId);
  const choice = node.choices.find((c) => c.id === action.choiceId);
  if (!choice || node.terminal) return fail(state, session, 'unknownChoice', action.choiceId);
  const target = tree.nodes.find((n) => n.id === choice.nextNodeId);
  if (!target) return fail(state, session, 'unknownNode', choice.nextNodeId);
  if (
    !allowed(state, node.condition) ||
    !allowed(state, choice.condition) ||
    !allowed(state, target.condition)
  )
    return fail(state, session, 'conditionNotMet', choice.id);
  return enter(
    definition,
    state,
    session,
    { ...session, nodeId: target.id, revision: session.revision + 1 },
    target,
    choice.effects ?? [],
  );
}
