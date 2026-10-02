import type { CaseDefinition } from '@lexicon/shared-types';
export function resolveInvestigationArtwork(
  definition: CaseDefinition,
  npcId: string,
): string | undefined {
  const key = definition.characterSheets[npcId]?.idle.SW;
  if (!key) return undefined;
  const texture = [
    ...definition.sharedTextures,
    ...definition.scenes.flatMap((s) => s.textures),
  ].find((t) => t.key === key && t.frameWidth === undefined && t.frameHeight === undefined);
  return texture?.url;
}
