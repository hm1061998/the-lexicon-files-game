import { z } from 'zod';
import case001V1 from '../../cases/case-001/save-v1.json';
const contractSchema = z
  .object({
    schemaVersion: z.literal(1),
    caseId: z.string().min(1),
    caseTitle: z.string().min(1),
    evidenceTotal: z.number().int().nonnegative(),
    objectiveIds: z.array(z.string().min(1)),
    evidenceIds: z.array(z.string().min(1)),
    factIds: z.array(z.string().min(1)),
  })
  .strict();
export type LegacySaveContract = z.infer<typeof contractSchema>;
const contracts: readonly LegacySaveContract[] = [contractSchema.parse(case001V1)];
export function loadLegacySaveContract(caseId: string, version: number): LegacySaveContract | null {
  return contracts.find((c) => c.caseId === caseId && c.schemaVersion === version) ?? null;
}
