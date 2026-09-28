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
};
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
function validateState(value: unknown, contract: StateContract): GameState {
  const keys = [
    'caseId',
    'caseTitle',
    'evidenceTotal',
    'objectiveStatuses',
    'evidenceIds',
    'discoveredFactIds',
    'flags',
  ];
  if (
    !isObject(value) ||
    Object.keys(value).length !== keys.length ||
    Object.keys(value).some((key) => !keys.includes(key))
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
  return value as unknown as GameState;
}
function currentContract(definition: CaseDefinition): StateContract {
  return {
    caseId: definition.id,
    caseTitle: definition.title,
    evidenceTotal: definition.evidenceTotal,
    objectiveIds: definition.objectives.map((o) => o.id),
    evidenceIds: definition.evidences.map((e) => e.id),
    factIds: definition.facts.map((f) => f.id),
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
export function parseCurrentSaveRecord(
  raw: unknown,
  caseId: string,
  definition: CaseDefinition,
): SaveRecord {
  const record = validateRecord(raw, caseId, 2);
  return {
    schemaVersion: 2,
    caseId,
    updatedAt: record.updatedAt as number,
    state: validateState(record.state, currentContract(definition)),
  };
}
export function migrateVersion1Save(raw: unknown, definition: CaseDefinition): SaveRecord {
  const record = validateRecord(raw, definition.id, 1);
  const contract = loadLegacySaveContract(definition.id, 1);
  if (!contract) throw new Error('No supported legacy save contract');
  const old = validateState(record.state, contract);
  const objectiveStatuses: Record<string, ObjectiveStatus> = {
    ...createCaseState(definition).objectiveStatuses,
    ...old.objectiveStatuses,
  };
  const reconciled = reconcileDialogueProgress(definition, { ...old, objectiveStatuses });
  if (!reconciled.ok) throw new Error(`Save migration failed: ${reconciled.error.code}`);
  return parseCurrentSaveRecord(
    {
      schemaVersion: 2,
      caseId: definition.id,
      updatedAt: record.updatedAt,
      state: reconciled.state,
    },
    definition.id,
    definition,
  );
}
