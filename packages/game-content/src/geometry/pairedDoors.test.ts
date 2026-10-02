import { expect, it } from 'vitest';
import officeRaw from '../../cases/case-001/scenes/main_office.json';
import archiveRaw from '../../cases/case-001/scenes/archive.json';
import { parseSceneDefinition } from '../schema/scene';
import { validateSceneGeometry } from './sceneGeometry';
it('pairs exits on opposite edges with safe reachable arrival points', () => {
  const office = parseSceneDefinition(officeRaw, 'office'),
    archive = parseSceneDefinition(archiveRaw, 'archive');
  expect(office.assets.find((a) => a.id === 'hallway_door')?.interaction?.transition).toEqual({
    targetSceneId: 'archive',
    targetSpawnId: 'from_office',
  });
  const door = archive.assets.find((a) => a.id === 'PLACEHOLDER_archive_door')!;
  // Arch portals stand in the wall opening; arrival spawns sit where the old floor disc was.
  expect('position' in door ? door.position : null).toEqual({ u: 15.75, v: 5 });
  expect(archive.spawnPoints.from_office).toEqual({ u: 14.5, v: 5 });
  expect(office.spawnPoints.from_archive).toEqual({ u: 1.5, v: 5 });
  for (const scene of [office, archive]) {
    const pad = scene.assets.find((a) => a.interaction?.transition)!;
    expect(pad).toHaveProperty('portal.style', 'arch');
    expect(pad.collision).toBeUndefined();
    // The footprint stays inside the 0.25 thick wall; the prompt point is 0.75 tile into the room.
    expect(pad.footprint?.width).toBe(0.25);
    expect(Math.abs(pad.interaction?.x ?? 0)).toBe(0.75);
  }
  expect(archive.walls?.find(({ id }) => id === 'archive_west_wall_upper')?.openings).toEqual([]);
  expect(archive.walls?.find(({ id }) => id === 'archive_west_wall_lower')?.openings).toEqual([]);
  expect(
    archive.walls?.find(({ id }) => id === 'archive_east_outer_wall')?.openings.map(({ id }) => id),
  ).toEqual(['archive_hallway_return']);
  expect(validateSceneGeometry(archive)).toEqual([]);
  expect(validateSceneGeometry(office)).toEqual([]);
});

it('keeps portal pad footprints and spawns free of other colliders', () => {
  for (const [raw, id] of [
    [officeRaw, 'office'],
    [archiveRaw, 'archive'],
  ] as const) {
    const scene = parseSceneDefinition(raw, id);
    const pad = scene.assets.find((a) => a.interaction?.transition)!;
    if (!('position' in pad) || !pad.footprint) throw new Error('pad needs position and footprint');
    const area = {
      u0: pad.position.u + pad.footprint.u,
      u1: pad.position.u + pad.footprint.u + pad.footprint.width,
      v0: pad.position.v + pad.footprint.v,
      v1: pad.position.v + pad.footprint.v + pad.footprint.height,
    };
    const blockers = scene.assets
      .filter((a) => a.id !== pad.id && a.collision && 'position' in a)
      .filter((a) => {
        const c = a.collision!;
        const p = (a as { position: { u: number; v: number } }).position;
        if (c.type !== 'rect') return false;
        return (
          p.u + c.u < area.u1 &&
          p.u + c.u + c.width > area.u0 &&
          p.v + c.v < area.v1 &&
          p.v + c.v + c.height > area.v0
        );
      })
      .map((a) => a.id);
    expect(blockers, `${id} blockers`).toEqual([]);
  }
});
