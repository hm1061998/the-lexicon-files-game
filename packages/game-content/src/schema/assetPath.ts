import { z } from 'zod';

/** Public image and texture paths share the same traversal-safe content contract. */
export const assetPathSchema = z
  .string()
  .startsWith('/assets/', 'must start with "/assets/"')
  .refine((url) => !url.includes('..'), 'must not contain ".."');
