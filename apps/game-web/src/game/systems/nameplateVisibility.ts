import { NAMEPLATE_RADIUS_FACTOR } from '../constants';

type Point = { x: number; y: number };

/** A dossier tag shows when the player is near the NPC or the pointer is over them. */
export function nameplateVisible(args: {
  player: Point;
  npcFeet: Point;
  interactionRadius: number;
  hovered: boolean;
}): boolean {
  if (args.hovered) return true;
  const distance = Math.hypot(args.player.x - args.npcFeet.x, args.player.y - args.npcFeet.y);
  return distance <= NAMEPLATE_RADIUS_FACTOR * args.interactionRadius;
}
