import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { dialogueTreeSchema } from './schema/dialogue';

// The dialogue YAML compiler is plain ESM in tools/; load it by URL so this file needs no type stubs.
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const toolUrl = (file: string) =>
  pathToFileURL(resolve(REPO, 'tools/case-authoring/src', file)).href;
const { compileTree } = (await import(/* @vite-ignore */ toolUrl('compileDialogue.mjs'))) as {
  compileTree: (
    source: string,
    ctx: { file: string; vocabulary: unknown[]; refs?: unknown },
  ) => { tree: unknown; issues: { level: string; code: string; message: string }[] };
};

const json = (path: string) => JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
const errors = (issues: { level: string }[]) => issues.filter((i) => i.level === 'error');

describe('dialogue YAML compiles to trees the engine schema accepts', () => {
  for (const caseId of ['case-001', 'case-002']) {
    const dir = resolve(REPO, 'packages/game-content/cases', caseId);
    const vocabulary = json(resolve(dir, 'vocabulary.json')).vocabulary as unknown[];
    const committed = (json(resolve(dir, 'dialogues.json')).dialogues ?? []) as { id: string }[];
    for (const file of readdirSync(resolve(dir, 'dialogues')).filter((f) => f.endsWith('.yaml'))) {
      it(`${caseId} ${file} passes dialogueTreeSchema and equals the committed tree`, () => {
        const source = readFileSync(resolve(dir, 'dialogues', file), 'utf8');
        const { tree, issues } = compileTree(source, { file, vocabulary });
        expect(errors(issues)).toEqual([]);
        const parsed = dialogueTreeSchema.parse(tree);
        expect(committed.find((t) => t.id === parsed.id)).toEqual(parsed);
      });
    }
  }

  it('a tree written only in YAML (the test fixture) is a valid dialogue tree', () => {
    const fixture = resolve(
      REPO,
      'tools/case-authoring/test/fixtures/root/packages/game-content/cases/mini-case',
    );
    const vocabulary = json(resolve(fixture, 'vocabulary.json')).vocabulary as unknown[];
    for (const file of readdirSync(resolve(fixture, 'dialogues'))) {
      const source = readFileSync(resolve(fixture, 'dialogues', file), 'utf8');
      const { tree, issues } = compileTree(source, { file, vocabulary });
      expect(errors(issues)).toEqual([]);
      expect(() => dialogueTreeSchema.parse(tree)).not.toThrow();
    }
  });
});
