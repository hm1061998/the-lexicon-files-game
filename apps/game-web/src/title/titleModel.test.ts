import { describe, expect, it } from 'vitest';
import { nextTitleStage, selectTitleActions } from './titleModel';

describe('selectTitleActions', () => {
  it('offers Continue only for a loaded save', () => {
    expect(selectTitleActions({ save: 'loaded', settingsStatus: 'loaded' })).toMatchObject({
      continue: true,
      primary: 'continue',
    });
    for (const save of ['missing', 'memory-only'] as const)
      expect(selectTitleActions({ save, settingsStatus: 'loaded' })).toMatchObject({
        continue: false,
        primary: 'newCase',
      });
  });
  it('asks for a support level only when settings were never saved', () => {
    expect(selectTitleActions({ save: 'missing', settingsStatus: 'missing' }).askSupportLevel).toBe(
      true,
    );
    for (const settingsStatus of ['loaded', 'recovered', 'memory-only'] as const)
      expect(selectTitleActions({ save: 'missing', settingsStatus }).askSupportLevel).toBe(false);
  });
});

describe('nextTitleStage', () => {
  const fresh = { hasSave: false, askSupportLevel: true };
  const returning = { hasSave: true, askSupportLevel: false };
  it('walks first-time players through the support picker', () => {
    expect(nextTitleStage('title', 'newCase', fresh)).toBe('support');
    expect(nextTitleStage('support', 'supportChosen', fresh)).toBe('playing');
  });
  it('confirms before replacing an existing save', () => {
    expect(nextTitleStage('title', 'newCase', returning)).toBe('confirm');
    expect(nextTitleStage('confirm', 'back', returning)).toBe('title');
    expect(nextTitleStage('confirm', 'confirmed', returning)).toBe('playing');
  });
  it('continues straight into the world and returns from side pages', () => {
    expect(nextTitleStage('title', 'continue', returning)).toBe('playing');
    expect(nextTitleStage('title', 'howTo', returning)).toBe('howto');
    expect(nextTitleStage('howto', 'back', returning)).toBe('title');
    expect(nextTitleStage('title', 'settings', returning)).toBe('settings');
    expect(nextTitleStage('settings', 'back', returning)).toBe('title');
  });
  it('ignores events that do not apply to a stage', () => {
    expect(nextTitleStage('support', 'back', fresh)).toBe('support');
    expect(nextTitleStage('playing', 'back', fresh)).toBe('playing');
  });
});
