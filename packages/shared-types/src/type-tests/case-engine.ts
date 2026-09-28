import type {
  CaseDefinition,
  CaseDomainEvent,
  CaseEngineError,
  CaseTransitionResult,
  Condition,
  Effect,
  EvidenceDefinition,
  FactDefinition,
  GameState,
  InteractionArea,
  ObjectiveDefinition,
  ObjectiveStatus,
} from '../index';

const evidenceCondition: Condition = { type: 'hasEvidence', evidenceId: 'meeting_minutes' };

const conditions = [
  evidenceCondition,
  { type: 'hasFact', factId: 'meeting_started' },
  { type: 'objectiveCompleted', objectiveId: 'find_what_happened' },
  { type: 'flag', key: 'note_read', value: true },
  { type: 'all', conditions: [{ type: 'hasEvidence', evidenceId: 'meeting_minutes' }] },
  { type: 'any', conditions: [{ type: 'hasFact', factId: 'meeting_started' }] },
] satisfies readonly Condition[];

const effects = [
  { type: 'addEvidence', evidenceId: 'meeting_minutes' },
  { type: 'unlockFact', factId: 'meeting_started' },
  { type: 'setFlag', key: 'note_read', value: true },
  { type: 'activateObjective', objectiveId: 'find_what_happened' },
  { type: 'completeObjective', objectiveId: 'find_what_happened' },
] satisfies readonly Effect[];

const evidence = {
  id: 'meeting_minutes',
  caseId: 'case-001',
  name: 'Meeting Minutes',
  category: 'document',
  description: 'A record of the meeting.',
  relatedFactIds: ['meeting_started'],
} satisfies EvidenceDefinition;

const fact = {
  id: 'meeting_started',
  text: 'The meeting started at 8:00 PM.',
  sourceEvidenceIds: ['meeting_minutes'],
  unlockCondition: evidenceCondition,
} satisfies FactDefinition;

const objective = {
  id: 'find_what_happened',
  text: 'Find out what happened to the report.',
} satisfies ObjectiveDefinition;

const definition = {
  id: 'case-001',
  title: 'The Missing Report',
  evidenceTotal: 5,
  initialObjectiveId: objective.id,
  scenes: [],
  npcs: [],
  dialogues: [],
  evidences: [evidence],
  facts: [fact],
  objectives: [objective],
} satisfies CaseDefinition;

const state = {
  caseId: definition.id,
  caseTitle: definition.title,
  evidenceTotal: definition.evidenceTotal,
  objectiveStatuses: { [objective.id]: 'active' },
  evidenceIds: [],
  discoveredFactIds: [],
  flags: {},
} satisfies GameState;

const interaction = {
  x: 0,
  y: 0,
  radius: 90,
  prompt: 'Read note',
  effects,
} satisfies InteractionArea;

const event: CaseDomainEvent = { type: 'objectiveCompleted', objectiveId: objective.id };
const error: CaseEngineError = { code: 'objectiveNotActive', id: objective.id };
const transition: CaseTransitionResult = { ok: true, state, events: [event] };
const status: ObjectiveStatus = 'active';
void [conditions, interaction, error, transition, status];

export type CaseEngineTypeFixture = {
  conditions: typeof conditions;
  effects: typeof effects;
  definition: typeof definition;
  interaction: typeof interaction;
  error: typeof error;
  transition: typeof transition;
  status: typeof status;
};
