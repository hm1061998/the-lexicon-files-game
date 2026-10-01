import { describe, expect, it } from 'vitest';
import { findNavigationPath, type NavigationWorld } from './navigation';
import { moveWithCollisions } from './logicalCollision';
import { projectIso } from './isometricProjection';
const world: NavigationWorld = { bounds:{u:0,v:0,width:8,height:8}, body:{u:-.18,v:-.18,width:.36,height:.36}, solids:[], projection:{type:'dimetric-2:1',originX:0,originY:0,tileWidth:128,tileHeight:64} };
describe('navigation', () => {
  it('routes around a desk with every segment collision clear', () => {
    const fixture = {...world,solids:[{u:3,v:1,width:2,height:5}]};
    const start = {u:1,v:3};
    const result = findNavigationPath(start,{kind:'point',point:{u:7,v:3}},fixture);
    expect(result.status).toBe('found');
    if(result.status !== 'found') return;
    let previous = start;
    for(const point of result.points) {
      const moved = moveWithCollisions(previous,{u:point.u-previous.u,v:point.v-previous.v},fixture.body,fixture.solids,fixture.bounds);
      expect(moved.position.u).toBeCloseTo(point.u);
      expect(moved.position.v).toBeCloseTo(point.v);
      previous=point;
    }
    expect(previous).toEqual({u:7,v:3});
  });
  it('preserves a corridor with .96 logical clearance', () => {
    const fixture={...world,solids:[{u:0,v:0,width:8,height:3.52},{u:0,v:4.48,width:8,height:3.52}]};
    expect(findNavigationPath({u:1,v:4},{kind:'point',point:{u:7,v:4}},fixture).status).toBe('found');
  });
  it('does not cut between blockers touching at a corner', () => {
    const fixture={...world,bounds:{u:0,v:0,width:2,height:2},solids:[{u:1,v:0,width:1,height:1},{u:0,v:1,width:1,height:1}]};
    expect(findNavigationPath({u:.5,v:.5},{kind:'point',point:{u:1.5,v:1.5}},fixture).status).toBe('unreachable');
  });
  it('rejects invalid and enclosed destinations finitely', () => {
    expect(findNavigationPath({u:1,v:1},{kind:'point',point:{u:9,v:9}},world).status).toBe('invalid');
    expect(findNavigationPath({u:1,v:1},{kind:'point',point:{u:5,v:4}},{...world,solids:[{u:3,v:0,width:1,height:8}]}).status).toBe('unreachable');
  });
  it('approaches furniture within projected radius without entering it', () => {
    const fixture={...world,solids:[{u:4,v:3,width:2,height:2}]};
    const anchor={u:5,v:4};
    const result=findNavigationPath({u:1,v:4},{kind:'interaction',anchor,radiusPx:80},fixture);
    expect(result.status).toBe('found');
    if(result.status !== 'found') return;
    const end=projectIso(result.points.at(-1)!,world.projection), target=projectIso(anchor,world.projection);
    expect(Math.hypot(end.x-target.x,end.y-target.y)).toBeLessThanOrEqual(80);
  });
});

