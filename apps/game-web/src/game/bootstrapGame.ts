import type { CaseDefinition } from '@lexicon/shared-types';
import { createCaseState } from '@lexicon/game-core';
import { DEFAULT_START } from '@lexicon/game-content';
import type { SaveRepository } from '../persistence/saveRepository';

export type GameBootstrapResult =
  | {
      status: 'ready';
      initialState: ReturnType<typeof createCaseState>;
      activeSceneId: string;
      autosaveEnabled: true;
    }
  | {
      status: 'memory-only';
      initialState: ReturnType<typeof createCaseState>;
      activeSceneId: string;
      autosaveEnabled: false;
      error: string;
    }
  | { status: 'confirmation-required'; reason: string };

export async function loadGameBootstrap(
  definition: CaseDefinition,
  repository: SaveRepository,
): Promise<GameBootstrapResult> {
  const startScene = definition.scenes.find(({ id }) => id === DEFAULT_START.sceneId);
  if (!startScene?.spawnPoints.default)
    throw new Error(`Default scene "${DEFAULT_START.sceneId}" or its default spawn is missing`);

  const result = await repository.loadSave(definition.id, definition);
  switch (result.status) {
    case 'loaded':
      return {
        status: 'ready',
        initialState: result.state,
        activeSceneId: result.activeSceneId,
        autosaveEnabled: true,
      };
    case 'missing':
      return {
        status: 'ready',
        initialState: createCaseState(definition),
        activeSceneId: startScene.id,
        autosaveEnabled: true,
      };
    case 'confirmation-required':
      return { status: 'confirmation-required', reason: result.reason };
    case 'unavailable':
      return {
        status: 'memory-only',
        initialState: createCaseState(definition),
        activeSceneId: startScene.id,
        autosaveEnabled: false,
        error: result.error,
      };
    default: {
      const exhaustive: never = result;
      return exhaustive;
    }
  }
}
