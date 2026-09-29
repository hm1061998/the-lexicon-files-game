import type { NPCDefinition, DialogueTree } from './dialogue';
import type { SceneDefinition } from './scene';
import type { VocabularyContextDefinition, VocabularyEntry, VocabularySpan } from './learning';

export type EvidenceCategory = 'document' | 'audio' | 'photo' | 'object' | 'statement' | 'digital';

export interface ObjectiveDefinition {
  readonly id: string;
  readonly text: string;
  readonly initialStatus?: 'locked' | 'active' | undefined;
  readonly completionCondition?: Condition | undefined;
}

export interface EvidenceDefinition {
  readonly id: string;
  readonly caseId: string;
  readonly name: string;
  readonly category: EvidenceCategory;
  readonly description: string;
  readonly relatedFactIds: readonly string[];
  readonly relatedNpcIds?: readonly string[];
  readonly vocabularyIds?: readonly string[];
  readonly descriptionVi?: string | undefined;
  readonly vocabularySpans?: readonly VocabularySpan[] | undefined;
  readonly imageAsset?: string;
}

export interface FactDefinition {
  readonly id: string;
  readonly text: string;
  readonly sourceEvidenceIds: readonly string[];
  readonly sourceDialogueIds?: readonly string[] | undefined;
  readonly unlockCondition: Condition;
}

export interface ListeningOption {
  readonly id: string;
  readonly text: string;
  readonly textVi?: string;
}

export interface ListeningTaskDefinition {
  readonly id: string;
  readonly evidenceId: string;
  readonly audioAsset: string;
  readonly timestamp: string;
  readonly transcript: string;
  readonly transcriptVi?: string;
  readonly question: string;
  readonly questionVi?: string;
  readonly options: readonly ListeningOption[];
  readonly correctOptionId: string;
  readonly keywordHints: readonly string[];
  readonly completionFlag: string;
  readonly correctEffects: readonly Effect[];
}

export type Condition =
  | { readonly type: 'hasEvidence'; readonly evidenceId: string }
  | { readonly type: 'hasFact'; readonly factId: string }
  | { readonly type: 'objectiveCompleted'; readonly objectiveId: string }
  | { readonly type: 'flag'; readonly key: string; readonly value: boolean }
  | { readonly type: 'all'; readonly conditions: readonly Condition[] }
  | { readonly type: 'any'; readonly conditions: readonly Condition[] };

export type Effect =
  | { readonly type: 'addEvidence'; readonly evidenceId: string }
  | { readonly type: 'unlockFact'; readonly factId: string }
  | { readonly type: 'setFlag'; readonly key: string; readonly value: boolean }
  | { readonly type: 'activateObjective'; readonly objectiveId: string }
  | { readonly type: 'completeObjective'; readonly objectiveId: string };

export interface CaseDefinition {
  readonly id: string;
  readonly title: string;
  readonly evidenceTotal: number;
  readonly initialObjectiveId: string;
  readonly scenes: readonly SceneDefinition[];
  readonly npcs: readonly NPCDefinition[];
  readonly dialogues: readonly DialogueTree[];
  readonly evidences: readonly EvidenceDefinition[];
  readonly facts: readonly FactDefinition[];
  readonly objectives: readonly ObjectiveDefinition[];
  readonly vocabulary: readonly VocabularyEntry[];
  readonly vocabularyContexts: readonly VocabularyContextDefinition[];
  readonly listeningTasks: readonly ListeningTaskDefinition[];
}

export type ObjectiveStatus = 'locked' | 'active' | 'completed';

export interface GameState {
  readonly caseId: string;
  readonly caseTitle: string;
  readonly evidenceTotal: number;
  readonly objectiveStatuses: Readonly<Record<string, ObjectiveStatus>>;
  readonly evidenceIds: readonly string[];
  readonly discoveredFactIds: readonly string[];
  readonly flags: Readonly<Record<string, boolean>>;
}

export type CaseDomainEvent =
  | { readonly type: 'evidenceAdded'; readonly evidenceId: string }
  | { readonly type: 'factUnlocked'; readonly factId: string }
  | { readonly type: 'objectiveActivated'; readonly objectiveId: string }
  | { readonly type: 'objectiveCompleted'; readonly objectiveId: string }
  | { readonly type: 'flagChanged'; readonly key: string; readonly value: boolean };

export type CaseEngineError =
  | { readonly code: 'unknownEvidence'; readonly id: string }
  | { readonly code: 'unknownFact'; readonly id: string }
  | { readonly code: 'unknownObjective'; readonly id: string }
  | { readonly code: 'objectiveNotActive'; readonly id: string }
  | { readonly code: 'objectiveAlreadyCompleted'; readonly id: string };

export type CaseTransitionResult =
  | {
      readonly ok: true;
      readonly state: GameState;
      readonly events: readonly CaseDomainEvent[];
    }
  | {
      readonly ok: false;
      readonly state: GameState;
      readonly error: CaseEngineError;
    };
