import { describe, expect, it, vi } from 'vitest';
import type { GameState } from '@lexicon/shared-types';
import { loadCaseDefinition } from '@lexicon/game-content';
import { createCaseState } from '@lexicon/game-core';
import type { LoadSaveResult, SaveRepository } from '../persistence/saveRepository';
import { loadGameBootstrap } from './bootstrapGame';

function createRepository(result: LoadSaveResult): SaveRepository {
  return {
    loadSave: vi.fn(async () => result),
    saveGameState: vi.fn(async () => {}),
    createFreshSaveAfterConfirmation: vi.fn(async () => {
      throw new Error('Unexpected fresh save');
    }),
  };
}

describe('loadGameBootstrap', () => {
  it('restores a loaded state before the game is ready', async () => {
    const definition = loadCaseDefinition('case-001');
    const restored: GameState = {
      ...createCaseState(definition),
      evidenceIds: ['meeting_minutes'],
    };
    const repository = createRepository({
      status: 'loaded',
      state: restored,
      activeSceneId: 'archive',
    });

    await expect(loadGameBootstrap(definition, repository)).resolves.toEqual({
      status: 'ready',
      initialState: restored,
      activeSceneId: 'archive',
      autosaveEnabled: true,
    });
  });

  it('starts a fresh autosaved state when no save exists', async () => {
    const definition = loadCaseDefinition('case-001');
    const repository = createRepository({ status: 'missing' });

    await expect(loadGameBootstrap(definition, repository)).resolves.toEqual({
      status: 'ready',
      initialState: createCaseState(definition),
      activeSceneId: 'main_office',
      autosaveEnabled: true,
    });
  });

  it('requires confirmation for a save that cannot be recovered', async () => {
    const definition = loadCaseDefinition('case-001');
    const repository = createRepository({ status: 'confirmation-required', reason: 'bad data' });

    await expect(loadGameBootstrap(definition, repository)).resolves.toEqual({
      status: 'confirmation-required',
      reason: 'bad data',
    });
  });

  it('allows memory-only gameplay without autosave when storage is unavailable', async () => {
    const definition = loadCaseDefinition('case-001');
    const repository = createRepository({ status: 'unavailable', error: 'blocked' });

    await expect(loadGameBootstrap(definition, repository)).resolves.toEqual({
      status: 'memory-only',
      initialState: createCaseState(definition),
      activeSceneId: 'main_office',
      autosaveEnabled: false,
      error: 'blocked',
    });
  });
});
