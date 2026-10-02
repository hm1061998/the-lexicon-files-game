import type { CaseDefinition } from '@lexicon/shared-types';
import { createCaseState } from '@lexicon/game-core';
import type { SaveAvailability } from '../title/titleModel';
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
      source: 'saved' | 'fresh';
      saveAvailability: SaveAvailability;
      commerceConfig: CommerceConfig;
      autosaveEnabled: true;
    }
  | {
      status: 'memory-only';
      initialState: ReturnType<typeof createCaseState>;
      activeSceneId: string;
      saveAvailability: SaveAvailability;
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
  const startScene = definition.scenes.find(({ id }) => id === definition.startSceneId);
  if (!startScene?.spawnPoints.default)
    throw new Error(`Start scene "${definition.startSceneId}" or its default spawn is missing`);

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
        source: 'saved',
        saveAvailability: 'loaded',
        commerceConfig,
        autosaveEnabled: true,
      };
    case 'missing':
      return {
        status: 'ready',
        initialState: createCaseState(definition),
        activeSceneId: startScene.id,
        source: 'fresh',
        saveAvailability: 'missing',
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
        saveAvailability: 'memory-only',
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
