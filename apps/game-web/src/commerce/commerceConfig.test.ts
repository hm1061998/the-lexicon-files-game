import { describe, expect, it, vi } from 'vitest';
import {
  createDefaultCommerceConfigProvider,
  loadCommerceConfig,
  type CommerceConfigProvider,
} from './commerceConfig';

describe('commerce config boundary', () => {
  it('defaults to the versioned free configuration', async () => {
    const provider = createDefaultCommerceConfigProvider();

    await expect(provider.load()).resolves.toEqual({ schemaVersion: 1, mode: 'free' });
    await expect(loadCommerceConfig()).resolves.toEqual({ schemaVersion: 1, mode: 'free' });
  });

  it('accepts an injected commercial configuration without other policy', async () => {
    const provider: CommerceConfigProvider = {
      load: vi.fn(async () => ({ schemaVersion: 1, mode: 'commercial' })),
    };

    await expect(loadCommerceConfig(provider)).resolves.toEqual({
      schemaVersion: 1,
      mode: 'commercial',
    });
  });

  it.each([
    ['unknown mode', { schemaVersion: 1, mode: 'trial' }],
    ['unknown version', { schemaVersion: 2, mode: 'commercial' }],
    ['malformed value', null],
  ])('falls back to free for %s', async (_label, value) => {
    const provider = { load: async () => value } as unknown as CommerceConfigProvider;

    await expect(loadCommerceConfig(provider)).resolves.toEqual({
      schemaVersion: 1,
      mode: 'free',
    });
  });

  it('falls back to free when the provider rejects', async () => {
    const provider: CommerceConfigProvider = {
      load: async () => {
        throw new Error('configuration unavailable');
      },
    };

    await expect(loadCommerceConfig(provider)).resolves.toEqual({
      schemaVersion: 1,
      mode: 'free',
    });
  });
});
