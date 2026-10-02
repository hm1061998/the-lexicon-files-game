import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { loadCaseDefinition, loadUiStrings } from '@lexicon/game-content';
import { EvidenceModal, nextImageFailureState, shouldShowEvidenceImage } from './EvidenceModal';

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

  it('hides decorative artwork after the image reports an error', () => {
    const image = '/assets/evidence/broken.png';
    const failed = nextImageFailureState('error', image);
    expect(shouldShowEvidenceImage(image, failed)).toBe(false);
    expect(shouldShowEvidenceImage(image, null)).toBe(true);
  });

  it('is a pinned card on a modal sheet with a photo frame and a labelled heading', () => {
    const html = renderToString(
      <EvidenceModal
        evidence={{ ...evidence, image: '/assets/evidence/x.png' }}
        strings={strings}
        onClose={() => {}}
      />,
    );
    expect(html).toContain('modal-sheet');
    expect(html).toContain('evidence-modal');
    expect(html).not.toContain('paper-panel');
    expect(html).toMatch(/aria-labelledby="([^"]+)"/);
    const id = /aria-labelledby="([^"]+)"/.exec(html)![1]!;
    expect(html).toContain(`id="${id}"`);
    expect(html).toMatch(/evidence-photo[^>]*><img[^>]*evidence-art/);
    expect(html).toContain('ink-button evidence-close');
    expect(html).toContain(`aria-label="${strings.close}"`);
  });
});
