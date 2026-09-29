import { describe, expect, it, vi } from 'vitest';
import {
  WALK_FPS,
  WALK_FRAMES,
  planWalk,
  registerCharacterAnimations,
  walkAnimKey,
} from './characterAnimations';

describe('walkAnimKey', () => {
  it('follows the `${actor}_${action}_${direction}` convention', () => {
    expect(walkAnimKey('player', 'SE')).toBe('player_walk_se');
    expect(walkAnimKey('player', 'NW')).toBe('player_walk_nw');
  });
});

function fakeScene(existing: string[] = []) {
  const created: Array<{
    key: string;
    frames: Array<{ key: string; frame: number }>;
    frameRate: number;
    repeat: number;
  }> = [];
  const anims = {
    exists: vi.fn((key: string) => existing.includes(key) || created.some((a) => a.key === key)),
    generateFrameNumbers: vi.fn((key: string, config: { start: number; end: number }) =>
      Array.from({ length: config.end - config.start + 1 }, (_, i) => ({
        key,
        frame: config.start + i,
      })),
    ),
    create: vi.fn((config: (typeof created)[number]) => {
      created.push(config);
      return config;
    }),
  };
  return { scene: { anims } as never, anims, created };
}

describe('registerCharacterAnimations', () => {
  it('creates one looping 8-frame 10 fps animation per sheet row (NE, SE, SW, NW)', () => {
    const { scene, created } = fakeScene();
    registerCharacterAnimations(scene, 'player', 'sheet_walk');
    expect(created.map((a) => a.key)).toEqual([
      'player_walk_ne',
      'player_walk_se',
      'player_walk_sw',
      'player_walk_nw',
    ]);
    created.forEach((anim, row) => {
      expect(anim.frames).toHaveLength(WALK_FRAMES);
      expect(anim.frames[0]).toEqual({ key: 'sheet_walk', frame: row * WALK_FRAMES });
      expect(anim.frames[7]).toEqual({ key: 'sheet_walk', frame: row * WALK_FRAMES + 7 });
      expect(anim.frameRate).toBe(WALK_FPS);
      expect(anim.repeat).toBe(-1);
    });
    expect(WALK_FRAMES).toBe(8);
    expect(WALK_FPS).toBe(10);
  });

  it('does not recreate animations that already exist (scene restart)', () => {
    const { scene, anims } = fakeScene(['player_walk_ne', 'player_walk_se']);
    registerCharacterAnimations(scene, 'player', 'sheet_walk');
    expect(anims.create).toHaveBeenCalledTimes(2);
  });
});

describe('planWalk', () => {
  const walking = { name: 'player', moving: true, hasWalk: true, facing: 'SE' as const };

  it('starts the walk of the facing from the first frame', () => {
    expect(planWalk({ ...walking, current: null })).toEqual({
      type: 'play',
      key: 'player_walk_se',
      startFrame: 0,
    });
  });

  it('keeps playing when the facing is unchanged', () => {
    expect(planWalk({ ...walking, current: { key: 'player_walk_se', frame: 5 } })).toEqual({
      type: 'keep',
    });
  });

  it('switches direction on the current frame so the stride continues', () => {
    expect(
      planWalk({ ...walking, facing: 'SW', current: { key: 'player_walk_se', frame: 5 } }),
    ).toEqual({ type: 'play', key: 'player_walk_sw', startFrame: 5 });
  });

  it('returns to the idle still of the last facing when stopping', () => {
    expect(
      planWalk({ ...walking, moving: false, current: { key: 'player_walk_se', frame: 3 } }),
    ).toEqual({ type: 'idle', facing: 'SE' });
  });

  it('uses the idle still while moving when there is no walk sheet', () => {
    expect(planWalk({ ...walking, hasWalk: false, current: null })).toEqual({
      type: 'idle',
      facing: 'SE',
    });
  });
});
