import { describe, expect, it } from 'vitest';
import type { DialogueChoice, DialogueNode } from '@lexicon/shared-types';
import { isChoiceSeen } from './isChoiceSeen';

const choice = (effects: DialogueChoice['effects'] = undefined): DialogueChoice => ({
  id: 'c',
  text: 'Ask',
  nextNodeId: 'n2',
  effects,
});
const target = (effects: DialogueNode['effects'] = undefined): DialogueNode => ({
  id: 'n2',
  speakerId: 'anna',
  text: 'Answer',
  choices: [],
  terminal: false,
  effects,
});
const set = (key: string, value = true) => ({ type: 'setFlag' as const, key, value });

describe('isChoiceSeen', () => {
  it('is false when neither the choice nor its target set a flag', () => {
    expect(isChoiceSeen(choice(), target(), { a: true })).toBe(false);
    expect(isChoiceSeen(choice(), undefined, {})).toBe(false);
  });

  it('is true when a flag the choice sets is already true', () => {
    expect(isChoiceSeen(choice([set('asked')]), target(), { asked: true })).toBe(true);
  });

  it('counts a flag set by the target node too', () => {
    expect(isChoiceSeen(choice(), target([set('heard')]), { heard: true })).toBe(true);
  });

  it('needs every flag to be true', () => {
    const c = choice([set('a'), set('b')]);
    expect(isChoiceSeen(c, target(), { a: true })).toBe(false);
    expect(isChoiceSeen(c, target(), { a: true, b: true })).toBe(true);
    expect(isChoiceSeen(choice([set('a')]), target([set('b')]), { a: true })).toBe(false);
  });

  it('ignores flags set to false and non-flag effects', () => {
    expect(isChoiceSeen(choice([set('a', false)]), target(), { a: true })).toBe(false);
    expect(
      isChoiceSeen(choice([{ type: 'addEvidence', evidenceId: 'x' } as never]), target(), {}),
    ).toBe(false);
  });
});
