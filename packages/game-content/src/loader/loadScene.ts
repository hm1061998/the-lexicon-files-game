import type { SceneDefinition } from '@lexicon/shared-types';
import { loadCaseDefinition } from './loadCaseDefinition';
import { ContentValidationError } from './ContentValidationError';

export const DEFAULT_START = { caseId: 'case-001', sceneId: 'main_office' } as const;

export function loadSceneDefinition(caseId: string, sceneId: string): SceneDefinition {
  const scene = loadCaseDefinition(caseId).scenes.find(({ id }) => id === sceneId);
  if (!scene) {
    throw new ContentValidationError(`${caseId}/${sceneId}`, [
      `no scene registered for case "${caseId}" and scene "${sceneId}"`,
    ]);
  }
  return scene;
}
