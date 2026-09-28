import type { CaseDefinition } from '@lexicon/shared-types';
import { createCaseState } from '@lexicon/game-core';
import type { SaveRepository } from '../persistence/saveRepository';

export type GameBootstrapResult =
  | { status: 'ready'; initialState: ReturnType<typeof createCaseState>; autosaveEnabled: true }
  | {
      status: 'memory-only';
      initialState: ReturnType<typeof createCaseState>;
      autosaveEnabled: false;
      error: string;
    }
  | { status: 'confirmation-required'; reason: string };

export async function loadGameBootstrap(
  definition: CaseDefinition,
  repository: SaveRepository,
): Promise<GameBootstrapResult> {
  const result = await repository.loadSave(definition.id, definition);
  switch (result.status) {
    case 'loaded':
      return { status: 'ready', initialState: result.state, autosaveEnabled: true };
    case 'missing':
      return { status: 'ready', initialState: createCaseState(definition), autosaveEnabled: true };
    case 'confirmation-required':
      return { status: 'confirmation-required', reason: result.reason };
    case 'unavailable':
      return {
        status: 'memory-only',
        initialState: createCaseState(definition),
        autosaveEnabled: false,
        error: result.error,
      };
    default: {
      const exhaustive: never = result;
      return exhaustive;
    }
  }
}
