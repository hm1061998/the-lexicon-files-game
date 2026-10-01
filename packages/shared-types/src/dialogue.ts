import type { CaseDomainEvent, Condition, Effect, GameState } from './case-engine';
import type { VocabularySpan } from './learning';
import type { DialogueAudio } from './audio';
export interface NPCDefinition {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly dialogueTreeId: string;
}
export interface DialogueChoice {
  readonly id: string;
  readonly text: string;
  readonly translationVi?: string | undefined;
  readonly nextNodeId: string;
  readonly condition?: Condition | undefined;
  readonly effects?: readonly Effect[] | undefined;
}
export interface DialogueNode {
  readonly id: string;
  readonly speakerId: string;
  readonly text: string;
  readonly audio?: DialogueAudio | undefined;
  readonly translationVi?: string | undefined;
  readonly vocabularySpans?: readonly VocabularySpan[] | undefined;
  readonly condition?: Condition | undefined;
  readonly effects?: readonly Effect[] | undefined;
  readonly choices: readonly DialogueChoice[];
  readonly terminal: boolean;
}
export interface NotebookStatementDefinition {
  readonly nodeId: string;
  readonly recordedCondition: Condition;
}
export interface DialogueTree {
  readonly id: string;
  readonly npcId: string;
  readonly entryNodeId: string;
  readonly nodes: readonly DialogueNode[];
  readonly completionFlag: string;
  readonly completionCondition: Condition;
  readonly notebookStatements?: readonly NotebookStatementDefinition[] | undefined;
}
export interface DialogueSession {
  readonly treeId: string;
  readonly npcId: string;
  readonly nodeId: string;
  readonly revision: number;
}
export interface DialogueAction {
  readonly nodeId: string;
  readonly revision: number;
  readonly choiceId: string;
}
export interface DialogueError {
  readonly code:
    | 'unknownNpc'
    | 'unknownTree'
    | 'unknownNode'
    | 'unknownChoice'
    | 'staleAction'
    | 'conditionNotMet'
    | 'effectFailed';
  readonly detail: string;
}
export type DialogueTransitionResult =
  | {
      readonly ok: true;
      readonly state: GameState;
      readonly session: DialogueSession;
      readonly events: readonly CaseDomainEvent[];
    }
  | {
      readonly ok: false;
      readonly state: GameState;
      readonly session: DialogueSession | null;
      readonly error: DialogueError;
    };
