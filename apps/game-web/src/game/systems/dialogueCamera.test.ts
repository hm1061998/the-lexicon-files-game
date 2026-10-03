import { describe, expect, it } from 'vitest';
import { DIALOGUE_ZOOM_FACTOR, dialogueCameraTarget } from './dialogueCamera';

const view = { width: 800, height: 600 };
const bounds = { x: 0, y: 0, width: 2000, height: 1500 };

describe('dialogueCameraTarget', () => {
  it('centres between the player and the NPC when there is room', () => {
    expect(
      dialogueCameraTarget({
        player: { x: 900, y: 700 },
        npc: { x: 1100, y: 800 },
        view,
        bounds,
        zoom: 1,
      }),
    ).toEqual({ x: 1000, y: 750 });
  });

  it('keeps the zoomed view inside the bounds', () => {
    // Zoom 2 shows 400x300 of the world, so the centre stays at least 200/150 from the edges.
    const target = dialogueCameraTarget({
      player: { x: 10, y: 10 },
      npc: { x: 30, y: 30 },
      view,
      bounds,
      zoom: 2,
    });
    expect(target).toEqual({ x: 200, y: 150 });
    expect(
      dialogueCameraTarget({
        player: { x: 1990, y: 1490 },
        npc: { x: 1990, y: 1490 },
        view,
        bounds,
        zoom: 2,
      }),
    ).toEqual({ x: 1800, y: 1350 });
  });

  it('centres on the bounds when the zoomed view is larger than they are', () => {
    expect(
      dialogueCameraTarget({
        player: { x: 0, y: 0 },
        npc: { x: 100, y: 100 },
        view,
        bounds: { x: 100, y: 50, width: 300, height: 200 },
        zoom: 1,
      }),
    ).toEqual({ x: 250, y: 150 });
  });

  it('pushes in by 20 percent', () => {
    expect(DIALOGUE_ZOOM_FACTOR).toBe(1.2);
  });
});
