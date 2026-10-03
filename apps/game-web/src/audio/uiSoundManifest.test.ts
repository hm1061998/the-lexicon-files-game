import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { UI_SOUND_FILES } from './uiSoundManifest';

const publicFile = (url: string) => new URL(`../../public${url}`, import.meta.url);
const provenance = JSON.parse(readFileSync(publicFile('/audio/ui/provenance.json'), 'utf8')) as {
  sounds: Record<string, { license: string }>;
};

describe('UI sound manifest', () => {
  it('lists exactly the sounds that have provenance, all CC0', () => {
    expect(Object.keys(UI_SOUND_FILES).sort()).toEqual(Object.keys(provenance.sounds).sort());
    for (const row of Object.values(provenance.sounds)) expect(row.license).toBe('CC0-1.0');
  });

  it('points every sound at an existing .ogg under /audio/ui/', () => {
    for (const [id, url] of Object.entries(UI_SOUND_FILES)) {
      expect(url, id).toBe(`/audio/ui/${id}.ogg`);
      expect(existsSync(publicFile(url!)), id).toBe(true);
    }
  });

  it('covers every sound a button can ask for', () => {
    for (const id of [
      'press',
      'paper-open',
      'paper-close',
      'pen',
      'stamp',
      'tab',
      'device-click',
    ]) {
      expect(UI_SOUND_FILES).toHaveProperty(id);
    }
  });
});
