export type LabelRect = { x: number; y: number; width: number; height: number };

/** Place a nameplate over the figure, moving it upward until it clears an interaction prompt. */
export function nameTagPosition(args: {
  centerX: number;
  feetY: number;
  figureHeight: number;
  tagHeight: number;
  gap: number;
  prompt: LabelRect | null;
  tagWidth: number;
}): { x: number; y: number } {
  let y = args.feetY - args.figureHeight - args.gap - args.tagHeight / 2;
  const overlaps = (candidateY: number) => args.prompt !== null &&
    Math.abs(args.centerX - (args.prompt.x + args.prompt.width / 2)) * 2 < args.tagWidth + args.prompt.width &&
    Math.abs(candidateY - (args.prompt.y + args.prompt.height / 2)) * 2 < args.tagHeight + args.prompt.height;
  while (overlaps(y)) y -= args.tagHeight + args.gap;
  return { x: args.centerX, y };
}
