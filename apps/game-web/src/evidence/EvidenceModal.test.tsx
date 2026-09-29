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
    expect(html).toContain(evidence.name.replaceAll("'", '&#x27;'));
    expect(html).toContain(evidence.description);
    expect(html).toContain(strings.close);
  });

  it('shows decorative artwork only when the evidence has an image', () => {
    const withImage = renderToString(
      <EvidenceModal
        evidence={{ ...evidence, image: '/assets/evidence/x.png' }}
        strings={strings}
        onClose={() => {}}
      />,
    );
    expect(withImage).toContain('<img');
    expect(withImage).toContain('src="/assets/evidence/x.png"');
    expect(withImage).toContain('alt=""');
    const plain = { ...evidence };
    delete (plain as { image?: string }).image;
    const without = renderToString(
      <EvidenceModal evidence={plain} strings={strings} onClose={() => {}} />,
    );
    expect(without).not.toContain('<img');
  });
});
