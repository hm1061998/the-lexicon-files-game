/** Checks on a parsed dialogue YAML file; every finding carries the line and column it points at. */

/** @typedef {import('./parseDialogueYaml.mjs').Issue} Issue */

const TREE_KEYS = ['tree', 'npc', 'done', 'finish', 'notes', 'entry', 'nodes'];
const NODE_KEYS = ['say', 'vi', 'speaker', 'needs', 'do', 'ask', 'audio', 'spans'];
const CHOICE_KEYS = ['id', 'say', 'vi', 'to', 'needs', 'do'];

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

function distance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const next = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = next;
    }
  }
  return row[b.length];
}

/** The candidate closest to `name` (at most 2 edits away), or undefined. */
export function nearest(name, candidates) {
  let best;
  let bestDistance = 3;
  for (const candidate of candidates) {
    const d = distance(String(name), candidate);
    if (d < bestDistance) {
      best = candidate;
      bestDistance = d;
    }
  }
  return best;
}

const REF_VERBS = {
  give: 'evidence',
  evidence: 'evidence',
  unlock: 'fact',
  fact: 'fact',
  activate: 'objective',
  complete: 'objective',
  objective: 'objective',
};
const REF_LABEL = { evidence: 'evidence', fact: 'fact', objective: 'objective' };

/** Calls `visit(item, path)` for every string of a `do` list or a `needs` value (groups included). */
function eachItem(value, path, visit) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      if (typeof item === 'string') visit(item, [...path, index]);
      else if (isObject(item)) eachItem(item, [...path, index], visit);
    });
  } else if (isObject(value)) {
    for (const key of ['all', 'any']) {
      if (Array.isArray(value[key])) eachItem(value[key], [...path, key], visit);
    }
  }
}

function verbOf(item) {
  const match = /^(\S+)\s+(\S.*?)\s*$/.exec(item.trim());
  return match ? [match[1], match[2]] : [null, null];
}

/**
 * Flags a parsed tree sets (`set`/`clear`) and reads (`flag`/`no-flag`, `finish`, `notes`).
 * @param {unknown} doc
 * @returns {{ sets: Set<string>; reads: Set<string> }}
 */
export function collectFlags(doc) {
  const sets = new Set();
  const reads = new Set();
  if (!isObject(doc)) return { sets, reads };
  const doItems = (value) =>
    eachItem(value, [], (item) => {
      const [verb, arg] = verbOf(item);
      if (verb === 'set' || verb === 'clear') sets.add(arg);
    });
  const needItems = (value) =>
    eachItem(value, [], (item) => {
      const [verb, arg] = verbOf(item);
      if (verb === 'flag' || verb === 'no-flag') reads.add(arg);
    });
  const flagList = (value) => {
    if (typeof value === 'string' && !/\s/.test(value)) reads.add(value);
    else if (Array.isArray(value) && value.every((v) => typeof v === 'string' && !/\s/.test(v)))
      value.forEach((v) => reads.add(v));
    else needItems(value);
  };
  flagList(doc.finish);
  if (isObject(doc.notes)) for (const value of Object.values(doc.notes)) flagList(value);
  if (isObject(doc.nodes)) {
    for (const node of Object.values(doc.nodes)) {
      if (!isObject(node)) continue;
      doItems(node.do);
      if (node.needs !== undefined) needItems(node.needs);
      for (const choice of Array.isArray(node.ask) ? node.ask : []) {
        if (!isObject(choice)) continue;
        doItems(choice.do);
        if (choice.needs !== undefined) needItems(choice.needs);
      }
    }
  }
  return { sets, reads };
}

/**
 * Flags a case's JSON sets or reads (objectives, scenes, facts, other files).
 * @param {unknown} value
 * @returns {{ sets: Set<string>; reads: Set<string> }}
 */
export function scanJsonFlags(value) {
  const sets = new Set();
  const reads = new Set();
  const walk = (node) => {
    if (Array.isArray(node)) node.forEach(walk);
    else if (isObject(node)) {
      if (node.type === 'flag' && typeof node.key === 'string') reads.add(node.key);
      if (node.type === 'setFlag' && typeof node.key === 'string') sets.add(node.key);
      Object.values(node).forEach(walk);
    }
  };
  walk(value);
  return { sets, reads };
}

/**
 * @param {{ doc: unknown; at: (path: (string | number)[], part?: 'key' | 'value') => { line: number; col: number } }} parsed
 * @param {{ file: string; refs?: { evidence: Set<string>; fact: Set<string>; objective: Set<string> } | null;
 *   externalSets?: Set<string>; externalReads?: Set<string> }} ctx
 * @returns {Issue[]}
 */
export function checkTree(parsed, ctx) {
  const doc = parsed.doc;
  if (!isObject(doc)) return [];
  /** @type {Issue[]} */
  const issues = [];
  const add = (path, part, code, level, message, hint) => {
    const { line, col } = parsed.at(path, part);
    issues.push({ file: ctx.file, line, col, code, level, message, ...(hint ? { hint } : {}) });
  };
  const hintFor = (name, candidates) => {
    const best = nearest(name, candidates);
    return best ? `ý bạn là: ${best} ?` : undefined;
  };
  const unknownKeys = (object, allowed, path, where) => {
    for (const key of Object.keys(object)) {
      if (!allowed.includes(key))
        add(
          [...path, key],
          'key',
          'unknown-key',
          'error',
          `khóa "${key}" không có trong ${where}`,
          hintFor(key, allowed),
        );
    }
  };

  unknownKeys(doc, TREE_KEYS, [], 'cây hội thoại');
  const nodes = isObject(doc.nodes) ? doc.nodes : {};
  const nodeIds = Object.keys(nodes);
  const referenced = new Set();

  const checkTarget = (target, path) => {
    if (typeof target !== 'string') return;
    referenced.add(target);
    if (!nodeIds.includes(target))
      add(
        path,
        'value',
        'unknown-node',
        'error',
        `"${target}" không có node nào tên này`,
        hintFor(target, nodeIds),
      );
  };
  if (doc.entry !== undefined) checkTarget(doc.entry, ['entry']);

  const checkRefs = (value, path) => {
    if (!ctx.refs) return;
    eachItem(value, path, (item, itemPath) => {
      const [verb, arg] = verbOf(item);
      const kind = verb ? REF_VERBS[verb] : undefined;
      if (!kind || !arg) return;
      const known = ctx.refs[kind];
      if (!known.has(arg))
        add(
          itemPath,
          'value',
          'unknown-ref',
          'error',
          `"${item}": không có ${REF_LABEL[kind]} "${arg}" trong case`,
          hintFor(arg, [...known]),
        );
    });
  };

  for (const [nodeId, node] of Object.entries(nodes)) {
    if (!isObject(node)) continue;
    const base = ['nodes', nodeId];
    unknownKeys(node, NODE_KEYS, base, `node "${nodeId}"`);
    if (node.do !== undefined) checkRefs(node.do, [...base, 'do']);
    if (node.needs !== undefined) checkRefs(node.needs, [...base, 'needs']);
    const seen = new Set();
    (Array.isArray(node.ask) ? node.ask : []).forEach((choice, index) => {
      if (!isObject(choice)) return;
      const path = [...base, 'ask', index];
      unknownKeys(choice, CHOICE_KEYS, path, 'lựa chọn');
      if (typeof choice.id === 'string') {
        if (seen.has(choice.id))
          add(
            path,
            'value',
            'duplicate-id',
            'error',
            `lựa chọn "${choice.id}" trùng id trong node "${nodeId}"`,
          );
        seen.add(choice.id);
      }
      checkTarget(choice.to, [...path, 'to']);
      if (choice.do !== undefined) checkRefs(choice.do, [...path, 'do']);
      if (choice.needs !== undefined) checkRefs(choice.needs, [...path, 'needs']);
    });
  }

  const first = doc.entry ?? nodeIds[0];
  for (const nodeId of nodeIds) {
    if (nodeId !== first && !referenced.has(nodeId))
      add(
        ['nodes', nodeId],
        'key',
        'orphan-node',
        'warn',
        `node "${nodeId}" không có lựa chọn nào trỏ tới`,
      );
  }

  const { sets, reads } = collectFlags(doc);
  const reachableSets = new Set([...sets, ...(ctx.externalSets ?? [])]);
  const reachableReads = new Set([...reads, ...(ctx.externalReads ?? [])]);
  const readAt = (flag) => {
    // Where this flag is read: the first place in the file that names it.
    for (const [nodeId, node] of Object.entries(nodes)) {
      if (!isObject(node)) continue;
      const hit = [];
      eachItem(node.needs, ['nodes', nodeId, 'needs'], (item, p) => {
        if (verbOf(item)[1] === flag) hit.push(p);
      });
      (Array.isArray(node.ask) ? node.ask : []).forEach((choice, i) => {
        if (isObject(choice))
          eachItem(choice.needs, ['nodes', nodeId, 'ask', i, 'needs'], (item, p) => {
            if (verbOf(item)[1] === flag) hit.push(p);
          });
      });
      if (hit[0]) return hit[0];
    }
    const inFinish =
      doc.finish === flag || (Array.isArray(doc.finish) && doc.finish.includes(flag));
    return inFinish ? ['finish'] : ['notes'];
  };
  for (const flag of reads) {
    if (!reachableSets.has(flag) && flag !== doc.done)
      add(
        readAt(flag),
        'value',
        'flag-never-set',
        'warn',
        `cờ "${flag}" được đọc nhưng không có nơi nào đặt`,
      );
  }
  const setAt = (flag) => {
    for (const [nodeId, node] of Object.entries(nodes)) {
      if (!isObject(node)) continue;
      const places = [[node.do, ['nodes', nodeId, 'do']]];
      (Array.isArray(node.ask) ? node.ask : []).forEach((choice, i) => {
        if (isObject(choice)) places.push([choice.do, ['nodes', nodeId, 'ask', i, 'do']]);
      });
      for (const [list, path] of places) {
        let found = null;
        eachItem(list, path, (item, p) => {
          if (!found && verbOf(item)[1] === flag) found = p;
        });
        if (found) return found;
      }
    }
    return [];
  };
  for (const flag of sets) {
    if (!reachableReads.has(flag))
      add(
        setAt(flag),
        'value',
        'flag-never-read',
        'warn',
        `cờ "${flag}" được đặt nhưng không có điều kiện nào đọc`,
      );
  }
  return issues;
}
