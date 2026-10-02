export { sceneDefinitionSchema, parseSceneDefinition } from './schema/scene';
export { expandWalls, WALL_THICKNESS, WALL_MODULE_ART } from './geometry/wallSegments';
export { validateSceneGeometry, PLAYER_LOGICAL_BODY } from './geometry/sceneGeometry';
export { findPortalWall, validatePortalPlacement } from './geometry/portalPlacement';
export { conditionSchema, effectSchema } from './schema/caseEngine';
export { parseCaseDefinition } from './schema/caseDefinition';
export {
  vocabularyEntrySchema,
  vocabularySpanSchema,
  vocabularyCatalogueSchema,
} from './schema/learning';
export { validateVocabularyReferences } from './validation/vocabularyReferences';
export { parseUiStrings } from './schema/ui';
export { loadSceneDefinition } from './loader/loadScene';
export { loadCaseDefinition, REGISTERED_CASE_IDS } from './loader/loadCaseDefinition';
export { listCaseCatalogue } from './loader/caseCatalogue';
export { loadAllVocabulary } from './loader/loadAllVocabulary';
export type { CaseCatalogueEntry } from './loader/caseCatalogue';
export { loadUiStrings } from './loader/loadUiStrings';
export { ContentValidationError } from './loader/ContentValidationError';

export { validateRegisteredContent } from './validation/validateRegisteredContent';
export { loadLegacySaveContract } from './loader/loadLegacySaveContract';
export type { LegacySaveContract } from './loader/loadLegacySaveContract';
