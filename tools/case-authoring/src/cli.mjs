import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { isDeepStrictEqual } from 'node:util';
import { pathToFileURL } from 'node:url';

import { collectFlags, scanJsonFlags } from './checkDialogue.mjs';
import { compileTree } from './compileDialogue.mjs';
import { decompileTree } from './decompileDialogue.mjs';
import { formatJson, formatYaml, loadCase, normalizeEol, writeAtomic } from './io.mjs';
import { parseDialogueYaml } from './parseDialogueYaml.mjs';

const USAGE = [
  'Cách dùng:',
  '  npm run case:build -- <case-id> [--check]   biên dịch dialogues/*.yaml -> dialogues.json',
  '  npm run case:import -- <case-id> [--force]  chuyển dialogues.json cũ sang YAML',
].join('\n');

/** A case id or tree id is one plain name: it can never point outside the cases folder. */
const PLAIN_NAME = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

/** Flags the game engine itself sets, which no JSON of the case mentions. */
const ENGINE_FLAG_SETS = ['david_contradiction_found'];

const NEXT = 'Tiếp theo: npm run test -w @lexicon/game-content';

/** `file:line:col  code  message` plus an indented hint, as in the spec. */
function formatIssue(issue) {
  const where = issue.line > 0 ? `${issue.file}:${issue.line}:${issue.col}` : issue.file;
  const prefix = issue.level === 'warn' ? 'warn  ' : '';
  const lines = [`${prefix}${where}  ${issue.code}  ${issue.message}`];
  if (issue.hint) lines.push(`    ${issue.hint}`);
  return lines.join('\n');
}

function jsonFilesOf(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    const path = resolve(dir, name);
    if (statSync(path).isDirectory()) {
      if (name !== 'dialogues') files.push(...jsonFilesOf(path));
    } else if (name.endsWith('.json') && name !== 'dialogues.json') files.push(path);
  }
  return files;
}

/** Flags the rest of the case (objectives, scenes, facts…) sets and reads. */
function caseFlags(dir) {
  const sets = new Set(ENGINE_FLAG_SETS);
  const reads = new Set();
  for (const file of jsonFilesOf(dir)) {
    const found = scanJsonFlags(JSON.parse(normalizeEol(readFileSync(file, 'utf8'))));
    found.sets.forEach((flag) => sets.add(flag));
    found.reads.forEach((flag) => reads.add(flag));
  }
  return { sets, reads };
}

/** First place two dialogue sets differ, in the words of the author: tree, node, field. */
function firstDrift(expected, actual) {
  for (const tree of expected.dialogues) {
    const other = actual?.dialogues?.find((t) => t.id === tree.id);
    if (!other) return `cây "${tree.id}" không có trong dialogues.json`;
    for (const key of Object.keys(tree).filter((k) => k !== 'nodes'))
      if (!isDeepStrictEqual(tree[key], other[key])) return `cây "${tree.id}", trường ${key}`;
    for (const node of tree.nodes) {
      const twin = other.nodes?.find((n) => n.id === node.id);
      if (!twin) return `cây "${tree.id}", node "${node.id}" không có trong dialogues.json`;
      for (const key of new Set([...Object.keys(node), ...Object.keys(twin)]))
        if (!isDeepStrictEqual(node[key], twin[key]))
          return `cây "${tree.id}", node "${node.id}", trường ${key}`;
    }
    if (other.nodes.length !== tree.nodes.length)
      return `cây "${tree.id}" có thừa node trong dialogues.json`;
  }
  if (actual?.dialogues?.length !== expected.dialogues.length) return 'số cây khác nhau';
  return null;
}

/** Compiles every tree of a case. */
function compileCase(root, caseId, out) {
  const loaded = loadCase(root, caseId);
  const flags = caseFlags(loaded.dir);
  const sources = loaded.npcs.map((npc) => {
    const file = `dialogues/${PLAIN_NAME.test(npc.dialogueTreeId) ? npc.dialogueTreeId : '(tên không hợp lệ)'}.yaml`;
    const path = resolve(loaded.dir, file);
    return {
      id: npc.dialogueTreeId,
      npcId: npc.id,
      file,
      path,
      source:
        PLAIN_NAME.test(npc.dialogueTreeId) && existsSync(path) ? readFileSync(path, 'utf8') : null,
    };
  });
  const own = new Map(
    sources
      .filter((s) => s.source !== null)
      .map((s) => [s.id, collectFlags(parseDialogueYaml(s.source, s.file).doc)]),
  );
  const issues = [];
  const trees = [];
  // A YAML file no npc points at would be ignored for ever: name it.
  const dialoguesDir = resolve(loaded.dir, 'dialogues');
  if (existsSync(dialoguesDir)) {
    const used = new Set(sources.map((s) => `${s.id}.yaml`));
    for (const name of readdirSync(dialoguesDir).filter((n) => n.endsWith('.yaml'))) {
      if (!used.has(name))
        issues.push({
          file: `dialogues/${name}`,
          line: 0,
          col: 0,
          code: 'unused-tree',
          level: 'error',
          message: `không NPC nào trong npcs.json có dialogueTreeId "${name.replace(/\.yaml$/, '')}"`,
          hint: 'thêm dialogueTreeId vào npcs.json hoặc xóa file',
        });
    }
  }
  for (const entry of sources) {
    if (entry.source === null) {
      issues.push({
        file: entry.file,
        line: 0,
        col: 0,
        code: 'missing-tree',
        level: 'error',
        message: `thiếu file ${entry.file} cho NPC có dialogueTreeId "${entry.id}"`,
      });
      out(`${caseId}  ${entry.file}  → lỗi`);
      continue;
    }
    const externalSets = new Set(flags.sets);
    const externalReads = new Set(flags.reads);
    for (const [id, found] of own) {
      if (id === entry.id) continue;
      found.sets.forEach((flag) => externalSets.add(flag));
      found.reads.forEach((flag) => externalReads.add(flag));
    }
    const result = compileTree(entry.source, {
      file: entry.file,
      vocabulary: loaded.vocabulary,
      refs: loaded.refs,
      externalSets,
      externalReads,
      expect: { treeId: entry.id, npcId: entry.npcId },
    });
    issues.push(...result.issues);
    if (result.tree) {
      trees.push(result.tree);
      out(`${caseId}  ${entry.file}  ${result.tree.nodes.length} node  → ok`);
    } else out(`${caseId}  ${entry.file}  → lỗi`);
  }
  return { loaded, issues, trees };
}

async function build(root, caseId, flags, io) {
  const { loaded, issues, trees } = compileCase(root, caseId, io.out);
  for (const issue of issues) io.out(formatIssue(issue));
  const errors = issues.filter((i) => i.level === 'error');
  if (errors.length) {
    io.err(`${errors.length} lỗi... build bị hủy, dialogues.json không đổi`);
    return 1;
  }
  const target = resolve(loaded.dir, 'dialogues.json');
  const text = await formatJson({ dialogues: trees }, target);
  if (flags.check) {
    const existing = existsSync(target) ? normalizeEol(readFileSync(target, 'utf8')) : null;
    if (existing === text) {
      io.out(`ok  ${caseId}/dialogues.json khớp YAML`);
      return 0;
    }
    let reason = 'chỉ khác định dạng hoặc thứ tự khóa';
    if (existing === null) reason = 'chưa có dialogues.json';
    else {
      try {
        reason = firstDrift({ dialogues: trees }, JSON.parse(existing)) ?? reason;
      } catch {
        reason = 'dialogues.json không phải JSON hợp lệ';
      }
    }
    io.err(
      `FAIL  ${caseId}/dialogues.json khác bản sinh từ YAML (${reason})\n      sửa YAML rồi chạy lại: npm run case:build -- ${caseId}`,
    );
    return 1;
  }
  await writeAtomic(target, text);
  const nodeCount = trees.reduce((sum, t) => sum + t.nodes.length, 0);
  io.out(`wrote ${target} (${trees.length} cây, ${nodeCount} node)`);
  io.out(NEXT);
  return 0;
}

async function importCase(root, caseId, flags, io) {
  const loaded = loadCase(root, caseId);
  const source = JSON.parse(
    normalizeEol(readFileSync(resolve(loaded.dir, 'dialogues.json'), 'utf8')),
  );
  const outputs = [];
  let failed = false;
  for (const tree of source.dialogues) {
    if (!PLAIN_NAME.test(String(tree.id))) {
      io.err(`cây "${tree.id}": id phải là một tên đơn giản (chữ, số, _ hoặc -) để làm tên file`);
      failed = true;
      continue;
    }
    const file = `dialogues/${tree.id}.yaml`;
    const path = resolve(loaded.dir, file);
    if (existsSync(path) && !flags.force) {
      io.err(`${file} đã có; thêm --force để ghi đè`);
      failed = true;
      continue;
    }
    const { yaml, issues } = decompileTree(tree, loaded.vocabulary);
    for (const issue of issues) io.err(formatIssue(issue));
    if (yaml === null) failed = true;
    else outputs.push({ file, path, yaml: await formatYaml(yaml, path) });
  }
  if (failed) return 1;
  mkdirSync(resolve(loaded.dir, 'dialogues'), { recursive: true });
  // Remember what was there, so a failed check can put the folder back as it was.
  const previous = new Map(
    outputs.map((item) => [
      item.path,
      existsSync(item.path) ? readFileSync(item.path, 'utf8') : null,
    ]),
  );
  const restore = () => {
    for (const [path, before] of previous) {
      if (before === null) {
        if (existsSync(path)) unlinkSync(path);
      } else writeFileSync(path, before, 'utf8');
    }
  };
  for (const item of outputs) {
    await writeAtomic(item.path, item.yaml);
    io.out(`wrote ${item.file}`);
  }
  // The YAML just written must say exactly what the JSON says (key order and formatting aside).
  const { issues, trees } = compileCase(root, caseId, () => undefined);
  const errors = issues.filter((i) => i.level === 'error');
  errors.forEach((issue) => io.err(formatIssue(issue)));
  const drift = errors.length ? 'còn lỗi' : firstDrift({ dialogues: trees }, source);
  if (drift) {
    restore();
    io.err(`verify: KHÔNG khớp (${drift}); các file YAML vừa ghi đã được hoàn lại`);
    return 1;
  }
  io.out(`verify: case:build tái tạo đúng dialogues.json (${source.dialogues.length} cây) → ok`);
  return 0;
}

/**
 * @param {string[]} argv
 * @param {{ cwd?: string; out?: (s: string) => void; err?: (s: string) => void }} [env]
 * @returns {Promise<number>} exit code
 */
export async function run(argv, env = {}) {
  const out = env.out ?? ((s) => process.stdout.write(`${s}\n`));
  const err = env.err ?? ((s) => process.stderr.write(`${s}\n`));
  if (argv.includes('--help') || argv.includes('-h')) {
    out(USAGE);
    return 0;
  }
  const command = argv[0];
  if (command !== 'build' && command !== 'import') {
    err(`Lệnh không hợp lệ: ${command ?? '(trống)'}\n${USAGE}`);
    return 1;
  }
  const rest = argv.slice(1);
  const allowed = command === 'build' ? ['--check'] : ['--force'];
  const unknown = rest.filter((a) => a.startsWith('--') && !allowed.includes(a));
  if (unknown.length) {
    err(
      `Cờ không hợp lệ cho ${command}: ${unknown.join(', ')} (dùng: ${allowed.join(', ')})\n${USAGE}`,
    );
    return 1;
  }
  const names = rest.filter((a) => !a.startsWith('--'));
  const caseId = names[0];
  if (!caseId) {
    err(`Thiếu <case-id>.\n${USAGE}`);
    return 1;
  }
  if (names.length > 1 || !PLAIN_NAME.test(caseId)) {
    err(`<case-id> phải là một tên đơn giản như case-001 (nhận: ${names.join(' ')})`);
    return 1;
  }
  const root = env.cwd ?? process.cwd();
  const casesDir = resolve(root, 'packages', 'game-content', 'cases', caseId);
  if (!existsSync(casesDir)) {
    err(`Không có case "${caseId}" (${casesDir})`);
    return 1;
  }
  const flags = { check: rest.includes('--check'), force: rest.includes('--force') };
  const io = { out, err };
  return command === 'build' ? build(root, caseId, flags, io) : importCase(root, caseId, flags, io);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = await run(process.argv.slice(2));
}
