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
  const key = (p: LogicalPoint) =>
    `${Math.round((p.u - w.bounds.u) / STEP)},${Math.round((p.v - w.bounds.v) / STEP)}`;
  const costs = new Map<string, number>();
  const add = (p: LogicalPoint, parent: Node | null, g: number) => {
    const k = key(p);
    if ((costs.get(k) ?? Infinity) <= g) return;
    costs.set(k, g);
    push({ point: p, parent, g, f: g + heuristic(p), key: k });
  };
  // Connect exact start to surrounding lattice points, rather than snapping through a solid.
  const su = (start.u - w.bounds.u) / STEP,
    sv = (start.v - w.bounds.v) / STEP;
  for (const u of new Set([Math.floor(su), Math.ceil(su)]))
    for (const v of new Set([Math.floor(sv), Math.ceil(sv)])) {
      const p = { u: w.bounds.u + u * STEP, v: w.bounds.v + v * STEP };
      if (navigationSegmentClear(start, p, w)) {
        const a = projectIso(start, w.projection),
          b = projectIso(p, w.projection);
        add(p, null, Math.hypot(a.x - b.x, a.y - b.y));
      }
    }
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
        const p = { u: node.point.u + du * STEP, v: node.point.v + dv * STEP };
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
