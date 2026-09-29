import { describe, expect, it } from 'vitest';
import { loadLegacySaveContract } from './loadLegacySaveContract';

describe('loadLegacySaveContract', () => {
  it('provides the historical Case #001 V2 IDs needed to migrate saves', () => {
    expect(loadLegacySaveContract('case-001', 2)).toEqual({
      schemaVersion: 2,
      caseId: 'case-001',
      caseTitle: 'The Missing Report',
      evidenceTotal: 5,
      objectiveIds: ['find_what_happened', 'talk_to_everyone'],
      evidenceIds: ['leo_phone_recording', 'meeting_minutes'],
      factIds: [
        'leo_outside_at_2029',
        'meeting_started',
        'david_statement_no_entry_after_20_00',
        'david_collected_folder',
        'david_took_report',
      ],
    });
  });
});
