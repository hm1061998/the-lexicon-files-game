import type { DialogueChoice, DialogueNode, Effect } from '@lexicon/shared-types';

const flagsSetTrue = (effects: readonly Effect[] | undefined): string[] =>
  (effects ?? []).flatMap((effect) =>
    effect.type === 'setFlag' && effect.value ? [effect.key] : [],
  );

/**
 * A choice counts as already asked when it (or the line it leads to) sets at least one flag to true
 * and every such flag is true in the case state. It stays selectable; the band only dims it.
 */
export function isChoiceSeen(
  choice: DialogueChoice,
  target: DialogueNode | undefined,
  flags: Readonly<Record<string, boolean>>,
): boolean {
  const keys = [...flagsSetTrue(choice.effects), ...flagsSetTrue(target?.effects)];
  return keys.length > 0 && keys.every((key) => flags[key] === true);
}
