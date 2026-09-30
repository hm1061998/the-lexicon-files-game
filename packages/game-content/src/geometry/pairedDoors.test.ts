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
  expect('position' in door ? door.position : null).toEqual({ u: 15.875, v: 5 });
  expect(archive.spawnPoints.from_office).toEqual({ u: 14.85, v: 5 });
  expect(office.spawnPoints.from_archive).toEqual({ u: 0.9, v: 5 });
  expect(archive.walls?.find(({ id }) => id === 'archive_west_wall_upper')?.openings).toEqual([]);
  expect(archive.walls?.find(({ id }) => id === 'archive_west_wall_lower')?.openings).toEqual([]);
  expect(
    archive.walls?.find(({ id }) => id === 'archive_east_outer_wall')?.openings.map(({ id }) => id),
  ).toEqual(['archive_hallway_return']);
  expect(validateSceneGeometry(archive)).toEqual([]);
  expect(validateSceneGeometry(office)).toEqual([]);
});
