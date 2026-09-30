import { describe, expect, it } from 'vitest';
import { assetPathSchema } from './assetPath';

describe('assetPathSchema', () => {
  it('accepts only public asset paths without traversal segments', () => {
    expect(assetPathSchema.safeParse('/assets/evidence/meeting.png').success).toBe(true);
    expect(assetPathSchema.safeParse('/evidence/meeting.png').success).toBe(false);
    expect(assetPathSchema.safeParse('/assets/../private.png').success).toBe(false);
  });
});
