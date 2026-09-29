import { describe, expect, it, vi } from 'vitest';
import type { GameState } from '@lexicon/shared-types';
import { loadCaseDefinition } from '@lexicon/game-content';
import { createCaseState } from '@lexicon/game-core';
import type { LoadSaveResult, SaveRepository } from '../persistence/saveRepository';
import type { CommerceConfigProvider } from '../commerce/commerceConfig';
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
      commerceConfig: { schemaVersion: 1, mode: 'free' },
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
      commerceConfig: { schemaVersion: 1, mode: 'free' },
      autosaveEnabled: true,
    });
  });

  it('requires confirmation for a save that cannot be recovered', async () => {
    const definition = loadCaseDefinition('case-001');
    const repository = createRepository({ status: 'confirmation-required', reason: 'bad data' });

    await expect(loadGameBootstrap(definition, repository)).resolves.toEqual({
      status: 'confirmation-required',
      reason: 'bad data',
      commerceConfig: { schemaVersion: 1, mode: 'free' },
    });
  });

  it('allows memory-only gameplay without autosave when storage is unavailable', async () => {
    const definition = loadCaseDefinition('case-001');
    const repository = createRepository({ status: 'unavailable', error: 'blocked' });

    await expect(loadGameBootstrap(definition, repository)).resolves.toEqual({
      status: 'memory-only',
      initialState: createCaseState(definition),
      activeSceneId: 'main_office',
      commerceConfig: { schemaVersion: 1, mode: 'free' },
      autosaveEnabled: false,
      error: 'blocked',
    });
  });

  it('injects commercial config while preserving the same playable case state', async () => {
    const definition = loadCaseDefinition('case-001');
    const progressed = {
      ...createCaseState(definition),
      evidenceIds: ['meeting_minutes'],
      flags: { checked_desk: true },
    };
    const loadConfig = vi.fn(async () => ({
      schemaVersion: 1 as const,
      mode: 'commercial' as const,
    }));
    const provider: CommerceConfigProvider = {
      load: loadConfig,
    };
    const repository = createRepository({
      status: 'loaded',
      state: progressed,
      activeSceneId: 'main_office',
    });
    const result = await loadGameBootstrap(definition, repository, provider);

    expect(result).toMatchObject({
      status: 'ready',
      commerceConfig: { schemaVersion: 1, mode: 'commercial' },
    });
    expect(result.status === 'ready' && result.initialState).toEqual(progressed);
    expect(loadConfig).toHaveBeenCalledTimes(1);
    if (result.status === 'ready') {
      expect(Object.keys(result.initialState)).not.toContain('commerceConfig');
      expect(result.initialState.evidenceIds).toEqual(['meeting_minutes']);
      expect(result.initialState.flags.checked_desk).toBe(true);
    }
  });

  it('falls back to free without blocking bootstrap when an injected provider fails', async () => {
    const definition = loadCaseDefinition('case-001');
    const provider: CommerceConfigProvider = {
      load: async () => {
        throw new Error('offline');
      },
    };

    await expect(
      loadGameBootstrap(definition, createRepository({ status: 'missing' }), provider),
    ).resolves.toMatchObject({
      status: 'ready',
      commerceConfig: { schemaVersion: 1, mode: 'free' },
      initialState: createCaseState(definition),
    });
  });

  it('falls back to free for an unsupported config version and still bootstraps', async () => {
    const definition = loadCaseDefinition('case-001');
    const provider = {
      load: async () => ({ schemaVersion: 2, mode: 'commercial' }),
    } as unknown as CommerceConfigProvider;

    await expect(
      loadGameBootstrap(definition, createRepository({ status: 'missing' }), provider),
    ).resolves.toMatchObject({
      status: 'ready',
      commerceConfig: { schemaVersion: 1, mode: 'free' },
    });
  });
});
