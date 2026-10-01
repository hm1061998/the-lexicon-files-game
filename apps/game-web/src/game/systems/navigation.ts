import type { IsoProjection } from '@lexicon/shared-types';
import { projectIso, type LogicalPoint } from './isometricProjection';
import { moveWithCollisions, type LogicalRect } from './logicalCollision';

export type NavigationGoal =
  | { kind: 'point'; point: LogicalPoint }
  | { kind: 'interaction'; anchor: LogicalPoint; radiusPx: number };
export type NavigationWorld = {
  bounds: LogicalRect;
  solids: readonly LogicalRect[];
  body: LogicalRect;
  projection: IsoProjection;
};
export type NavigationResult =
  | { status: 'found'; points: readonly LogicalPoint[] }
  | { status: 'unreachable' | 'invalid' | 'limit' };
const STEP = 0.125,
  EPS = 1e-8;
function clear(point: LogicalPoint, w: NavigationWorld): boolean {
  const { body: b, bounds: r } = w,
    u = point.u + b.u,
    v = point.v + b.v;
  return (
    Number.isFinite(u + v) &&
    u >= r.u - EPS &&
    v >= r.v - EPS &&
    u + b.width <= r.u + r.width + EPS &&
    v + b.height <= r.v + r.height + EPS &&
    !w.solids.some(
      (s) =>
        u < s.u + s.width - EPS &&
        u + b.width > s.u + EPS &&
        v < s.v + s.height - EPS &&
        v + b.height > s.v + EPS,
    )
  );
}
/** Conservative straight segment check, subdivided so the swept axis resolver cannot slide around corners. */
export function navigationSegmentClear(
  a: LogicalPoint,
  b: LogicalPoint,
  w: NavigationWorld,
): boolean {
  if (!clear(a, w) || !clear(b, w)) return false;
  const n = Math.ceil(Math.max(Math.abs(b.u - a.u), Math.abs(b.v - a.v)) / (STEP / 2));
  let previous = a;
  for (let i = 1; i <= n; i++) {
    const next = { u: a.u + ((b.u - a.u) * i) / n, v: a.v + ((b.v - a.v) * i) / n };
    if (!clear(next, w)) return false;
    const moved = moveWithCollisions(
      previous,
      { u: next.u - previous.u, v: next.v - previous.v },
      w.body,
      w.solids,
      w.bounds,
    );
    if (Math.abs(moved.position.u - next.u) > EPS || Math.abs(moved.position.v - next.v) > EPS)
      return false;
    previous = next;
  }
  return true;
}
/** Bounded A*, queried once per click. The floor plane and body clearance remain authoritative. */
export function findNavigationPath(
  start: LogicalPoint,
  goal: NavigationGoal,
  w: NavigationWorld,
): NavigationResult {
  const target = goal.kind === 'point' ? goal.point : goal.anchor;
  if (
    !clear(start, w) ||
    !Number.isFinite(target.u + target.v) ||
    (goal.kind === 'point' && !clear(target, w)) ||
    (goal.kind === 'interaction' && (!Number.isFinite(goal.radiusPx) || goal.radiusPx <= 0))
  )
    return { status: 'invalid' };
  const projectedTarget = projectIso(target, w.projection);
  const distance = (p: LogicalPoint) => {
    const s = projectIso(p, w.projection);
    return Math.hypot(s.x - projectedTarget.x, s.y - projectedTarget.y);
  };
  const reached = (p: LogicalPoint) =>
    goal.kind === 'interaction'
      ? distance(p) <= goal.radiusPx
      : Math.abs(p.u - target.u) <= STEP &&
        Math.abs(p.v - target.v) <= STEP &&
        navigationSegmentClear(p, target, w);
  if (reached(start)) return { status: 'found', points: goal.kind === 'point' ? [target] : [] };
  type Node = { point: LogicalPoint; g: number; f: number; parent: Node | null; key: string };
  const heuristic = (p: LogicalPoint) =>
    Math.max(0, distance(p) - (goal.kind === 'interaction' ? goal.radiusPx : 0));
  const heap: Node[] = [];
  const push = (node: Node) => {
    heap.push(node);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p]!.f <= node.f) break;
      heap[i] = heap[p]!;
      i = p;
    }
    heap[i] = node;
  };
  const pop = () => {
    const first = heap[0]!,
      last = heap.pop()!;
    if (heap.length) {
      let i = 0;
      while (i * 2 + 1 < heap.length) {
        let c = i * 2 + 1;
        if (c + 1 < heap.length && heap[c + 1]!.f < heap[c]!.f) c++;
        if (last.f <= heap[c]!.f) break;
        heap[i] = heap[c]!;
        i = c;
      }
      heap[i] = last;
    }
    return first;
  };
  // Add clearance boundaries and exact endpoints to the lattice so narrow off-grid
  // corridors and their turns remain connected without reducing a global fixed step.
  const axis = (name: 'u' | 'v', size: 'width' | 'height') => {
    const min = w.bounds[name] - w.body[name];
    const max = w.bounds[name] + w.bounds[size] - w.body[name] - w.body[size];
    const values = [min, max, start[name], target[name]];
    for (let value = min; value <= max; value += STEP) values.push(value);
    for (const solid of w.solids)
      values.push(
        solid[name] - w.body[name] - w.body[size],
        solid[name] + solid[size] - w.body[name],
      );
    return [...new Set(values.filter((v) => v >= min - EPS && v <= max + EPS))].sort(
      (a, b) => a - b,
    );
  };
  const us = axis('u', 'width'),
    vs = axis('v', 'height');
  const ui = new Map(us.map((u, i) => [u, i])),
    vi = new Map(vs.map((v, i) => [v, i]));
  const key = (p: LogicalPoint) => `${ui.get(p.u)},${vi.get(p.v)}`;
  const costs = new Map<string, number>();
  const add = (p: LogicalPoint, parent: Node | null, g: number) => {
    const k = key(p);
    if ((costs.get(k) ?? Infinity) <= g) return;
    costs.set(k, g);
    push({ point: p, parent, g, f: g + heuristic(p), key: k });
  };
  add(start, null, 0);
  let expanded = 0;
  while (heap.length) {
    const node = pop();
    if (node.g !== costs.get(node.key)) continue;
    if (++expanded > 50000) return { status: 'limit' };
    if (reached(node.point)) {
      const path: LogicalPoint[] = [];
      let n: Node | null = node;
      while (n) {
        path.push(n.point);
        n = n.parent;
      }
      path.reverse();
      if (goal.kind === 'point') path.push(target);
      return { status: 'found', points: path };
    }
    for (let du = -1; du <= 1; du++)
      for (let dv = -1; dv <= 1; dv++) {
        if (!du && !dv) continue;
        const u = us[ui.get(node.point.u)! + du],
          v = vs[vi.get(node.point.v)! + dv];
        if (u === undefined || v === undefined) continue;
        const p = { u, v };
        if (!navigationSegmentClear(node.point, p, w)) continue;
        if (
          du &&
          dv &&
          (!navigationSegmentClear(node.point, { u: p.u, v: node.point.v }, w) ||
            !navigationSegmentClear(node.point, { u: node.point.u, v: p.v }, w))
        )
          continue;
        const a = projectIso(node.point, w.projection),
          b = projectIso(p, w.projection);
        add(p, node, node.g + Math.hypot(a.x - b.x, a.y - b.y));
      }
  }
  return { status: 'unreachable' };
}
