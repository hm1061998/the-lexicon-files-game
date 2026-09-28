import type { UiStrings } from '@lexicon/shared-types';
import { parseUiStrings } from '../schema/ui';
import { ContentValidationError } from './ContentValidationError';
import viStrings from '../../ui/vi.json';

const uiRegistry: Record<'vi', unknown> = {
  vi: viStrings,
};

export function loadUiStrings(locale: 'vi'): UiStrings {
  const raw = uiRegistry[locale];
  if (!raw) {
    throw new ContentValidationError(`ui/${locale}.json`, [`no UI strings for locale "${locale}"`]);
  }
  return parseUiStrings(raw, `ui/${locale}.json`);
}
