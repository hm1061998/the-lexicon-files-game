import { readFileSync } from 'node:fs';
import { rename, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { format, resolveConfig } from 'prettier';

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

/** `\r\n` -> `\n`, so a file checked out with CRLF compares equal to one written with LF. */
export const normalizeEol = (text) =>
  (text.charCodeAt(0) === 0xfeff ? text.slice(1) : text).replaceAll('\r\n', '\n');

/**
 * Prettier-formatted JSON text for `filePath` (the repo prettier config decides the style).
 * @param {unknown} value
 * @param {string} filePath
 */
export async function formatJson(value, filePath) {
  const config = (await resolveConfig(filePath)) ?? {};
  const text = await format(JSON.stringify(value, null, 2), {
    ...config,
    filepath: filePath,
    endOfLine: 'lf',
  });
  return text.endsWith('\n') ? text : `${text}\n`;
}

/** Prettier formatted YAML text for `filePath`, so imported files already pass `format:check`. */
export async function formatYaml(text, filePath) {
  const config = (await resolveConfig(filePath)) ?? {};
  return format(text, { ...config, filepath: filePath, endOfLine: 'lf' });
}

/** Writes beside the target and renames over it, so a failure never leaves a half written file. */
export async function writeAtomic(path, content) {
  const temporary = `${path}.tmp`;
  await writeFile(temporary, content, 'utf8');
  await rename(temporary, path);
}

/**
 * @param {string} root repository root
 * @param {string} caseId
 */
export function loadCase(root, caseId) {
  const dir = resolve(root, 'packages', 'game-content', 'cases', caseId);
  const npcs = readJson(resolve(dir, 'npcs.json')).npcs;
  const vocabulary = readJson(resolve(dir, 'vocabulary.json')).vocabulary;
  let refs = null;
  try {
    const ids = (file, key) => new Set(readJson(resolve(dir, file))[key].map((item) => item.id));
    refs = {
      evidence: ids('evidences.json', 'evidences'),
      fact: ids('facts.json', 'facts'),
      objective: ids('objectives.json', 'objectives'),
    };
  } catch {
    refs = null;
  }
  return { dir, npcs, vocabulary, refs };
}
