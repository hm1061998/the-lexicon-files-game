export type HudVisibility = { minimapVisible: boolean; objectiveVisible: boolean };

export function getInitialHudVisibility(width: number, height: number): HudVisibility {
  const compact = width < 960 || height < 640;
  return { minimapVisible: !compact, objectiveVisible: !compact };
}
