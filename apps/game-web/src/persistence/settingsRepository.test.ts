import { describe, expect, it } from 'vitest';
import { createSettingsRepository, type SettingsDatabase } from './settingsRepository';
import { createDefaultSettings } from './settingsSchema';

function memory(raw?: unknown, failBackup = false) {
  let saved = raw;
  const backups: unknown[] = [];
  const db: SettingsDatabase = {
    async get() {
      return saved;
    },
    async put(record) {
      saved = record;
    },
    async backup(value) {
      if (failBackup) throw new Error('backup failed');
      backups.push(value);
    },
  };
  return { db, backups, value: () => saved };
}

describe('settings repository', () => {
  it('writes defaults seeded with translationMode when missing', async () => {
    const store = memory();
    const repo = createSettingsRepository(async () => store.db);
    const result = await repo.loadSettings({ translationMode: 'Beginner' });
    expect(result.status).toBe('missing');
    expect(result.settings.translationMode).toBe('Beginner');
    expect(store.value()).toEqual(result.settings);
  });

  it('returns a valid record unchanged', async () => {
    const saved = { ...createDefaultSettings({ prefersReducedMotion: false }), volume: 10 };
    const repo = createSettingsRepository(async () => memory(saved).db);
    expect(await repo.loadSettings({})).toEqual({ status: 'loaded', settings: saved });
  });

  it('writes the upgraded v2 record back after reading v1', async () => {
    const v1 = {
      schemaVersion: 1,
      translationMode: 'Immersion',
      volume: 20,
      subtitles: 'off',
      reducedMotion: false,
    };
    const store = memory(v1);
    const repo = createSettingsRepository(async () => store.db);
    const result = await repo.loadSettings({});
    expect(result.status).toBe('loaded');
    expect(result.settings).toMatchObject({ schemaVersion: 2, volume: 20, textSpeed: 'normal' });
    expect(store.value()).toEqual(result.settings);
  });

  it('keeps valid v1 settings when only the write-back of the upgrade fails', async () => {
    const v1 = {
      schemaVersion: 1,
      translationMode: 'Beginner',
      volume: 55,
      subtitles: 'on',
      reducedMotion: true,
    };
    const store = memory(v1);
    const failing: SettingsDatabase = {
      ...store.db,
      async put() {
        throw new Error('disk full');
      },
    };
    const repo = createSettingsRepository(async () => failing);
    const result = await repo.loadSettings({});
    expect(result.status).toBe('loaded');
    expect(result.settings).toMatchObject({
      translationMode: 'Beginner',
      volume: 55,
      schemaVersion: 2,
    });
    expect(store.backups).toHaveLength(0);
  });

  it('backs up a corrupt record before writing defaults', async () => {
    const raw = { schemaVersion: 9 };
    const store = memory(raw);
    const repo = createSettingsRepository(async () => store.db);
    const result = await repo.loadSettings({});
    expect(result.status).toBe('recovered');
    expect(result).toHaveProperty('notice');
    expect(store.backups).toEqual([raw]);
    expect(store.value()).toEqual(result.settings);
  });

  it('falls back to memory when the factory rejects', async () => {
    const repo = createSettingsRepository(async () => {
      throw new Error('blocked');
    });
    expect(await repo.loadSettings({})).toMatchObject({ status: 'memory-only', error: 'blocked' });
  });

  it('does not overwrite when backup fails', async () => {
    const raw = { schemaVersion: 9 };
    const store = memory(raw, true);
    const repo = createSettingsRepository(async () => store.db);
    expect(await repo.loadSettings({})).toMatchObject({ status: 'memory-only' });
    expect(store.value()).toBe(raw);
  });

  it('round-trips saveSettings', async () => {
    const store = memory();
    const repo = createSettingsRepository(async () => store.db);
    const next = { ...createDefaultSettings({ prefersReducedMotion: true }), volume: 5 };
    await repo.saveSettings(next);
    expect(await repo.loadSettings({})).toEqual({ status: 'loaded', settings: next });
  });
});
