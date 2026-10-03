import { checkTree } from './checkDialogue.mjs';
import { FormError, parseDo, parseNeeds } from './forms.mjs';
import { parseDialogueYaml } from './parseDialogueYaml.mjs';
import { extractSpans } from './vocab.mjs';

/** @typedef {import('./parseDialogueYaml.mjs').Issue} Issue */

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const INTEGER_LIKE = /^(0|[1-9]\d*)$/;
const UNESCAPED_BRACKET = /(?<!\\)\[/;

/** Adds `key: value` only when the value is defined, so optional keys stay out of the JSON. */
function put(target, key, value) {
  if (value !== undefined) target[key] = value;
}

/**
 * Compiles one dialogue YAML file to the engine's dialogue tree.
 * @param {string} source
 * @param {{ file: string; vocabulary: { id: string; lemma: string; surfaceForms?: string[] }[];
 *   refs?: { evidence: Set<string>; fact: Set<string>; objective: Set<string> } | null;
 *   externalSets?: Set<string>; externalReads?: Set<string>;
 *   expect?: { treeId: string; npcId: string } }} ctx
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
  const guard = (path, run) => {
    try {
      return run();
    } catch (e) {
      if (!(e instanceof FormError)) throw e;
      error([...path, ...e.path], 'value', 'bad-form', e.message);
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
  /** A value that must be a text; anything else is reported where it is written. */
  const text = (value, path, what) => {
    if (value === undefined) return undefined;
    if (typeof value === 'string') return value;
    error(
      path,
      'value',
      'bad-form',
      `${what} phải là chuỗi, không phải ${value === null ? 'rỗng' : typeof value}`,
    );
    return undefined;
  };
  const condition = (value, path) => guard(path, () => parseNeeds(value));
  const effects = (value, path) => guard(path, () => parseDo(value));

  const doc = parsed.doc;
  if (!isObject(doc)) {
    error([], 'value', 'bad-form', 'file phải là một bảng khóa: giá trị (tree, npc, nodes…)');
    return { tree: null, issues };
  }
  const id = text(need(doc, 'tree', []), ['tree'], 'tree');
  const npc = text(need(doc, 'npc', []), ['npc'], 'npc');
  const done = text(need(doc, 'done', []), ['done'], 'done');
  const finish = need(doc, 'finish', []);
  const entry = text(doc.entry, ['entry'], 'entry');
  const nodesIn = need(doc, 'nodes', []);
  if (ctx.expect) {
    if (id !== undefined && id !== ctx.expect.treeId)
      error(
        ['tree'],
        'value',
        'tree-mismatch',
        `tree: "${id}" nhưng npcs.json đặt dialogueTreeId "${ctx.expect.treeId}" cho file này`,
      );
    if (npc !== undefined && npc !== ctx.expect.npcId)
      error(
        ['npc'],
        'value',
        'tree-mismatch',
        `npc: "${npc}" nhưng npcs.json gán cây này cho "${ctx.expect.npcId}"`,
      );
  }
  if (!isObject(nodesIn) || !Object.keys(nodesIn).length) {
    if (nodesIn !== undefined)
      error(['nodes'], 'value', 'bad-form', 'nodes phải có ít nhất một node');
    return { tree: null, issues };
  }
  if (doc.notes !== undefined && !isObject(doc.notes))
    error(['notes'], 'value', 'bad-form', 'notes phải là bảng "node: cờ"');

  const nodes = [];
  for (const [nodeId, raw] of Object.entries(nodesIn)) {
    const base = ['nodes', nodeId];
    if (INTEGER_LIKE.test(nodeId)) {
      // JavaScript lists integer keys first and in numeric order: the node order would change silently.
      error(
        base,
        'key',
        'bad-form',
        `id node "${nodeId}" là số nguyên; đặt tên có chữ (ví dụ "n${nodeId}")`,
      );
      continue;
    }
    if (!isObject(raw)) {
      error(base, 'value', 'bad-form', `node "${nodeId}" phải là một bảng khóa: giá trị`);
      continue;
    }
    const markup = text(need(raw, 'say', base), [...base, 'say'], 'say');
    let line = markup;
    let spans = [];
    if (markup !== undefined) {
      const result = extractSpans(markup, ctx.vocabulary);
      line = result.text;
      spans = result.spans;
      for (const issue of result.issues) {
        // Point at the bracket when the value sits on one line, else at the start of the value.
        const at = parsed.at([...base, 'say'], 'value');
        const close = markup.indexOf(']', issue.at);
        const bracket = markup.slice(issue.at, close === -1 ? undefined : close + 1);
        const column = parsed.lineText(at.line).indexOf(bracket);
        issues.push({
          file: ctx.file,
          line: at.line,
          col: column >= 0 ? column + 1 : at.col,
          code: issue.code,
          level: 'error',
          message: issue.message,
          ...(issue.hint ? { hint: issue.hint } : {}),
        });
      }
    }
    if (raw.ask !== undefined && !Array.isArray(raw.ask))
      error([...base, 'ask'], 'value', 'bad-form', 'ask phải là danh sách các lựa chọn');
    if (raw.spans !== undefined && !(Array.isArray(raw.spans) && raw.spans.length === 0))
      error(
        [...base, 'spans'],
        'value',
        'bad-form',
        'spans chỉ nhận []; đánh dấu từ vựng bằng [từ] trong say',
      );
    const asks = Array.isArray(raw.ask) ? raw.ask : [];
    const node = {
      id: nodeId,
      speakerId: text(raw.speaker, [...base, 'speaker'], 'speaker') ?? npc,
    };
    put(node, 'text', line);
    put(node, 'audio', raw.audio);
    put(node, 'translationVi', text(raw.vi, [...base, 'vi'], 'vi'));
    // An authored empty list (`spans: []`) is kept as `vocabularySpans: []`; no marks and no key means no key.
    if (spans.length) node.vocabularySpans = spans;
    else if (Array.isArray(raw.spans) && raw.spans.length === 0) node.vocabularySpans = [];
    node.terminal = asks.length === 0;
    node.choices = asks.map((choice, index) => {
      const path = [...base, 'ask', index];
      const out = {};
      if (!isObject(choice)) {
        error(path, 'value', 'bad-form', 'lựa chọn phải là bảng khóa: giá trị (id, say, to…)');
        return out;
      }
      put(out, 'id', text(need(choice, 'id', path), [...path, 'id'], 'id'));
      const say = text(need(choice, 'say', path), [...path, 'say'], 'say');
      if (say !== undefined) {
        if (UNESCAPED_BRACKET.test(say))
          error(
            [...path, 'say'],
            'value',
            'bad-form',
            'lời của lựa chọn không đánh dấu từ vựng; bỏ [ ] hoặc viết \\[ cho dấu [ thật',
          );
        put(out, 'text', say.replaceAll('\\[', '['));
      }
      put(out, 'translationVi', text(choice.vi, [...path, 'vi'], 'vi'));
      put(out, 'nextNodeId', text(need(choice, 'to', path), [...path, 'to'], 'to'));
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
  put(tree, 'entryNodeId', entry ?? nodes[0].id);
  tree.nodes = nodes;
  put(tree, 'completionFlag', done);
  put(tree, 'completionCondition', completion);
  if (notes) tree.notebookStatements = notes;
  return { tree, issues };
}
