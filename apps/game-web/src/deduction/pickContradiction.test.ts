import { describe, expect, it } from 'vitest';
import { pickContradiction } from './pickContradiction';

const available = [
  { id: 'desk_vs_log', factIds: ['statement_desk', 'log_entry'] },
  { id: 'blame_vs_label', factIds: ['statement_blame', 'label_log'] },
];

describe('pickContradiction', () => {
  it('picks the contradiction whose facts are exactly the selection, in any order', () => {
    expect(pickContradiction(available, ['label_log', 'statement_blame'])?.id).toBe(
      'blame_vs_label',
    );
    expect(pickContradiction(available, ['statement_desk', 'log_entry'])?.id).toBe('desk_vs_log');
  });

  it('falls back to the first available contradiction so a wrong pair gets the mismatch feedback', () => {
    expect(pickContradiction(available, ['statement_desk', 'label_log'])?.id).toBe('desk_vs_log');
  });

  it('returns undefined when no contradiction is available', () => {
    expect(pickContradiction([], ['a', 'b'])).toBeUndefined();
  });
});
