export type HudInsetsLike = { top: number; right: number; bottom: number; left: number };
export type OffscreenPointer = { id: string; x: number; y: number; angle: number };

export const OFFSCREEN_MARGIN = 24;
export const OFFSCREEN_MAX = 3;

/**
 * Edge pointers for evidence cues that are outside the camera view. Everything is in screen px.
 * Each pointer sits where the ray from the player to the cue leaves the view shrunk by the HUD
 * insets plus a margin, so it is never hidden under the objective card, map or key line.
 */
export function offscreenCues(args: {
  cues: readonly { id: string; x: number; y: number }[];
  view: { x: number; y: number; width: number; height: number };
  player: { x: number; y: number };
  insets: HudInsetsLike;
  margin: number;
  max: number;
}): OffscreenPointer[] {
  const { view, player, insets, margin } = args;
  const minX = view.x + insets.left + margin;
  const maxX = view.x + view.width - insets.right - margin;
  const minY = view.y + insets.top + margin;
  const maxY = view.y + view.height - insets.bottom - margin;
  const inside = (x: number, y: number): boolean =>
    x >= view.x && x <= view.x + view.width && y >= view.y && y <= view.y + view.height;

  return args.cues
    .filter((cue) => !inside(cue.x, cue.y))
    .map((cue) => ({ cue, distance: Math.hypot(cue.x - player.x, cue.y - player.y) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, args.max)
    .map(({ cue }) => {
      const dx = cue.x - player.x;
      const dy = cue.y - player.y;
      let t = 1;
      if (dx > 0) t = Math.min(t, (maxX - player.x) / dx);
      else if (dx < 0) t = Math.min(t, (minX - player.x) / dx);
      if (dy > 0) t = Math.min(t, (maxY - player.y) / dy);
      else if (dy < 0) t = Math.min(t, (minY - player.y) / dy);
      t = Math.max(t, 0);
      const x = Math.min(Math.max(player.x + dx * t, minX), maxX);
      const y = Math.min(Math.max(player.y + dy * t, minY), maxY);
      return { id: cue.id, x, y, angle: Math.atan2(dy, dx) };
    });
}
