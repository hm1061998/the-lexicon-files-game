import type { VocabularySpan } from '@lexicon/shared-types';
export type PageAnchor = { blockId: string; offset: number };
export type ReaderBlock =
  | {
      kind: 'text';
      id: string;
      text: string;
      spans: readonly VocabularySpan[];
      contextId: string | null;
    }
  | { kind: 'fixed'; id: string };
export type PageFragment = {
  blockId: string;
  start: number;
  end: number;
  spans: readonly VocabularySpan[];
};
export type PageLayout = { pages: readonly (readonly PageFragment[])[] };
