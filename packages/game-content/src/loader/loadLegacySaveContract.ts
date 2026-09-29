import { z } from 'zod';
import case001V1 from '../../cases/case-001/save-v1.json';
import case001V2 from '../../cases/case-001/save-v2.json';
import case001V3 from '../../cases/case-001/save-v3.json';
const contractSchema = z
  .object({
    schemaVersion: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    caseId: z.string().min(1),
    caseTitle: z.string().min(1),
    evidenceTotal: z.number().int().nonnegative(),
    objectiveIds: z.array(z.string().min(1)),
    evidenceIds: z.array(z.string().min(1)),
    factIds: z.array(z.string().min(1)),
    // Present from V3 (Phase 8) onward.
    timelineEventIds: z.array(z.string().min(1)).optional(),
    contradictionIds: z.array(z.string().min(1)).optional(),
  })
  .strict();
export type LegacySaveContract = z.infer<typeof contractSchema>;
/** Historical snapshots: never derived from current content, which moves on. */
const contracts: readonly LegacySaveContract[] = [
  contractSchema.parse(case001V1),
  contractSchema.parse(case001V2),
  contractSchema.parse(case001V3),
];
export function loadLegacySaveContract(caseId: string, version: number): LegacySaveContract | null {
  return contracts.find((c) => c.caseId === caseId && c.schemaVersion === version) ?? null;
}
