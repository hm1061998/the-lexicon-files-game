import { describe, expect, it } from 'vitest';
import { expandWalls, WALL_MODULE_ART } from './wallSegments';
import { readFileSync } from 'node:fs';
import type { WallSegmentDefinition } from '@lexicon/shared-types';

const wall: WallSegmentDefinition = {
  id: 'west',
  kind: 'office',
  axis: 'v',
  line: 0,
  start: 0,
  end: 12,
  openings: [{ id: 'door', start: 4, end: 6 }],
};
describe('expandWalls', () => {
  it('matches the generated PNG floor pivot metadata', () => {
    for (const axis of ['u', 'v'] as const) {
      const png = readFileSync(new URL(`../../../../apps/game-web/public/assets/environment/office/wall_${axis}.png`, import.meta.url));
      expect(png.readUInt32BE(16)).toBe(80);
      expect(png.readUInt32BE(20)).toBe(130);
      expect(WALL_MODULE_ART[axis].origin).toEqual([0.5, 110 / 130]);
    }
  });
  it('emits modules and skips openings with exact shared edges', () => {
    const { assets, doorways } = expandWalls([wall]);
    expect(assets).toHaveLength(10);
    expect(assets.filter((a) => a.position && a.position.v > 4 && a.position.v < 6)).toHaveLength(
      0,
    );
    const a = assets[0]!,
      b = assets[1]!;
    expect(a.position!.v + ('v' in a.collision! ? a.collision.v + a.collision.height : 0)).toBe(
      b.position!.v + ('v' in b.collision! ? b.collision.v : 0),
    );
    expect(doorways[0]).toMatchObject({
      id: 'door',
      wallId: 'west',
      center: { u: 0.125, v: 5 },
      rect: { width: 0.25, height: 2 },
    });
  });
  it('handles edge and adjacent openings without empty modules', () => {
    const { assets } = expandWalls([
      {
        ...wall,
        start: 0,
        end: 6,
        openings: [
          { id: 'a', start: 0, end: 2 },
          { id: 'b', start: 2, end: 4 },
        ],
      },
    ]);
    expect(assets).toHaveLength(2);
    expect(assets[0]!.texture).toContain('cap_start');
    expect(assets[1]!.texture).toContain('cap_end');
    expect(assets.every((a) => a.footprint!.width > 0 && a.footprint!.height > 0)).toBe(true);
  });
  it('uses cap textures only at run ends', () => {
    expect(expandWalls([{ ...wall, end: 4, openings: [] }]).assets.map((a) => a.texture)).toEqual([
      'tex_wall_office_v_cap_start',
      'tex_wall_office_v',
      'tex_wall_office_v',
      'tex_wall_office_v_cap_end',
    ]);
  });
});
