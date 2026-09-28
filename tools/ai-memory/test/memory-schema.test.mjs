import { Buffer } from 'node:buffer';
import assert from 'node:assert/strict';
import test from 'node:test';

import { parseMemory, validateMemory } from '../src/memory-schema.mjs';

const SECTION_NAMES = [
  'Metadata',
  'Current Phase',
  'Active Goal',
  'Current Status',
  'Completed',
  'In Progress',
  'Active Decisions',
  'Blockers',
  'Next Actions',
  'Verification',
  'Latest Handoff',
  'Required Reading',
];

function createMemory({ lineEnding = '\n', prefix = '', fencedHeading = '' } = {}) {
  const sections = SECTION_NAMES.map((name) => `## ${name}\n\n- ${name} value`).join('\n\n');
  const source = `---
schema_version: 1
updated_at: 2026-09-28T10:30:00+07:00
phase: phase-0a
status: in_progress
result_commit: b4ce5d5
active_spec: none
active_plan: none
---

${fencedHeading}${sections}
`;

  return prefix + source.replaceAll('\n', lineEnding);
}

function validate(source, overrides = {}) {
  return validateMemory(source, {
    byteLength: Buffer.byteLength(source, 'utf8'),
    pathExists: () => true,
    commitExists: () => true,
    ...overrides,
  });
}

test('parses valid LF memory and exposes summary fields', () => {
  const result = parseMemory(createMemory());

  assert.equal(result.metadata.phase, 'phase-0a');
  assert.equal(result.metadata.updated_at, '2026-09-28T10:30:00+07:00');
  assert.equal(result.sections.size, 12);
  assert.equal(result.sections.get('Next Actions'), '- Next Actions value');
});

test('parses UTF-8 BOM and CRLF without changing metadata', () => {
  const result = parseMemory(createMemory({ lineEnding: '\r\n', prefix: '\uFEFF' }));

  assert.equal(result.metadata.updated_at, '2026-09-28T10:30:00+07:00');
  assert.equal(result.sections.size, 12);
});

test('preserves metadata values containing colons', () => {
  const result = parseMemory(createMemory());

  assert.equal(result.metadata.updated_at, '2026-09-28T10:30:00+07:00');
});

test('ignores headings inside fenced code blocks', () => {
  const result = parseMemory(
    createMemory({ fencedHeading: '```markdown\n## Not A Section\n```\n\n' }),
  );

  assert.equal(result.sections.has('Not A Section'), false);
  assert.equal(result.sections.size, 12);
});

test('accepts valid memory and returns handoff summary fields', () => {
  const result = validate(createMemory());

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
  assert.equal(result.phase, 'phase-0a');
  assert.equal(result.activePlan, 'none');
  assert.equal(result.nextAction, 'Next Actions value');
});

test('rejects memory larger than 12 KB', () => {
  const result = validate(createMemory(), { byteLength: 12_289 });

  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /12 KB/);
});

test('rejects missing metadata fields', () => {
  const source = createMemory().replace('status: in_progress\n', '');
  const result = validate(source);

  assert.match(result.errors.join('\n'), /status/);
});

test('rejects invalid status and lists allowed values', () => {
  const source = createMemory().replace('status: in_progress', 'status: forgotten');
  const result = validate(source);

  assert.match(result.errors.join('\n'), /not_started/);
  assert.match(result.errors.join('\n'), /complete/);
});

test('rejects missing, duplicate, and out-of-order required sections', () => {
  const missing = createMemory().replace('## Metadata\n\n- Metadata value\n\n', '');
  const duplicate = `${createMemory()}\n## Metadata\n\n- duplicate\n`;
  const outOfOrder = createMemory()
    .replace('## Current Phase', '## TEMP')
    .replace('## Active Goal', '## Current Phase')
    .replace('## TEMP', '## Active Goal');

  assert.match(validate(missing).errors.join('\n'), /Metadata/);
  assert.match(validate(duplicate).errors.join('\n'), /duplicate.*Metadata/i);
  assert.match(validate(outOfOrder).errors.join('\n'), /order/i);
});

test('skips path checks for literal none', () => {
  let calls = 0;
  const result = validate(createMemory(), {
    pathExists: () => {
      calls += 1;
      return false;
    },
  });

  assert.equal(result.valid, true);
  assert.equal(calls, 0);
});

test('rejects linked spec or plan that does not exist', () => {
  const source = createMemory().replace('active_spec: none', 'active_spec: docs/missing.md');
  const result = validate(source, { pathExists: () => false });

  assert.match(result.errors.join('\n'), /active_spec.*docs\/missing\.md/);
});

test('rejects an unresolved result commit', () => {
  const result = validate(createMemory(), { commitExists: () => false });

  assert.match(result.errors.join('\n'), /result_commit/);
});

for (const placeholder of ['TBD', 'TODO', 'FIXME', '<commit-sha>']) {
  test(`rejects unresolved placeholder ${placeholder}`, () => {
    const source = createMemory().replace('- Latest Handoff value', `- ${placeholder}`);
    const result = validate(source);

    assert.match(result.errors.join('\n'), /placeholder/i);
  });
}

test('rejects more than five next actions', () => {
  const items = Array.from({ length: 6 }, (_, index) => `- Action ${index + 1}`).join('\n');
  const source = createMemory().replace('- Next Actions value', items);
  const result = validate(source);

  assert.match(result.errors.join('\n'), /Next Actions.*5/);
});

test('rejects mixed ordered and unordered next actions over the limit', () => {
  const items = [
    '1. First action',
    '2) Second action',
    '- Third action',
    '* Fourth action',
    '+ Fifth action',
    '6. Sixth action',
  ].join('\n');
  const source = createMemory().replace('- Next Actions value', items);
  const result = validate(source);

  assert.match(result.errors.join('\n'), /Next Actions.*5/);
  assert.equal(result.nextAction, 'First action');
});

test('ignores list-shaped lines inside fenced blocks when enforcing budgets', () => {
  const items = [
    '- Real action',
    '```text',
    '1. Example one',
    '2. Example two',
    '3. Example three',
    '4. Example four',
    '5. Example five',
    '```',
  ].join('\n');
  const source = createMemory().replace('- Next Actions value', items);
  const result = validate(source);

  assert.equal(result.valid, true);
  assert.equal(result.nextAction, 'Real action');
});

test('rejects more than ten active decisions', () => {
  const items = Array.from({ length: 11 }, (_, index) => `- Decision ${index + 1}`).join('\n');
  const source = createMemory().replace('- Active Decisions value', items);
  const result = validate(source);

  assert.match(result.errors.join('\n'), /Active Decisions.*10/);
});

for (const linkedPath of [
  '/tmp/plan.md',
  'C:\\outside\\plan.md',
  '..\\outside\\plan.md',
  '../outside/plan.md',
]) {
  test(`rejects non-repository-relative linked path ${linkedPath}`, () => {
    const source = createMemory().replace('active_plan: none', `active_plan: ${linkedPath}`);
    const result = validate(source, { pathExists: () => true });

    assert.match(result.errors.join('\n'), /active_plan.*repository-relative/i);
  });
}

test('does not accept a required heading found only inside a fence', () => {
  const source = createMemory()
    .replace('## Metadata\n\n- Metadata value\n\n', '')
    .replace('## Current Phase', '```markdown\n## Metadata\n```\n\n## Current Phase');
  const result = validate(source);

  assert.match(result.errors.join('\n'), /Metadata/);
});
