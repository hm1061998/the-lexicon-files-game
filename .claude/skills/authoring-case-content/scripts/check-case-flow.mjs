#!/usr/bin/env node
// Static playthrough simulator for a Lexicon Files case (no dependencies).
// Mirrors game-core semantics (applyEffects, reconcileDialogueProgress, dialogueRunner,
// submitContradiction, submitAccusation) as of 2026-10-02 and explores every action a
// player could take, monotonically, until nothing new happens.
//
// Usage: node .claude/skills/authoring-case-content/scripts/check-case-flow.mjs <case-id> [--json] [--cases-dir <dir>]
// Exit code: 1 when ERROR findings exist, 0 otherwise.
//
// This is a heuristic: it over-approximates (assumes the player tries everything) and treats
// setFlag false as a no-op. It does not replace `npm run test -w @lexicon/game-content`.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ENGINE_FLAGS = new Set(['case_closed', 'david_contradiction_found']);

function findRepoRoot(start) {
  let dir = start;
  while (dir !== dirname(dir)) {
    if (existsSync(join(dir, 'packages', 'game-content', 'cases'))) return dir;
    dir = dirname(dir);
  }
  return null;
}

const caseId = process.argv[2];
const asJson = process.argv.includes('--json');
if (!caseId) {
  console.error('usage: check-case-flow.mjs <case-id> [--json]');
  process.exit(2);
}
const root =
  findRepoRoot(process.cwd()) ?? findRepoRoot(dirname(fileURLToPath(import.meta.url)));
if (!root) {
  console.error('cannot find packages/game-content/cases from cwd');
  process.exit(2);
}
const dirFlag = process.argv.indexOf('--cases-dir');
const casesDir =
  dirFlag > 0 ? resolve(process.argv[dirFlag + 1]) : join(root, 'packages', 'game-content', 'cases');
const dir = join(casesDir, caseId);
const read = (f, key) => {
  const p = join(dir, f);
  if (!existsSync(p)) return [];
  const j = JSON.parse(readFileSync(p, 'utf8'));
  return key ? (j[key] ?? []) : j;
};

const kase = read('case.json');
const def = {
  case: kase,
  objectives: read('objectives.json', 'objectives'),
  evidences: read('evidences.json', 'evidences'),
  facts: read('facts.json', 'facts'),
  contradictions: read('contradictions.json', 'contradictions'),
  tasks: read('listening-tasks.json', 'tasks'),
  npcs: read('npcs.json', 'npcs'),
  dialogues: read('dialogues.json', 'dialogues'),
  scenes: (kase.sceneIds ?? []).map((id) => read(join('scenes', `${id}.json`))),
};

const findings = [];
const add = (level, code, msg) => findings.push({ level, code, msg });

// ---------- engine model ----------
const state = {
  ev: new Set(),
  facts: new Set(),
  flags: new Map(),
  obj: new Map(),
  contra: new Set(),
  timeline: new Set(),
};
for (const o of def.objectives)
  state.obj.set(o.id, o.id === kase.initialObjectiveId ? 'active' : (o.initialStatus ?? 'locked'));

function evalCond(c) {
  switch (c.type) {
    case 'hasEvidence':
      return state.ev.has(c.evidenceId);
    case 'hasFact':
      return state.facts.has(c.factId);
    case 'objectiveCompleted':
      return state.obj.get(c.objectiveId) === 'completed';
    case 'flag':
      return state.flags.get(c.key) === c.value; // undefined !== false (engine semantics)
    case 'all':
      return c.conditions.every(evalCond);
    case 'any':
      return c.conditions.some(evalCond);
    default:
      return false;
  }
}
function dialogueAllowed(c) {
  if (!c) return true;
  if (c.type === 'flag') return (state.flags.get(c.key) ?? false) === c.value;
  if (c.type === 'all') return c.conditions.every(dialogueAllowed);
  if (c.type === 'any') return c.conditions.some(dialogueAllowed);
  return evalCond(c);
}

let changed = false;
const batchOutcome = new Map(); // key -> {ok:boolean, reason}
function applyBatch(effects, key) {
  // validate first (engine aborts the whole batch on error)
  const sim = new Map(state.obj);
  for (const e of effects) {
    if (e.type === 'activateObjective' || e.type === 'completeObjective') {
      const st = sim.get(e.objectiveId);
      if (st === undefined) return fail(key, `unknown objective ${e.objectiveId}`);
      if (st === 'completed') return fail(key, `${e.type} ${e.objectiveId}: already completed`);
      if (e.type === 'completeObjective' && st !== 'active')
        return fail(key, `completeObjective ${e.objectiveId}: objective is ${st}`);
      sim.set(e.objectiveId, e.type === 'activateObjective' ? (st === 'locked' ? 'active' : st) : 'completed');
    }
  }
  for (const e of effects) {
    if (e.type === 'addEvidence' && !state.ev.has(e.evidenceId)) (state.ev.add(e.evidenceId), (changed = true));
    if (e.type === 'setFlag' && e.value === true && state.flags.get(e.key) !== true)
      (state.flags.set(e.key, true), (changed = true));
    if (e.type === 'unlockFact') {
      const f = def.facts.find((x) => x.id === e.factId);
      if (f && !state.facts.has(f.id) && evalCond(f.unlockCondition)) (state.facts.add(f.id), (changed = true));
    }
  }
  for (const [id, st] of sim) if (state.obj.get(id) !== st) (state.obj.set(id, st), (changed = true));
  autoFacts();
  batchOutcome.set(key, { ok: true });
  return true;
}
function fail(key, reason) {
  if (!batchOutcome.get(key)?.ok) batchOutcome.set(key, { ok: false, reason });
  return false;
}
function autoFacts() {
  let again = true;
  while (again) {
    again = false;
    for (const f of def.facts)
      if (!state.facts.has(f.id) && evalCond(f.unlockCondition)) {
        state.facts.add(f.id);
        changed = again = true;
      }
  }
}
function reconcile() {
  const done = def.dialogues
    .filter((t) => state.flags.get(t.completionFlag) !== true && evalCond(t.completionCondition))
    .map((t) => ({ type: 'setFlag', key: t.completionFlag, value: true }));
  applyBatch(done, 'reconcile:interviews');
  const act = def.objectives
    .filter((o) => state.obj.get(o.id) === 'locked' && o.activationCondition && evalCond(o.activationCondition))
    .map((o) => ({ type: 'activateObjective', objectiveId: o.id }));
  applyBatch(act, 'reconcile:activation');
  const comp = def.objectives
    .filter((o) => state.obj.get(o.id) === 'active' && o.completionCondition && evalCond(o.completionCondition))
    .map((o) => ({ type: 'completeObjective', objectiveId: o.id }));
  applyBatch(comp, 'reconcile:completion');
}
function pendingReconcile() {
  return def.objectives.filter(
    (o) =>
      (state.obj.get(o.id) === 'locked' && o.activationCondition && evalCond(o.activationCondition)) ||
      (state.obj.get(o.id) === 'active' && o.completionCondition && evalCond(o.completionCondition)),
  );
}
const delayed = new Map();
function nonDialogueAction(effects, key) {
  const ok = applyBatch(effects, key);
  if (ok) for (const o of pendingReconcile()) if (!delayed.has(o.id)) delayed.set(o.id, key);
  return ok;
}

// ---------- world ----------
const sceneById = new Map(def.scenes.map((s) => [s.id, s]));
function reachableScenes() {
  const seen = new Set();
  const q = [kase.startSceneId];
  while (q.length) {
    const id = q.shift();
    if (seen.has(id) || !sceneById.has(id)) continue;
    seen.add(id);
    for (const a of sceneById.get(id).assets ?? []) if (a.interaction?.transition) q.push(a.interaction.transition.targetSceneId);
  }
  return seen;
}
const visitedNodes = new Set();
function exploreTree(tree) {
  const entry = tree.nodes.find((n) => n.id === tree.entryNodeId);
  if (!entry || !dialogueAllowed(entry.condition)) return;
  if (!applyBatch(entry.effects ?? [], `dialogue:${tree.id}:${entry.id}:enter`)) return;
  reconcile();
  const q = [entry.id];
  const seen = new Set();
  while (q.length) {
    const nextId = q.shift();
    const node = tree.nodes.find((n) => n.id === nextId);
    if (!node || seen.has(node.id) || !dialogueAllowed(node.condition)) continue;
    seen.add(node.id);
    visitedNodes.add(`${tree.id}:${node.id}`);
    if (node.terminal) continue;
    for (const ch of node.choices) {
      const target = tree.nodes.find((n) => n.id === ch.nextNodeId);
      if (!target || !dialogueAllowed(ch.condition) || !dialogueAllowed(target.condition)) continue;
      const ok = applyBatch([...(ch.effects ?? []), ...(target.effects ?? [])], `dialogue:${tree.id}:${node.id}>${ch.id}`);
      if (!ok) continue;
      reconcile();
      q.push(target.id);
    }
  }
}

let rounds = 0;
let closed = false;
do {
  changed = false;
  rounds++;
  const scenes = reachableScenes();
  for (const sid of scenes)
    for (const a of sceneById.get(sid).assets ?? []) {
      const i = a.interaction;
      if (!i || i.npcId || i.transition || !i.effects?.length) continue;
      const evIds = i.effects.filter((e) => e.type === 'addEvidence').map((e) => e.evidenceId);
      if (evIds.length && evIds.some((id) => state.ev.has(id))) continue; // hidden after pickup
      nonDialogueAction(i.effects, `scene:${sid}:${a.id}`);
    }
  for (const t of def.tasks)
    if (state.ev.has(t.evidenceId)) nonDialogueAction(t.correctEffects ?? [], `listening:${t.id}`);
  for (const c of def.contradictions)
    if (!state.contra.has(c.id) && c.factIds.every((f) => state.facts.has(f))) {
      if (
        nonDialogueAction(
          [{ type: 'setFlag', key: 'david_contradiction_found', value: true }, { type: 'completeObjective', objectiveId: c.objectiveId }],
          `contradiction:${c.id}`,
        )
      )
        (state.contra.add(c.id), (changed = true));
    }
  for (const ev of kase.timeline?.events ?? [])
    if (!state.timeline.has(ev.id) && (ev.availability.type === 'availableFromStart' || ev.availability.factIds.every((f) => state.facts.has(f))))
      (state.timeline.add(ev.id), (changed = true));
  // talking to any reachable NPC (re)runs dialogue + reconcile
  const npcsHere = new Set();
  for (const sid of scenes) for (const a of sceneById.get(sid).assets ?? []) if (a.interaction?.npcId) npcsHere.add(a.interaction.npcId);
  for (const npcId of npcsHere) {
    const npc = def.npcs.find((n) => n.id === npcId);
    const tree = npc && def.dialogues.find((t) => t.id === npc.dialogueTreeId);
    if (tree) exploreTree(tree);
  }
  const concl = kase.conclusion;
  if (concl && !closed && state.obj.get(concl.objectiveId) === 'active') {
    if (applyBatch([{ type: 'completeObjective', objectiveId: concl.objectiveId }, { type: 'setFlag', key: 'case_closed', value: true }], 'accusation'))
      closed = true;
  }
} while (changed && rounds < 200);

// ---------- findings ----------
const scenes = reachableScenes();
for (const id of kase.sceneIds ?? []) if (!scenes.has(id)) add('ERROR', 'scene-unreachable', `scene "${id}" cannot be reached from startSceneId "${kase.startSceneId}"`);
if (kase.conclusion && !closed) add('ERROR', 'case-not-closable', `case_closed never reached; conclusion objective "${kase.conclusion.objectiveId}" is ${state.obj.get(kase.conclusion.objectiveId)}`);
for (const e of def.evidences) if (!state.ev.has(e.id)) add('ERROR', 'evidence-unreachable', `evidence "${e.id}" is never collected`);
if (typeof kase.evidenceTotal === 'number' && kase.evidenceTotal !== def.evidences.length)
  add('INFO', 'evidence-total', `evidenceTotal=${kase.evidenceTotal} but evidences.json has ${def.evidences.length}`);
const usedFacts = new Set([...def.contradictions.flatMap((c) => c.factIds), ...(kase.timeline?.events ?? []).flatMap((e) => (e.availability.factIds ?? []))]);
for (const f of def.facts) if (!state.facts.has(f.id)) add(usedFacts.has(f.id) ? 'ERROR' : 'WARN', 'fact-unreachable', `fact "${f.id}" never unlocks`);
for (const c of def.contradictions) if (!state.contra.has(c.id)) add('ERROR', 'contradiction-unreachable', `contradiction "${c.id}" can never be submitted successfully (objective "${c.objectiveId}" is ${state.obj.get(c.objectiveId)})`);
for (const o of def.objectives) {
  const st = state.obj.get(o.id);
  if (st !== 'completed') add(st === 'locked' ? 'ERROR' : 'WARN', 'objective-stuck', `objective "${o.id}" ends ${st}`);
}
for (const ev of kase.timeline?.events ?? []) if (!state.timeline.has(ev.id)) add('ERROR', 'timeline-unavailable', `timeline event "${ev.id}" never becomes available`);
for (const [key, out] of batchOutcome) if (!out.ok && !key.startsWith('reconcile')) add('ERROR', 'batch-always-fails', `${key}: whole effect batch is dropped — ${out.reason}`);
for (const [o, cause] of delayed)
  add('WARN', 'delayed-reconcile', `objective "${o}" becomes ready after ${cause}, but objectives only reconcile on the next dialogue step (player must talk to someone)`);
for (const t of def.dialogues) for (const n of t.nodes) if (!visitedNodes.has(`${t.id}:${n.id}`)) add('WARN', 'node-unvisited', `dialogue node ${t.id}:${n.id} is never shown in any playthrough`);

// flags
const written = new Set(['case_closed', 'david_contradiction_found']);
const readFlags = new Set();
const walkC = (c) => (c.type === "flag" ? readFlags.add(c.key) : c.conditions?.forEach(walkC));
const walkE = (es) => es?.forEach((e) => e.type === 'setFlag' && written.add(e.key));
for (const t of def.dialogues) {
  written.add(t.completionFlag);
  walkC(t.completionCondition);
  t.notebookStatements?.forEach((s) => walkC(s.recordedCondition));
  for (const n of t.nodes) {
    n.condition && walkC(n.condition);
    walkE(n.effects);
    for (const c of n.choices) (c.condition && walkC(c.condition), walkE(c.effects));
  }
}
for (const o of def.objectives) (o.activationCondition && walkC(o.activationCondition), o.completionCondition && walkC(o.completionCondition));
for (const f of def.facts) walkC(f.unlockCondition);
for (const t of def.tasks) walkE(t.correctEffects);
for (const s of def.scenes) for (const a of s.assets ?? []) (walkE(a.interaction?.effects), a.cue?.visibleWhen && walkC(a.cue.visibleWhen));
for (const k of readFlags) if (!written.has(k)) add('ERROR', 'flag-never-written', `flag "${k}" is read by a condition but never set`);
for (const s of def.scenes)
  for (const a of s.assets ?? [])
    if (a.interaction?.transition && a.interaction.effects?.length)
      add('WARN', 'effects-ignored', `scenes.${s.id}.${a.id}: interaction has a transition, so its effects are ignored`);

// cross-case id collisions (see F-2)
const others = readdirSync(casesDir).filter((d) => d !== caseId && existsSync(join(casesDir, d, 'dialogues.json')));
for (const other of others) {
  const od = JSON.parse(readFileSync(join(casesDir, other, 'dialogues.json'), 'utf8')).dialogues ?? [];
  const ids = new Set(od.map((t) => t.id));
  for (const t of def.dialogues) if (ids.has(t.id)) add('ERROR', 'cross-case-tree-id', `dialogue tree id "${t.id}" also exists in ${other} (learning contexts are not case-scoped, F-2)`);
}

const order = { ERROR: 0, WARN: 1, INFO: 2 };
findings.sort((a, b) => order[a.level] - order[b.level]);
const summary = {
  caseId,
  rounds,
  closable: closed,
  evidence: `${state.ev.size}/${def.evidences.length}`,
  facts: `${state.facts.size}/${def.facts.length}`,
  contradictions: `${state.contra.size}/${def.contradictions.length}`,
  findings,
};
if (asJson) console.log(JSON.stringify(summary, null, 2));
else {
  console.log(`[check-case-flow] ${caseId}: closable=${closed} evidence=${summary.evidence} facts=${summary.facts} contradictions=${summary.contradictions} (${rounds} rounds)`);
  for (const f of findings) console.log(`${f.level.padEnd(5)} ${f.code}: ${f.msg}`);
  if (!findings.length) console.log('no findings');
}
process.exit(findings.some((f) => f.level === 'ERROR') ? 1 : 0);
