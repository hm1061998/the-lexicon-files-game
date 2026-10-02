import { describe, expect, it } from 'vitest';
import type { SceneDefinition } from '@lexicon/shared-types';
import { REGISTERED_CASE_IDS, loadCaseDefinition } from '../loader/loadCaseDefinition';
import { validatePortalPlacement } from './portalPlacement';

const wall = {
  id: 'west_wall_upper',
  kind: 'office',
  axis: 'v',
  line: 0,
  start: 0,
  end: 12,
  openings: [{ id: 'hallway', start: 4, end: 6 }],
};

function scene(position: { u: number; v: number }): SceneDefinition {
  return {
    id: 'main_office',
    walls: [wall],
    assets: [{ id: 'hallway_door', position, portal: { style: 'arch', radius: 0.65 } }],
  } as unknown as SceneDefinition;
}

describe('validatePortalPlacement', () => {
  it('accepts a portal centred in a wall opening on the wall line', () => {
    expect(validatePortalPlacement(scene({ u: 0, v: 5 }))).toEqual([]);
  });

  it('accepts a portal within the 0.25 tolerance of the wall line', () => {
    expect(validatePortalPlacement(scene({ u: 0.2, v: 5 }))).toEqual([]);
  });

  it('rejects a portal standing in the room in front of the opening', () => {
    expect(validatePortalPlacement(scene({ u: 1.5, v: 5 }))).toEqual([
      'scenes.main_office.hallway_door.portal: not inside any wall opening',
    ]);
  });

  it('rejects a portal on the wall line but outside every opening', () => {
    expect(validatePortalPlacement(scene({ u: 0, v: 7 }))).toEqual([
      'scenes.main_office.hallway_door.portal: not inside any wall opening',
    ]);
  });

  it('ignores assets without a portal and scenes without walls', () => {
    const plain = {
      id: 's',
      walls: [wall],
      assets: [{ id: 'desk', position: { u: 3, v: 3 } }],
    } as unknown as SceneDefinition;
    expect(validatePortalPlacement(plain)).toEqual([]);
    expect(validatePortalPlacement({ id: 's', assets: [] } as unknown as SceneDefinition)).toEqual(
      [],
    );
  });

  it('holds for every portal of every registered case', () => {
    for (const caseId of REGISTERED_CASE_IDS) {
      for (const sceneDefinition of loadCaseDefinition(caseId).scenes) {
        expect(validatePortalPlacement(sceneDefinition), `${caseId}/${sceneDefinition.id}`).toEqual(
          [],
        );
      }
    }
  });
});
