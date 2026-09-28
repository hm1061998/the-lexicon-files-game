import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { loadCaseDefinition, loadUiStrings } from '@lexicon/game-content';
import { EvidenceModal } from './EvidenceModal';

const strings = loadUiStrings('vi');
const evidence = loadCaseDefinition('case-001').evidences[0]!;

describe('EvidenceModal', () => {
  it('renders evidence content in an accessible dialog with a close button', () => {
    const html = renderToString(
      <EvidenceModal evidence={evidence} strings={strings} onClose={() => {}} />,
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain(evidence.name);
    expect(html).toContain(evidence.description);
    expect(html).toContain(strings.close);
  });
});
