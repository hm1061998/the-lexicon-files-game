import type { CaseDefinition } from '@lexicon/shared-types';
import { createCaseState } from '@lexicon/game-core';
import { DEFAULT_START } from '@lexicon/game-content';
import type { SaveRepository } from '../persistence/saveRepository';
import {
  defaultCommerceConfigProvider,
  loadCommerceConfig,
  type CommerceConfig,
  type CommerceConfigProvider,
} from '../commerce/commerceConfig';

export type GameBootstrapResult =
  | {
      status: 'ready';
      initialState: ReturnType<typeof createCaseState>;
      activeSceneId: string;
      commerceConfig: CommerceConfig;
      autosaveEnabled: true;
    }
  | {
      status: 'memory-only';
      initialState: ReturnType<typeof createCaseState>;
      activeSceneId: string;
      commerceConfig: CommerceConfig;
      autosaveEnabled: false;
      error: string;
    }
  | { status: 'confirmation-required'; reason: string; commerceConfig: CommerceConfig };

export async function loadGameBootstrap(
  definition: CaseDefinition,
  repository: SaveRepository,
  commerceConfigProvider: CommerceConfigProvider = defaultCommerceConfigProvider,
): Promise<GameBootstrapResult> {
  const startScene = definition.scenes.find(({ id }) => id === DEFAULT_START.sceneId);
  if (!startScene?.spawnPoints.default)
    throw new Error(`Default scene "${DEFAULT_START.sceneId}" or its default spawn is missing`);

  const [result, commerceConfig] = await Promise.all([
    repository.loadSave(definition.id, definition),
    loadCommerceConfig(commerceConfigProvider),
  ]);
  switch (result.status) {
    case 'loaded':
      return {
        status: 'ready',
        initialState: result.state,
        activeSceneId: result.activeSceneId,
        commerceConfig,
        autosaveEnabled: true,
      };
    case 'missing':
      return {
        status: 'ready',
        initialState: createCaseState(definition),
        activeSceneId: startScene.id,
        commerceConfig,
        autosaveEnabled: true,
      };
    case 'confirmation-required':
      return { status: 'confirmation-required', reason: result.reason, commerceConfig };
    case 'unavailable':
      return {
        status: 'memory-only',
        initialState: createCaseState(definition),
        activeSceneId: startScene.id,
        commerceConfig,
        autosaveEnabled: false,
        error: result.error,
      };
    default: {
      const exhaustive: never = result;
      return exhaustive;
    }
  }
}
