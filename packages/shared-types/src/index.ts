export type {
  CEFRLevel, TranslationMode, VocabularyStage, VocabularyEntry,
  VocabularySpan, VocabularyContextDefinition, VocabularyProgress, LanguageProfile,
  LearningAction, LearningDomainEvent, LearningError,
} from './learning';
export type {
  SceneAssetType,
  RectCollision,
  InteractionArea,
  SceneAssetDefinition,
  SceneDefinition,
} from './scene';
export type { UiStrings } from './case';
export type {
  EvidenceCategory,
  ObjectiveDefinition,
  EvidenceDefinition,
  FactDefinition,
  Condition,
  Effect,
  CaseDefinition,
  ObjectiveStatus,
  GameState,
  CaseDomainEvent,
  CaseEngineError,
  CaseTransitionResult,
} from './case-engine';
export * from './events';

export type {
  NPCDefinition,
  DialogueChoice,
  DialogueNode,
  DialogueTree,
  DialogueSession,
  DialogueAction,
  DialogueError,
  DialogueTransitionResult,
} from './dialogue';
