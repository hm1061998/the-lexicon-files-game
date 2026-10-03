import { LineCounter, isMap, isSeq, parseDocument } from 'yaml';

/**
 * @typedef {{ file: string; line: number; col: number; code: string; level: 'error' | 'warn';
 *   message: string; hint?: string }} Issue
 */

/**
 * Reads a dialogue YAML file and remembers where every key and value sits.
 * @param {string} source
 * @param {string} file name shown in messages
 * @returns {{ doc: unknown; at: (path: (string | number)[], part?: 'key' | 'value') => { line: number; col: number };
 *   issues: Issue[]; offsetAt: (offset: number) => { line: number; col: number } }}
 */
export function parseDialogueYaml(source, file) {
  const lines = new LineCounter();
  const document = parseDocument(source.replaceAll('\r\n', '\n'), {
    lineCounter: lines,
    prettyErrors: false,
  });
  const offsetAt = (offset) => {
    const pos = lines.linePos(Math.max(0, offset));
    return { line: pos.line, col: pos.col };
  };
  /** @type {Issue[]} */
  const issues = document.errors.map((error) => ({
    file,
    ...offsetAt(error.pos?.[0] ?? 0),
    code: error.code === 'DUPLICATE_KEY' ? 'duplicate-id' : 'yaml-syntax',
    level: 'error',
    message: error.message.split('\n')[0] ?? 'YAML sai cú pháp',
  }));

  const at = (path, part = 'value') => {
    // Walk down as far as the path exists; stop on the deepest node we can find.
    let node = document.contents;
    let range = node?.range ?? [0];
    let keyRange = null;
    for (const step of path) {
      if (isMap(node)) {
        const pair = node.items.find((p) => String(p.key?.value ?? p.key) === String(step));
        if (!pair) break;
        keyRange = pair.key?.range ?? null;
        node = pair.value;
      } else if (isSeq(node)) {
        const item = node.items[Number(step)];
        if (!item) break;
        keyRange = null;
        node = item;
      } else break;
      range = node?.range ?? keyRange ?? range;
    }
    if (part === 'key' && keyRange) return offsetAt(keyRange[0]);
    return offsetAt((node?.range ?? range ?? [0])[0]);
  };

  return {
    doc: issues.length ? null : document.toJS(),
    at,
    issues,
    offsetAt,
  };
}
