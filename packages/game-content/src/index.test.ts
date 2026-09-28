import { describe, expect, it } from 'vitest';
import * as mod from './index';

describe('package entry', () => {
  it('loads as a module', () => {
    expect(mod).toBeTypeOf('object');
  });
});
