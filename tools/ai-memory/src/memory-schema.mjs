import { posix, win32 } from 'node:path';

const ALLOWED_STATUSES = [
  'not_started',
  'proposed',
  'approved',
  'in_progress',
  'blocked',
  'verified',
  'complete',
];

const REQUIRED_METADATA = [
  'schema_version',
  'updated_at',
  'phase',
  'status',
  'result_commit',
  'active_spec',
  'active_plan',
];

const REQUIRED_SECTIONS = [
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

const MAX_MEMORY_BYTES = 12 * 1024;
const MAX_NEXT_ACTIONS = 5;
const MAX_ACTIVE_DECISIONS = 10;

function normalizeSource(source) {
  return source.replace(/^\uFEFF/, '').replaceAll('\r\n', '\n');
}

function scanSectionHeadings(lines) {
  const headings = [];
  let fenceMarker;

  for (const line of lines) {
    const fenceMatch = line.match(/^\s*(```|~~~)/);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      fenceMarker = fenceMarker === marker ? undefined : (fenceMarker ?? marker);
      continue;
    }

    if (fenceMarker !== undefined) continue;

    const headingMatch = line.match(/^##\s+(.+?)\s*$/);
    if (headingMatch) headings.push(headingMatch[1]);
  }

  return headings;
}

function parseMetadata(lines) {
  const metadata = {};

  for (const line of lines) {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    if (!key) continue;

    metadata[key] = line.slice(separatorIndex + 1).trim();
  }

  return metadata;
}

function parseSections(lines) {
  const sections = new Map();
  let currentHeading;
  let currentLines = [];
  let fenceMarker;

  const flushSection = () => {
    if (currentHeading !== undefined) {
      sections.set(currentHeading, currentLines.join('\n').trim());
    }
  };

  for (const line of lines) {
    const fenceMatch = line.match(/^\s*(```|~~~)/);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      fenceMarker = fenceMarker === marker ? undefined : (fenceMarker ?? marker);
      if (currentHeading !== undefined) currentLines.push(line);
      continue;
    }

    const headingMatch = fenceMarker === undefined ? line.match(/^##\s+(.+?)\s*$/) : undefined;
    if (headingMatch) {
      flushSection();
      currentHeading = headingMatch[1];
      currentLines = [];
      continue;
    }

    if (currentHeading !== undefined) currentLines.push(line);
  }

  flushSection();
  return sections;
}

const LIST_ITEM_PATTERN = /^\s*(?:[-*+]|\d{1,9}[.)])\s+(\S.*)$/;

function listItems(section = '') {
  const items = [];
  let fenceMarker;

  for (const line of section.split('\n')) {
    const fenceMatch = line.match(/^\s*(```|~~~)/);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      fenceMarker = fenceMarker === marker ? undefined : (fenceMarker ?? marker);
      continue;
    }

    if (fenceMarker !== undefined) continue;

    const itemMatch = line.match(LIST_ITEM_PATTERN);
    if (itemMatch) items.push(itemMatch[1].trim());
  }

  return items;
}

function countListItems(section = '') {
  return listItems(section).length;
}

function firstListItem(section = '') {
  return listItems(section)[0] ?? '';
}

function isRepositoryRelativePath(path) {
  if (posix.isAbsolute(path) || win32.isAbsolute(path)) return false;

  const normalized = posix.normalize(path.replaceAll('\\', '/'));
  return normalized !== '..' && !normalized.startsWith('../');
}

export function parseMemory(source) {
  const normalized = normalizeSource(source);
  const lines = normalized.split('\n');
  const metadata = {};
  let contentStart = 0;

  if (lines[0] === '---') {
    const closingIndex = lines.indexOf('---', 1);
    if (closingIndex !== -1) {
      Object.assign(metadata, parseMetadata(lines.slice(1, closingIndex)));
      contentStart = closingIndex + 1;
    }
  }

  return {
    metadata,
    sections: parseSections(lines.slice(contentStart)),
  };
}

export function validateMemory(source, options) {
  const errors = [];
  const parsed = parseMemory(source);
  const normalized = normalizeSource(source);
  const headings = scanSectionHeadings(normalized.split('\n'));

  if (options.byteLength > MAX_MEMORY_BYTES) {
    errors.push(`MEMORY.md exceeds the 12 KB limit (${options.byteLength} bytes).`);
  }

  for (const field of REQUIRED_METADATA) {
    if (!parsed.metadata[field]) errors.push(`Missing required metadata field: ${field}.`);
  }

  if (parsed.metadata.schema_version && parsed.metadata.schema_version !== '1') {
    errors.push(`Unsupported schema_version: ${parsed.metadata.schema_version}. Expected 1.`);
  }

  if (parsed.metadata.status && !ALLOWED_STATUSES.includes(parsed.metadata.status)) {
    errors.push(
      `Invalid status: ${parsed.metadata.status}. Allowed values: ${ALLOWED_STATUSES.join(', ')}.`,
    );
  }

  for (const section of REQUIRED_SECTIONS) {
    const count = headings.filter((heading) => heading === section).length;
    if (count === 0) errors.push(`Missing required section: ${section}.`);
    if (count > 1) errors.push(`Duplicate required section: ${section}.`);
  }

  const requiredHeadingOrder = headings.filter((heading) => REQUIRED_SECTIONS.includes(heading));
  if (
    requiredHeadingOrder.length === REQUIRED_SECTIONS.length &&
    requiredHeadingOrder.some((heading, index) => heading !== REQUIRED_SECTIONS[index])
  ) {
    errors.push('Required sections are out of order.');
  }

  for (const field of ['active_spec', 'active_plan']) {
    const relativePath = parsed.metadata[field];
    if (!relativePath || relativePath === 'none') continue;

    if (!isRepositoryRelativePath(relativePath)) {
      errors.push(`${field} must be a repository-relative path: ${relativePath}.`);
      continue;
    }

    try {
      if (!options.pathExists(relativePath)) {
        errors.push(`${field} does not exist: ${relativePath}.`);
      }
    } catch (error) {
      errors.push(`${field} could not be checked (${relativePath}): ${error.message}`);
    }
  }

  if (parsed.metadata.result_commit) {
    try {
      if (!options.commitExists(parsed.metadata.result_commit)) {
        errors.push(`result_commit does not resolve: ${parsed.metadata.result_commit}.`);
      }
    } catch (error) {
      errors.push(
        `result_commit could not be checked (${parsed.metadata.result_commit}): ${error.message}`,
      );
    }
  }

  if (/\b(?:TBD|TODO|FIXME)\b|<[^>\n]+>/.test(normalized)) {
    errors.push('Unresolved placeholder found in MEMORY.md.');
  }

  const nextActionCount = countListItems(parsed.sections.get('Next Actions'));
  if (nextActionCount > MAX_NEXT_ACTIONS) {
    errors.push(`Next Actions contains ${nextActionCount} items; maximum is 5.`);
  }

  const activeDecisionCount = countListItems(parsed.sections.get('Active Decisions'));
  if (activeDecisionCount > MAX_ACTIVE_DECISIONS) {
    errors.push(`Active Decisions contains ${activeDecisionCount} items; maximum is 10.`);
  }

  return {
    valid: errors.length === 0,
    errors,
    phase: parsed.metadata.phase ?? '',
    activePlan: parsed.metadata.active_plan ?? '',
    nextAction: firstListItem(parsed.sections.get('Next Actions')),
  };
}
