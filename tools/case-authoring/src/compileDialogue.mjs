import { checkTree } from './checkDialogue.mjs';
import { FormError, parseDo, parseNeeds } from './forms.mjs';
import { parseDialogueYaml } from './parseDialogueYaml.mjs';
import { extractSpans } from './vocab.mjs';

/** @typedef {import('./parseDialogueYaml.mjs').Issue} Issue */

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/** Adds `key: value` only when the value is defined, so optional keys stay out of the JSON. */
function put(target, key, value) {
  if (value !== undefined) target[key] = value;
}

/**
 * Compiles one dialogue YAML file to the engine's dialogue tree.
 * @param {string} source
 * @param {{ file: string; vocabulary: { id: string; lemma: string; surfaceForms?: string[] }[];
 *   refs?: { evidence: Set<string>; fact: Set<string>; objective: Set<string> } | null;
 *   externalSets?: Set<string>; externalReads?: Set<string> }} ctx
 * @returns {{ tree: object | null; issues: Issue[] }}
 */
export function compileTree(source, ctx) {
  const parsed = parseDialogueYaml(source, ctx.file);
  /** @type {Issue[]} */
  const issues = [...parsed.issues];
  if (parsed.doc === null) return { tree: null, issues };
  issues.push(...checkTree(parsed, ctx));

  const error = (path, part, code, message, hint) => {
    const { line, col } = parsed.at(path, part);
    issues.push({
      file: ctx.file,
      line,
      col,
      code,
      level: 'error',
      message,
      ...(hint ? { hint } : {}),
    });
  };
  const guard = (path, value, run) => {
    try {
      return run();
    } catch (e) {
      if (!(e instanceof FormError)) throw e;
      // A list reports the item that is wrong; a group is reported as a whole.
      error(Array.isArray(value) ? [...path, e.index] : path, 'value', 'bad-form', e.message);
      return undefined;
    }
  };
  const need = (object, key, path) => {
    if (object[key] === undefined) {
      error(path, 'key', 'bad-form', `thiếu khóa "${key}"`);
      return undefined;
    }
    return object[key];
  };
  const condition = (value, path) => guard(path, value, () => parseNeeds(value));
  const effects = (value, path) => guard(path, value, () => parseDo(value));

  const doc = parsed.doc;
  if (!isObject(doc)) {
    error([], 'value', 'bad-form', 'file phải là một bảng khóa: giá trị (tree, npc, nodes…)');
    return { tree: null, issues };
  }
  const id = need(doc, 'tree', []);
  const npc = need(doc, 'npc', []);
  const done = need(doc, 'done', []);
  const finish = need(doc, 'finish', []);
  const nodesIn = need(doc, 'nodes', []);
  if (!isObject(nodesIn) || !Object.keys(nodesIn).length) {
    if (nodesIn !== undefined)
      error(['nodes'], 'value', 'bad-form', 'nodes phải có ít nhất một node');
    return { tree: null, issues };
  }

  const nodes = [];
  for (const [nodeId, raw] of Object.entries(nodesIn)) {
    const base = ['nodes', nodeId];
    if (!isObject(raw)) {
      error(base, 'value', 'bad-form', `node "${nodeId}" phải là một bảng khóa: giá trị`);
      continue;
    }
    const markup = need(raw, 'say', base);
    let text = markup;
    let spans = [];
    if (typeof markup === 'string') {
      const result = extractSpans(markup, ctx.vocabulary);
      text = result.text;
      spans = result.spans;
      for (const issue of result.issues)
        error([...base, 'say'], 'value', issue.code, issue.message, issue.hint);
    }
    const asks = Array.isArray(raw.ask) ? raw.ask : [];
    const node = { id: nodeId, speakerId: raw.speaker ?? npc };
    put(node, 'text', text);
    put(node, 'audio', raw.audio);
    put(node, 'translationVi', raw.vi);
    // An authored empty list (`spans: []`) is kept as `vocabularySpans: []`; no marks and no key means no key.
    if (spans.length) node.vocabularySpans = spans;
    else if (Array.isArray(raw.spans) && raw.spans.length === 0) node.vocabularySpans = [];
    node.terminal = asks.length === 0;
    node.choices = asks.map((choice, index) => {
      const path = [...base, 'ask', index];
      const out = {};
      put(out, 'id', need(choice, 'id', path));
      put(out, 'text', need(choice, 'say', path));
      put(out, 'translationVi', choice.vi);
      put(out, 'nextNodeId', need(choice, 'to', path));
      if (choice.needs !== undefined)
        put(out, 'condition', condition(choice.needs, [...path, 'needs']));
      if (choice.do !== undefined) put(out, 'effects', effects(choice.do, [...path, 'do']));
      return out;
    });
    if (raw.needs !== undefined) put(node, 'condition', condition(raw.needs, [...base, 'needs']));
    if (raw.do !== undefined) put(node, 'effects', effects(raw.do, [...base, 'do']));
    nodes.push(node);
  }

  const flagsAll = (list) =>
    list.length === 1
      ? { type: 'flag', key: list[0], value: true }
      : { type: 'all', conditions: list.map((key) => ({ type: 'flag', key, value: true })) };
  const completion =
    finish === undefined
      ? undefined
      : typeof finish === 'string' && !/\s/.test(finish)
        ? flagsAll([finish])
        : Array.isArray(finish) && finish.every((f) => typeof f === 'string' && !/\s/.test(f))
          ? flagsAll(finish)
          : condition(finish, ['finish']);
  const notes = isObject(doc.notes)
    ? Object.entries(doc.notes).map(([nodeId, value]) => ({
        nodeId,
        recordedCondition:
          typeof value === 'string' && !/\s/.test(value)
            ? { type: 'flag', key: value, value: true }
            : condition(value, ['notes', nodeId]),
      }))
    : undefined;

  if (issues.some((i) => i.level === 'error')) return { tree: null, issues };
  const tree = {};
  put(tree, 'id', id);
  put(tree, 'npcId', npc);
  put(tree, 'entryNodeId', doc.entry ?? nodes[0].id);
  tree.nodes = nodes;
  put(tree, 'completionFlag', done);
  put(tree, 'completionCondition', completion);
  if (notes) tree.notebookStatements = notes;
  return { tree, issues };
}
