import type { SceneDefinition } from '@lexicon/shared-types';
import { parseSceneDefinition } from '../schema/scene';
import { ContentValidationError } from './ContentValidationError';
import mainOfficeScene from '../../cases/case-001/scenes/main_office.json';

export const DEFAULT_START = { caseId: 'case-001', sceneId: 'main_office' } as const;

const sceneRegistry: Record<string, Record<string, unknown>> = {
  'case-001': {
    main_office: mainOfficeScene,
  },
};

export function loadSceneDefinition(caseId: string, sceneId: string): SceneDefinition {
  const scenesForCase = sceneRegistry[caseId];
  const raw = scenesForCase?.[sceneId];
  if (!raw) {
    throw new ContentValidationError(`${caseId}/${sceneId}`, [
      `no scene registered for case "${caseId}" and scene "${sceneId}"`,
    ]);
  }
  return parseSceneDefinition(raw, `${caseId}/scenes/${sceneId}.json`);
}
