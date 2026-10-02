#!/usr/bin/env node
// Suggest vocabularySpans (UTF-16 offsets) for a case's dialogue nodes, evidence descriptions
// and briefing lines. Prints JSON suggestions only; never edits files.
// Usage: node .claude/skills/authoring-case-content/scripts/suggest-vocab-spans.mjs <case-id> [--all]
//   default: only texts that currently have no span for a matching word; --all: every match.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const caseId = process.argv[2];
const all = process.argv.includes('--all');
if (!caseId) (console.error('usage: suggest-vocab-spans.mjs <case-id> [--all]'), process.exit(2));
let root = process.cwd();
while (!existsSync(join(root, 'packages/game-content/cases')) && root !== dirname(root)) root = dirname(root);
const dir = join(root, 'packages/game-content/cases', caseId);
const j = (f) => JSON.parse(readFileSync(join(dir, f), 'utf8'));
const vocab = j('vocabulary.json').vocabulary;
const forms = vocab.flatMap((v) => [v.lemma, ...v.surfaceForms].map((form) => ({ form, id: v.id })));
forms.sort((a, b) => b.form.length - a.form.length); // longest first, avoid overlaps
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const texts = [];
for (const t of j('dialogues.json').dialogues)
  for (const n of t.nodes) texts.push({ where: `dialogues.${t.id}.nodes.${n.id}`, text: n.text, spans: n.vocabularySpans ?? [] });
for (const e of j('evidences.json').evidences)
  texts.push({ where: `evidences.${e.id}.description`, text: e.description, spans: e.vocabularySpans ?? [] });
for (const l of j('case.json').briefing?.lines ?? [])
  texts.push({ where: `case.briefing.lines.${l.id}`, text: l.text, spans: l.vocabularySpans ?? [] });

for (const { where, text, spans } of texts) {
  const taken = spans.map((s) => [s.start, s.end]);
  const out = [];
  for (const { form, id } of forms) {
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${esc(form)}(?![\\p{L}\\p{N}])`, 'giu');
    for (const m of text.matchAll(re)) {
      const start = m.index, end = m.index + m[0].length; // JS string indices are UTF-16
      if (taken.some(([a, b]) => start < b && end > a)) continue;
      if (!all && spans.some((s) => s.vocabularyId === id)) continue;
      taken.push([start, end]);
      out.push({ start, end, vocabularyId: id, surface: m[0] });
    }
  }
  if (out.length) console.log(JSON.stringify({ where, suggest: out.sort((a, b) => a.start - b.start) }));
}
