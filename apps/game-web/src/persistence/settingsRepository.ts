import { openDB, type DBSchema } from 'idb';
import type { TranslationMode } from '@lexicon/shared-types';
import { createDefaultSettings, parseSettings, type SettingsV2 } from './settingsSchema';

interface SettingsDbSchema extends DBSchema {
  records: { key: string; value: unknown };
  backups: { key: number; value: { createdAt: number; raw: unknown } };
}
export type SettingsDatabase = {
  get(): Promise<unknown>;
  put(record: SettingsV2): Promise<void>;
  backup(raw: unknown): Promise<void>;
};
export type SettingsLoadResult =
  | { status: 'loaded' | 'missing' | 'recovered'; settings: SettingsV2; notice?: string }
  | { status: 'memory-only'; settings: SettingsV2; error: string };
export type SettingsRepository = {
  loadSettings(seed: { translationMode?: TranslationMode }): Promise<SettingsLoadResult>;
  saveSettings(settings: SettingsV2): Promise<void>;
};

async function openSettingsDb(): Promise<SettingsDatabase> {
  const db = await openDB<SettingsDbSchema>('lexicon-settings', 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains('records')) database.createObjectStore('records');
      if (!database.objectStoreNames.contains('backups'))
        database.createObjectStore('backups', { autoIncrement: true });
    },
  });
  return {
    get: () => db.get('records', 'local-settings'),
    put: async (record) => {
      await db.put('records', record, 'local-settings');
    },
    backup: async (raw) => {
      await db.add('backups', { createdAt: Date.now(), raw });
    },
  };
}

const message = (error: unknown) => (error instanceof Error ? error.message : String(error));

export function createSettingsRepository(
  factory: () => Promise<SettingsDatabase> = openSettingsDb,
): SettingsRepository {
  return {
    async loadSettings(seed) {
      const fresh = createDefaultSettings(
        seed.translationMode ? { translationMode: seed.translationMode } : {},
      );
      try {
        const db = await factory();
        const raw = await db.get();
        if (raw === undefined) {
          await db.put(fresh);
          return { status: 'missing', settings: fresh };
        }
        try {
          const settings = parseSettings(raw);
          // A v1 record is stored again as v2 so the next read is already current. Best effort:
          // a failed write must not turn valid settings into a "corrupt record" reset.
          if ((raw as { schemaVersion?: unknown }).schemaVersion !== settings.schemaVersion) {
            try {
              await db.put(settings);
            } catch {
              /* The upgrade is repeated on the next load. */
            }
          }
          return { status: 'loaded', settings };
        } catch (error) {
          await db.backup(raw);
          await db.put(fresh);
          return {
            status: 'recovered',
            settings: fresh,
            notice: `Settings were reset to defaults: ${message(error)}`,
          };
        }
      } catch (error) {
        return { status: 'memory-only', settings: fresh, error: message(error) };
      }
    },
    async saveSettings(settings) {
      await (await factory()).put(settings);
    },
  };
}
