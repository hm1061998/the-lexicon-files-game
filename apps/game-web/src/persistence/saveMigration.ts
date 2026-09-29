import type { CaseDefinition, GameState, ObjectiveStatus } from '@lexicon/shared-types';
import { loadLegacySaveContract } from '@lexicon/game-content';
import { createCaseState, reconcileDialogueProgress } from '@lexicon/game-core';
import type { SaveRecord } from './saveRepository';

type StateContract = {
  caseId: string;
  caseTitle: string;
  evidenceTotal: number;
  objectiveIds: readonly string[];
  evidenceIds: readonly string[];
  factIds: readonly string[];
  timelineEventIds?: readonly string[];
  contradictionIds?: readonly string[];
};

const PRE_PHASE_8_STATE_KEYS = [
  'caseId',
  'caseTitle',
  'evidenceTotal',
  'objectiveStatuses',
  'evidenceIds',
  'discoveredFactIds',
  'flags',
];
const CURRENT_STATE_KEYS = [...PRE_PHASE_8_STATE_KEYS, 'timelineEventIds', 'contradictionIds'];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function knownIds(value: unknown, ids: readonly string[]): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item): item is string => typeof item === 'string' && ids.includes(item)) &&
    new Set(value).size === value.length
  );
}

function validateState(
  value: unknown,
  contract: StateContract,
  expectedKeys: readonly string[],
): Record<string, unknown> {
  if (
    !isObject(value) ||
    Object.keys(value).length !== expectedKeys.length ||
    Object.keys(value).some((key) => !expectedKeys.includes(key))
  )
    throw new Error('Save GameState fields do not match case');
  if (
    value.caseId !== contract.caseId ||
    value.caseTitle !== contract.caseTitle ||
    value.evidenceTotal !== contract.evidenceTotal
  )
    throw new Error('Save GameState identity does not match case');
  if (
    !isObject(value.objectiveStatuses) ||
    !knownIds(Object.keys(value.objectiveStatuses), contract.objectiveIds) ||
    Object.keys(value.objectiveStatuses).length !== contract.objectiveIds.length ||
    !Object.values(value.objectiveStatuses).every(
      (s) => s === 'locked' || s === 'active' || s === 'completed',
    )
  )
    throw new Error('Save objectiveStatuses do not match case');
  if (
    !knownIds(value.evidenceIds, contract.evidenceIds) ||
    !knownIds(value.discoveredFactIds, contract.factIds)
  )
    throw new Error('Save evidence or fact IDs do not match case');
  if (!isObject(value.flags) || !Object.values(value.flags).every((f) => typeof f === 'boolean'))
    throw new Error('Save flag values are invalid');
  if (
    expectedKeys === CURRENT_STATE_KEYS &&
    (!knownIds(value.timelineEventIds, contract.timelineEventIds ?? []) ||
      !knownIds(value.contradictionIds, contract.contradictionIds ?? []))
  )
    throw new Error('Save timeline or contradiction IDs do not match case');
  return value;
}

function currentContract(definition: CaseDefinition): StateContract & {
  timelineEventIds: readonly string[];
  contradictionIds: readonly string[];
} {
  return {
    caseId: definition.id,
    caseTitle: definition.title,
    evidenceTotal: definition.evidenceTotal,
    objectiveIds: definition.objectives.map((o) => o.id),
    evidenceIds: definition.evidences.map((e) => e.id),
    factIds: definition.facts.map((f) => f.id),
    timelineEventIds: definition.timeline.events.map((event) => event.id),
    contradictionIds: definition.contradictions.map((item) => item.id),
  };
}

function validateRecord(raw: unknown, caseId: string, version: number): Record<string, unknown> {
  if (!isObject(raw) || raw.schemaVersion !== version)
    throw new Error(
      `Unsupported save schemaVersion: ${isObject(raw) ? String(raw.schemaVersion) : 'invalid record'}`,
    );
  if (raw.caseId !== caseId) throw new Error('Save record caseId does not match');
  if (typeof raw.updatedAt !== 'number' || !Number.isFinite(raw.updatedAt))
    throw new Error('Save record updatedAt is invalid');
  return raw;
}

function resolveSceneId(value: unknown, definition: CaseDefinition): string {
  if (typeof value !== 'string') throw new Error('Save activeSceneId is invalid');
  const scene = definition.scenes.find(({ id }) => id === value);
  if (!scene) throw new Error(`Save activeSceneId "${value}" does not match case`);
  if (!scene.spawnPoints.default) throw new Error(`Scene "${value}" has no default spawn`);
  return value;
}

export function parseCurrentSaveRecord(
  raw: unknown,
  caseId: string,
  definition: CaseDefinition,
): SaveRecord {
  const record = validateRecord(raw, caseId, 3);
  const activeSceneId = resolveSceneId(record.activeSceneId, definition);
  const state = validateState(
    record.state,
    currentContract(definition),
    CURRENT_STATE_KEYS,
  ) as unknown as GameState;
  return { schemaVersion: 3, caseId, activeSceneId, updatedAt: record.updatedAt as number, state };
}

export function migrateVersion2Save(raw: unknown, definition: CaseDefinition): SaveRecord {
  const record = validateRecord(raw, definition.id, 2);
  const contract = loadLegacySaveContract(definition.id, 2);
  if (!contract) throw new Error('No supported legacy save contract');
  const old = validateState(record.state, contract, PRE_PHASE_8_STATE_KEYS);
  const objectiveStatuses: Record<string, ObjectiveStatus> = {
    ...createCaseState(definition).objectiveStatuses,
    ...(old.objectiveStatuses as Record<string, ObjectiveStatus>),
  };
  const reconciled = reconcileDialogueProgress(definition, {
    ...(old as unknown as Omit<GameState, 'timelineEventIds' | 'contradictionIds'>),
    objectiveStatuses,
    timelineEventIds: [],
    contradictionIds: [],
  });
  if (!reconciled.ok) throw new Error(`Save migration failed: ${reconciled.error.code}`);
  return parseCurrentSaveRecord(
    {
      schemaVersion: 3,
      caseId: definition.id,
      activeSceneId: 'main_office',
      updatedAt: record.updatedAt,
      state: reconciled.state,
    },
    definition.id,
    definition,
  );
}

export function migrateVersion1Save(raw: unknown, definition: CaseDefinition): SaveRecord {
  const record = validateRecord(raw, definition.id, 1);
  const contract = loadLegacySaveContract(definition.id, 1);
  if (!contract) throw new Error('No supported legacy save contract');
  const old = validateState(record.state, contract, PRE_PHASE_8_STATE_KEYS);
  const objectiveStatuses: Record<string, ObjectiveStatus> = {
    ...createCaseState(definition).objectiveStatuses,
    ...(old.objectiveStatuses as Record<string, ObjectiveStatus>),
  };
  const reconciled = reconcileDialogueProgress(definition, {
    ...(old as unknown as Omit<GameState, 'timelineEventIds' | 'contradictionIds'>),
    objectiveStatuses,
    timelineEventIds: [],
    contradictionIds: [],
  });
  if (!reconciled.ok) throw new Error(`Save migration failed: ${reconciled.error.code}`);
  return parseCurrentSaveRecord(
    {
      schemaVersion: 3,
      caseId: definition.id,
      activeSceneId: 'main_office',
      updatedAt: record.updatedAt,
      state: reconciled.state,
    },
    definition.id,
    definition,
  );
}
