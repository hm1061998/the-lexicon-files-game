import { z } from 'zod';
import type {
  CaseDefinition,
  CharacterSheets,
  Condition,
  ContradictionDefinition,
  Effect,
  EvidenceDefinition,
  FactDefinition,
  ListeningTaskDefinition,
  ObjectiveDefinition,
  SceneDefinition,
  TimelineDefinition,
} from '@lexicon/shared-types';
import { ContentValidationError } from '../loader/ContentValidationError';
import { npcSchema, dialogueTreeSchema } from './dialogue';
import { validateDialogueReferences } from '../validation/dialogueReferences';
import { conditionSchema, effectSchema } from './caseEngine';
import {
  PLACEHOLDER_TEXTURE_PREFIX,
  findDuplicateTextureKeys,
  sceneDefinitionSchema,
  textureEntrySchema,
} from './scene';
import { vocabularyCatalogueSchema, vocabularySpanSchema } from './learning';
import { validateVocabularyReferences } from '../validation/vocabularyReferences';
import { assetPathSchema } from './assetPath';

const caseRawSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    evidenceTotal: z.number().int().min(0),
    initialObjectiveId: z.string().min(1),
    conclusion: z
      .object({
        suspectNpcIds: z.array(z.string().min(1)).min(1),
        correctSuspectNpcId: z.string().min(1),
        objectiveId: z.string().min(1),
      })
      .strict()
      .optional(),
    sceneIds: z.array(z.string().min(1)).min(1),
    sharedTextures: z.array(textureEntrySchema),
    characterSheets: z
      .record(
        z.string().min(1),
        z
          .object({
            idle: z
              .object({
                NE: z.string().min(1),
                SE: z.string().min(1),
                SW: z.string().min(1),
                NW: z.string().min(1),
              })
              .strict(),
            walk: z.string().min(1).nullable(),
          })
          .strict(),
      )
      .refine((sheets) => 'player' in sheets, 'characterSheets must declare "player"'),
    timeline: z
      .object({
        slots: z.array(
          z
            .object({
              id: z.string().min(1),
              time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
            })
            .strict(),
        ),
        events: z.array(
          z
            .object({
              id: z.string().min(1),
              text: z.string().min(1),
              slotId: z.string().min(1),
              location: z.string().min(1),
              personIds: z.array(z.string().min(1)),
              source: z.string().min(1),
              confidence: z.string().min(1),
              availability: z.discriminatedUnion('type', [
                z.object({ type: z.literal('availableFromStart') }).strict(),
                z
                  .object({
                    type: z.literal('requiresFacts'),
                    factIds: z.array(z.string().min(1)).min(1),
                  })
                  .strict(),
              ]),
            })
            .strict(),
        ),
      })
      .strict(),
  })
  .strict();

const contradictionsRawSchema = z
  .object({
    contradictions: z.array(
      z
        .object({
          id: z.string().min(1),
          factIds: z
            .array(z.string().min(1))
            .length(2, 'must reference exactly two distinct fact IDs')
            .transform((factIds) => [factIds[0]!, factIds[1]!] as const),
          explanation: z.string().min(1),
          objectiveId: z.string().min(1),
        })
        .strict()
        .superRefine((contradiction, ctx) => {
          if (contradiction.factIds[0] === contradiction.factIds[1]) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['factIds'],
              message: 'must reference exactly two distinct fact IDs',
            });
          }
        }),
    ),
  })
  .strict();

const objectiveSchema = z
  .object({
    id: z.string().min(1),
    text: z.string().min(1),
    initialStatus: z.enum(['locked', 'active']).optional(),
    completionCondition: conditionSchema.optional(),
    activationCondition: conditionSchema.optional(),
  })
  .strict();

const evidenceSchema = z
  .object({
    id: z.string().min(1),
    caseId: z.string().min(1),
    name: z.string().min(1),
    category: z.enum(['document', 'audio', 'photo', 'object', 'statement', 'digital']),
    description: z.string().min(1),
    descriptionVi: z.string().min(1).optional(),
    vocabularySpans: z.array(vocabularySpanSchema).optional(),
    relatedFactIds: z.array(z.string().min(1)),
    relatedNpcIds: z.array(z.string().min(1)).optional(),
    vocabularyIds: z.array(z.string().min(1)).optional(),
    image: assetPathSchema.optional(),
  })
  .strict();

const factSchema = z
  .object({
    id: z.string().min(1),
    text: z.string().min(1),
    sourceEvidenceIds: z.array(z.string().min(1)),
    sourceDialogueIds: z.array(z.string().min(1)).optional(),
    unlockCondition: conditionSchema,
  })
  .strict();

const listeningOptionSchema = z
  .object({
    id: z.string().min(1),
    text: z.string().min(1),
    textVi: z.string().min(1).optional(),
  })
  .strict();

const listeningTaskSchema = z
  .object({
    id: z.string().min(1),
    evidenceId: z.string().min(1),
    audioAsset: z
      .string()
      .startsWith('/audio/')
      .refine((asset) => !asset.includes('..'), 'must not contain ".."'),
    timestamp: z.string().min(1),
    transcript: z.string().min(1),
    transcriptVi: z.string().min(1).optional(),
    question: z.string().min(1),
    questionVi: z.string().min(1).optional(),
    options: z.array(listeningOptionSchema).min(2),
    correctOptionId: z.string().min(1),
    keywordHints: z.array(z.string().min(1)),
    completionFlag: z.string().min(1),
    correctEffects: z.array(effectSchema),
  })
  .strict();

const objectivesRawSchema = z.object({ objectives: z.array(objectiveSchema).min(1) }).strict();
const evidencesRawSchema = z.object({ evidences: z.array(evidenceSchema) }).strict();
const factsRawSchema = z.object({ facts: z.array(factSchema) }).strict();
const listeningTasksRawSchema = z.object({ tasks: z.array(listeningTaskSchema) }).strict();

type ParseCaseDefinitionInput = {
  caseRaw: unknown;
  objectivesRaw: unknown;
  evidencesRaw: unknown;
  factsRaw: unknown;
  contradictionsRaw: unknown;
  listeningTasksRaw: unknown;
  sceneRaws: readonly unknown[];
  npcsRaw: unknown;
  dialoguesRaw: unknown;
  vocabularyRaw: unknown;
};

function formatIssue(issue: z.ZodIssue): string {
  const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
  return `${path}: ${issue.message}`;
}

function appendSchemaIssues(issues: string[], label: string, error: z.ZodError): void {
  issues.push(...error.issues.map((issue) => `${label}.${formatIssue(issue)}`));
}

function findDuplicates(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }
  return [...duplicates];
}

function visitCondition(condition: Condition, visit: (condition: Condition) => void): void {
  visit(condition);
  if (condition.type === 'all' || condition.type === 'any') {
    condition.conditions.forEach((child) => visitCondition(child, visit));
  }
}

function validateConditionReferences(
  condition: Condition,
  evidenceIds: ReadonlySet<string>,
  factIds: ReadonlySet<string>,
  objectiveIds: ReadonlySet<string>,
  path: string,
  issues: string[],
): void {
  visitCondition(condition, (item) => {
    if (item.type === 'hasEvidence' && !evidenceIds.has(item.evidenceId)) {
      issues.push(`${path}.evidenceId: unknown evidence id "${item.evidenceId}"`);
    } else if (item.type === 'hasFact' && !factIds.has(item.factId)) {
      issues.push(`${path}.factId: unknown fact id "${item.factId}"`);
    } else if (item.type === 'objectiveCompleted' && !objectiveIds.has(item.objectiveId)) {
      issues.push(`${path}.objectiveId: unknown objective id "${item.objectiveId}"`);
    }
  });
}

function validateEffectReferences(
  effect: Effect,
  evidenceIds: ReadonlySet<string>,
  factIds: ReadonlySet<string>,
  objectiveIds: ReadonlySet<string>,
  path: string,
  issues: string[],
): void {
  if (effect.type === 'addEvidence' && !evidenceIds.has(effect.evidenceId)) {
    issues.push(`${path}.evidenceId: unknown evidence id "${effect.evidenceId}"`);
  } else if (effect.type === 'unlockFact' && !factIds.has(effect.factId)) {
    issues.push(`${path}.factId: unknown fact id "${effect.factId}"`);
  } else if (
    (effect.type === 'activateObjective' || effect.type === 'completeObjective') &&
    !objectiveIds.has(effect.objectiveId)
  ) {
    issues.push(`${path}.objectiveId: unknown objective id "${effect.objectiveId}"`);
  }
}

function validateTextureReferences(
  caseData: {
    sharedTextures: readonly { key: string; url: string; frameWidth?: number | undefined }[];
    characterSheets: Readonly<
      Record<string, { idle: Readonly<Record<string, string>>; walk: string | null }>
    >;
  },
  scenes: readonly { id: string; textures: readonly { key: string; url: string }[] }[],
  issues: string[],
): void {
  for (const key of findDuplicateTextureKeys(caseData.sharedTextures)) {
    issues.push(`case.json.sharedTextures: duplicate texture key "${key}"`);
  }
  const shared = new Map(caseData.sharedTextures.map((entry) => [entry.key, entry]));
  for (const [name, sheet] of Object.entries(caseData.characterSheets)) {
    const path = `case.json.characterSheets.${name}`;
    for (const [facing, key] of Object.entries(sheet.idle)) {
      if (!key.startsWith(PLACEHOLDER_TEXTURE_PREFIX) && !shared.has(key)) {
        issues.push(`${path}.idle.${facing}: texture "${key}" is not declared in sharedTextures`);
      }
    }
    if (sheet.walk === null) continue;
    const walk = shared.get(sheet.walk);
    if (!walk) {
      issues.push(`${path}.walk: texture "${sheet.walk}" is not declared in sharedTextures`);
    } else if (walk.frameWidth === undefined) {
      issues.push(`${path}.walk: texture "${sheet.walk}" needs frameWidth and frameHeight`);
    }
  }
  // Textures are cached by key across scenes, so one key must always mean one file.
  const urlByKey = new Map<string, { url: string; owner: string }>();
  const owners = [
    { owner: 'case.json.sharedTextures', textures: caseData.sharedTextures },
    ...scenes.map((scene) => ({ owner: `scene ${scene.id}`, textures: scene.textures })),
  ];
  for (const { owner, textures } of owners) {
    for (const { key, url } of textures) {
      const known = urlByKey.get(key);
      if (!known) urlByKey.set(key, { url, owner });
      else if (known.url !== url) {
        issues.push(
          `${owner}: texture key "${key}" maps to different urls ("${known.url}" in ${known.owner}, "${url}" here)`,
        );
      }
    }
  }
}

export function parseCaseDefinition(
  input: ParseCaseDefinitionInput,
  source: string,
): CaseDefinition {
  const npcsResult = z
    .object({ npcs: z.array(npcSchema) })
    .strict()
    .safeParse(input.npcsRaw);
  const dialoguesResult = z
    .object({ dialogues: z.array(dialogueTreeSchema) })
    .strict()
    .safeParse(input.dialoguesRaw);
  const caseResult = caseRawSchema.safeParse(input.caseRaw);
  const objectivesResult = objectivesRawSchema.safeParse(input.objectivesRaw);
  const evidencesResult = evidencesRawSchema.safeParse(input.evidencesRaw);
  const factsResult = factsRawSchema.safeParse(input.factsRaw);
  const contradictionsResult = contradictionsRawSchema.safeParse(input.contradictionsRaw);
  const listeningTasksResult = listeningTasksRawSchema.safeParse(input.listeningTasksRaw);
  const vocabularyResult = vocabularyCatalogueSchema.safeParse(input.vocabularyRaw);
  const scenesResult = input.sceneRaws.map((scene) => sceneDefinitionSchema.safeParse(scene));

  const issues: string[] = [];
  if (!npcsResult.success) appendSchemaIssues(issues, `${source}/npcs.json`, npcsResult.error);
  if (!dialoguesResult.success)
    appendSchemaIssues(issues, `${source}/dialogues.json`, dialoguesResult.error);
  if (!caseResult.success) appendSchemaIssues(issues, `${source}/case.json`, caseResult.error);
  if (!objectivesResult.success) {
    appendSchemaIssues(issues, `${source}/objectives.json`, objectivesResult.error);
  }
  if (!evidencesResult.success) {
    appendSchemaIssues(issues, `${source}/evidences.json`, evidencesResult.error);
  }
  if (!factsResult.success) appendSchemaIssues(issues, `${source}/facts.json`, factsResult.error);
  if (!contradictionsResult.success) {
    appendSchemaIssues(issues, `${source}/contradictions.json`, contradictionsResult.error);
  }
  if (!listeningTasksResult.success) {
    appendSchemaIssues(issues, `${source}/listening-tasks.json`, listeningTasksResult.error);
  }
  if (!vocabularyResult.success)
    appendSchemaIssues(issues, `${source}/vocabulary.json`, vocabularyResult.error);
  scenesResult.forEach((result, index) => {
    if (!result.success) {
      appendSchemaIssues(issues, `${source}/sceneRaws.${index}`, result.error);
    }
  });

  if (
    !npcsResult.success ||
    !dialoguesResult.success ||
    !caseResult.success ||
    !objectivesResult.success ||
    !evidencesResult.success ||
    !factsResult.success ||
    !contradictionsResult.success ||
    !listeningTasksResult.success ||
    !vocabularyResult.success ||
    scenesResult.some((result) => !result.success)
  ) {
    throw new ContentValidationError(source, issues);
  }

  const caseData = caseResult.data;
  const objectives = objectivesResult.data.objectives as ObjectiveDefinition[];
  const evidences = evidencesResult.data.evidences as EvidenceDefinition[];
  const facts = factsResult.data.facts as FactDefinition[];
  const contradictions = contradictionsResult.data.contradictions as ContradictionDefinition[];
  const listeningTasks = listeningTasksResult.data.tasks as ListeningTaskDefinition[];
  const vocabulary = vocabularyResult.data.vocabulary;
  const scenes = scenesResult.map(
    (result) =>
      (result as { success: true; data: (typeof sceneDefinitionSchema)['_output'] }).data as unknown as SceneDefinition,
  );

  const collections: ReadonlyArray<{ label: string; ids: readonly string[] }> = [
    { label: 'sceneIds', ids: caseData.sceneIds },
    { label: 'objectives', ids: objectives.map(({ id }) => id) },
    { label: 'evidences', ids: evidences.map(({ id }) => id) },
    { label: 'facts', ids: facts.map(({ id }) => id) },
    { label: 'timeline.slots', ids: caseData.timeline.slots.map(({ id }) => id) },
    { label: 'timeline.events', ids: caseData.timeline.events.map(({ id }) => id) },
    { label: 'contradictions', ids: contradictions.map(({ id }) => id) },
    { label: 'listeningTasks', ids: listeningTasks.map(({ id }) => id) },
    { label: 'scenes', ids: scenes.map(({ id }) => id) },
  ];
  for (const collection of collections) {
    for (const id of findDuplicates(collection.ids)) {
      issues.push(`${collection.label}: duplicate id "${id}"`);
    }
  }

  const objectiveIds = new Set(objectives.map(({ id }) => id));
  const npcIds = new Set(npcsResult.data.npcs.map(({ id }) => id));
  const vocabularyContexts: { id: string; vocabularyIds: readonly string[] }[] = [];
  const evidenceIds = new Set(evidences.map(({ id }) => id));
  const factIds = new Set(facts.map(({ id }) => id));
  const evidenceById = new Map(evidences.map((evidence) => [evidence.id, evidence]));
  const sceneById = new Map(scenes.map((scene) => [scene.id, scene]));
  const slotIds = new Set(caseData.timeline.slots.map(({ id }) => id));

  if (!objectiveIds.has(caseData.initialObjectiveId)) {
    issues.push(
      `case.json.initialObjectiveId: unknown objective id "${caseData.initialObjectiveId}"`,
    );
  }
  for (const id of caseData.sceneIds) {
    if (!sceneById.has(id)) issues.push(`case.json.sceneIds: no scene definition for "${id}"`);
  }
  for (const scene of scenes) {
    if (!caseData.sceneIds.includes(scene.id)) {
      issues.push(`scene ${scene.id}: not referenced by case.json.sceneIds`);
    }
  }
  validateTextureReferences(caseData, scenes, issues);
  caseData.timeline.events.forEach((event, eventIndex) => {
    if (!slotIds.has(event.slotId)) {
      issues.push(
        `case.json.timeline.events.${eventIndex}.slotId: unknown timeline slot id "${event.slotId}"`,
      );
    }
    if (event.availability.type === 'requiresFacts') {
      event.availability.factIds.forEach((id) => {
        if (!factIds.has(id)) {
          issues.push(
            `case.json.timeline.events.${eventIndex}.availability.factIds: unknown fact id "${id}"`,
          );
        }
      });
    }
    event.personIds.forEach((id) => {
      if (!npcIds.has(id)) {
        issues.push(`case.json.timeline.events.${eventIndex}.personIds: unknown NPC id "${id}"`);
      }
    });
  });
  const conclusion = caseData.conclusion;
  if (conclusion) {
    const seenSuspects = new Set<string>();
    conclusion.suspectNpcIds.forEach((id) => {
      if (seenSuspects.has(id)) {
        issues.push(`case.json.conclusion.suspectNpcIds: duplicate suspect "${id}"`);
      }
      seenSuspects.add(id);
      if (!npcIds.has(id)) {
        issues.push(`case.json.conclusion.suspectNpcIds: unknown NPC id "${id}"`);
      }
    });
    if (!seenSuspects.has(conclusion.correctSuspectNpcId)) {
      issues.push(
        `case.json.conclusion.correctSuspectNpcId: "${conclusion.correctSuspectNpcId}" is not a declared suspect`,
      );
    }
    if (!objectiveIds.has(conclusion.objectiveId)) {
      issues.push(
        `case.json.conclusion.objectiveId: unknown objective id "${conclusion.objectiveId}"`,
      );
    }
  }
  objectives.forEach((objective, objectiveIndex) => {
    if (objective.activationCondition) {
      validateConditionReferences(
        objective.activationCondition,
        evidenceIds,
        factIds,
        objectiveIds,
        `objectives.${objectiveIndex}.activationCondition`,
        issues,
      );
    }
  });
  contradictions.forEach((contradiction, contradictionIndex) => {
    contradiction.factIds.forEach((id) => {
      if (!factIds.has(id)) {
        issues.push(`contradictions.${contradictionIndex}.factIds: unknown fact id "${id}"`);
      }
    });
    if (!objectiveIds.has(contradiction.objectiveId)) {
      issues.push(
        `contradictions.${contradictionIndex}.objectiveId: unknown objective id "${contradiction.objectiveId}"`,
      );
    }
  });

  listeningTasks.forEach((task, taskIndex) => {
    const evidence = evidenceById.get(task.evidenceId);
    if (!evidence) {
      issues.push(
        `listeningTasks.${taskIndex}.evidenceId: unknown evidence id "${task.evidenceId}"`,
      );
    } else if (evidence.category !== 'audio') {
      issues.push(`listeningTasks.${taskIndex}.evidenceId: must use audio evidence`);
    }
    const duplicateOptions = findDuplicates(task.options.map(({ id }) => id));
    duplicateOptions.forEach((id) => {
      issues.push(`listeningTasks.${taskIndex}.options: duplicate option id "${id}"`);
    });
    if (!task.options.some(({ id }) => id === task.correctOptionId)) {
      issues.push(
        `listeningTasks.${taskIndex}.correctOptionId: unknown option id "${task.correctOptionId}"`,
      );
    }
    task.correctEffects.forEach((effect, effectIndex) =>
      validateEffectReferences(
        effect,
        evidenceIds,
        factIds,
        objectiveIds,
        `listeningTasks.${taskIndex}.correctEffects.${effectIndex}`,
        issues,
      ),
    );
    if (
      !task.correctEffects.some(
        (effect) => effect.type === 'setFlag' && effect.key === task.completionFlag && effect.value,
      )
    ) {
      issues.push(
        `listeningTasks.${taskIndex}.completionFlag: requires a matching true setFlag effect`,
      );
    }
  });

  const interactionIds = new Set<string>();
  scenes.forEach((scene, sceneIndex) => {
    scene.assets.forEach((asset, assetIndex) => {
      if (!asset.interaction) return;
      if (interactionIds.has(asset.id)) {
        issues.push(
          `scenes.${sceneIndex}.assets.${assetIndex}.id: duplicate interaction id "${asset.id}" across scenes`,
        );
      }
      interactionIds.add(asset.id);
    });
  });

  evidences.forEach((evidence, index) => {
    const spans = evidence.vocabularySpans ?? [];
    const ids = [...new Set(spans.map(({ vocabularyId }) => vocabularyId))];
    if (spans.length > 0)
      vocabularyContexts.push({ id: `evidence:${evidence.id}:description`, vocabularyIds: ids });
    if (evidence.caseId !== caseData.id) {
      issues.push(`evidences.${index}.caseId: expected "${caseData.id}"`);
    }
    evidence.relatedFactIds.forEach((id) => {
      if (!factIds.has(id))
        issues.push(`evidences.${index}.relatedFactIds: unknown fact id "${id}"`);
    });
  });

  dialoguesResult.data.dialogues.forEach((tree) =>
    tree.nodes.forEach((node) => {
      if (node.vocabularySpans?.length)
        vocabularyContexts.push({
          id: `dialogue:${tree.id}:${node.id}:text`,
          vocabularyIds: [...new Set(node.vocabularySpans.map(({ vocabularyId }) => vocabularyId))],
        });
    }),
  );
  issues.push(
    ...validateVocabularyReferences({
      source,
      catalogue: vocabulary,
      evidenceContexts: evidences.map((entry) => ({
        id: `evidence:${entry.id}:description`,
        text: entry.description,
        spans: entry.vocabularySpans,
        vocabularyIds: entry.vocabularyIds,
      })),
      dialogueContexts: dialoguesResult.data.dialogues.flatMap((tree) =>
        tree.nodes.map((node) => ({
          id: `dialogue:${tree.id}:${node.id}:text`,
          text: node.text,
          spans: node.vocabularySpans,
        })),
      ),
    }),
  );

  facts.forEach((fact, index) => {
    fact.sourceEvidenceIds.forEach((id) => {
      if (!evidenceIds.has(id)) {
        issues.push(`facts.${index}.sourceEvidenceIds: unknown evidence id "${id}"`);
      }
    });
    validateConditionReferences(
      fact.unlockCondition,
      evidenceIds,
      factIds,
      objectiveIds,
      `facts.${index}.unlockCondition`,
      issues,
    );
  });

  scenes.forEach((scene, sceneIndex) => {
    scene.assets.forEach((asset, assetIndex) => {
      asset.interaction?.effects?.forEach((effect, effectIndex) => {
        validateEffectReferences(
          effect,
          evidenceIds,
          factIds,
          objectiveIds,
          `scenes.${sceneIndex}.assets.${assetIndex}.interaction.effects.${effectIndex}`,
          issues,
        );
      });
      const transition = asset.interaction?.transition;
      if (transition) {
        const targetScene = sceneById.get(transition.targetSceneId);
        const transitionPath = `scenes.${sceneIndex}.assets.${assetIndex}.interaction.transition`;
        if (!targetScene) {
          issues.push(
            `${transitionPath}.targetSceneId: unknown target scene id "${transition.targetSceneId}"`,
          );
        } else if (!Object.hasOwn(targetScene.spawnPoints, transition.targetSpawnId)) {
          issues.push(
            `${transitionPath}.targetSpawnId: unknown spawn id "${transition.targetSpawnId}" in scene "${transition.targetSceneId}"`,
          );
        }
      }
    });
  });

  validateDialogueReferences(
    {
      npcs: npcsResult.data.npcs,
      dialogues: dialoguesResult.data.dialogues,
      scenes,
      facts,
      evidences,
      objectives,
    },
    issues,
    (condition, path) =>
      validateConditionReferences(condition, evidenceIds, factIds, objectiveIds, path, issues),
    (effect, path) =>
      validateEffectReferences(effect, evidenceIds, factIds, objectiveIds, path, issues),
  );
  if (issues.length > 0) throw new ContentValidationError(source, issues);

  const scenesInCaseOrder = caseData.sceneIds.map((id) => sceneById.get(id)!);
  return {
    id: caseData.id,
    title: caseData.title,
    evidenceTotal: caseData.evidenceTotal,
    initialObjectiveId: caseData.initialObjectiveId,
    scenes: scenesInCaseOrder,
    npcs: npcsResult.data.npcs,
    dialogues: dialoguesResult.data.dialogues,
    evidences,
    facts,
    objectives,
    vocabulary,
    vocabularyContexts,
    listeningTasks,
    timeline: caseData.timeline as TimelineDefinition,
    contradictions,
    ...(conclusion ? { conclusion } : {}),
    sharedTextures: caseData.sharedTextures,
    // The schema refinement guarantees the `player` entry.
    characterSheets: caseData.characterSheets as CharacterSheets,
  };
}
