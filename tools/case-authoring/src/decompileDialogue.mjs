import { isDeepStrictEqual } from 'node:util';
import { Document, visit } from 'yaml';

import { compileTree } from './compileDialogue.mjs';
import { formatDo, formatNeeds } from './forms.mjs';
import { injectMarkup } from './vocab.mjs';

/** @typedef {import('./parseDialogueYaml.mjs').Issue} Issue */

/** Path of the first place two JSON values differ, for the message when a tree cannot be written. */
function firstDifference(a, b, path = '') {
  if (isDeepStrictEqual(a, b)) return null;
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
      const found = firstDifference(a[key], b[key], path ? `${path}.${key}` : key);
      if (found) return found;
    }
  }
  return path || '(gốc)';
}

const isPlainFlag = (c) => c.type === 'flag' && c.value === true;

/** A flag-only condition as the short `finish` / `notes` value, else the general needs form. */
function shortCondition(c) {
  if (isPlainFlag(c)) return c.key;
  if (c.type === 'all' && c.conditions.length >= 2 && c.conditions.every(isPlainFlag))
    return c.conditions.map((x) => x.key);
  return formatNeeds(c);
}

function put(target, key, value) {
  if (value !== undefined) target[key] = value;
}

/**
 * Turns a dialogue tree into dialogue YAML. Refuses (no YAML, an error issue) anything the short forms
 * cannot say exactly: the result is compiled again and must equal the tree it came from.
 * @param {object} tree
 * @param {{ id: string; lemma: string; surfaceForms?: string[] }[]} vocabulary
 * @returns {{ yaml: string | null; issues: Issue[] }}
 */
export function decompileTree(tree, vocabulary) {
  const fail = (message) => ({
    yaml: null,
    issues: [
      { file: tree.id, line: 0, col: 0, code: 'not-representable', level: 'error', message },
    ],
  });
  const out = { tree: tree.id, npc: tree.npcId, done: tree.completionFlag };
  const finish = shortCondition(tree.completionCondition);
  out.finish = typeof finish === 'string' ? [finish] : finish;
  if (tree.notebookStatements?.length) {
    out.notes = Object.fromEntries(
      tree.notebookStatements.map((n) => [n.nodeId, shortCondition(n.recordedCondition)]),
    );
  }
  if (tree.entryNodeId !== tree.nodes[0].id) out.entry = tree.entryNodeId;
  out.nodes = {};
  for (const node of tree.nodes) {
    const item = {};
    try {
      item.say = injectMarkup(node.text, node.vocabularySpans ?? [], vocabulary);
    } catch (e) {
      return fail(`cây "${tree.id}", node "${node.id}": ${e.message}`);
    }
    if (Array.isArray(node.vocabularySpans) && node.vocabularySpans.length === 0) item.spans = [];
    put(item, 'vi', node.translationVi);
    put(item, 'audio', node.audio);
    if (node.speakerId !== tree.npcId) item.speaker = node.speakerId;
    if (node.condition) item.needs = formatNeeds(node.condition);
    if (node.effects) item.do = formatDo(node.effects);
    if (node.choices.length) {
      item.ask = node.choices.map((choice) => {
        const c = { id: choice.id, say: choice.text };
        put(c, 'vi', choice.translationVi);
        c.to = choice.nextNodeId;
        if (choice.condition) c.needs = formatNeeds(choice.condition);
        if (choice.effects) c.do = formatDo(choice.effects);
        return c;
      });
    }
    out.nodes[node.id] = item;
  }

  const document = new Document(out);
  // Short lists read best on one line.
  visit(document, {
    Seq(_key, seq, path) {
      const pair = path[path.length - 1];
      const name = pair && 'key' in pair ? pair.key?.value : undefined;
      if (name === 'do' || name === 'needs' || name === 'finish') seq.flow = true;
    },
  });
  const yaml = document.toString({ lineWidth: 0 });

  const again = compileTree(yaml, { file: `${tree.id}.yaml`, vocabulary });
  const errors = again.issues.filter((issue) => issue.level === 'error');
  if (errors.length || !isDeepStrictEqual(again.tree, tree))
    return fail(
      `cây "${tree.id}": dạng rút gọn không tái tạo đúng cây, khác ở "${firstDifference(again.tree ?? {}, tree) ?? '?'}"` +
        (errors.length ? ` (${errors[0].code}: ${errors[0].message})` : ''),
    );
  return { yaml, issues: [] };
}
