import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PaperPanel } from './PaperPanel';
import { Keycap } from './Keycap';
import { PaperSheet } from './PaperSheet';
import { InkButton } from './InkButton';
import { IndexTab } from './IndexTab';
import { Stamp } from './Stamp';
import { KeyHintLine } from './KeyHintLine';
import { DeskBackdrop } from './DeskBackdrop';
import { FolderCover } from './FolderCover';
import { FolderTabs } from './FolderTabs';
import { ModalSheet } from './ModalSheet';
import { readFileSync } from 'node:fs';

describe('PaperPanel', () => {
  it('renders children', () => {
    const html = renderToString(<PaperPanel>hello</PaperPanel>);
    expect(html).toContain('hello');
  });

  it('keeps the legacy paper-panel class', () => {
    expect(renderToString(<PaperPanel className="x">a</PaperPanel>)).toContain('paper-panel');
  });
});

describe('PaperSheet', () => {
  it('renders edge, tone and a clamped tilt', () => {
    const html = renderToString(
      <PaperSheet edge="torn" tone="aged" tilt={5}>
        note
      </PaperSheet>,
    );
    expect(html).toContain('paper-sheet--torn');
    expect(html).toContain('paper-sheet--aged');
    expect(html).toContain('--paper-tilt:2deg');
    const low = renderToString(<PaperSheet tilt={-9}>x</PaperSheet>);
    expect(low).toContain('--paper-tilt:-2deg');
  });

  it('defaults to a clean fresh sheet without tilt', () => {
    const html = renderToString(<PaperSheet>x</PaperSheet>);
    expect(html).toContain('paper-sheet--clean');
    expect(html).toContain('paper-sheet--fresh');
    expect(html).not.toContain('--paper-tilt');
  });

  it('renders a decorative clip and tape', () => {
    const html = renderToString(
      <PaperSheet clip tape="tr">
        x
      </PaperSheet>,
    );
    expect(html).toMatch(/<img[^>]*aria-hidden="true"/);
    expect(html).toContain('paper-sheet__tape--tr');
  });
});

describe('InkButton', () => {
  it('is a plain button with the ink class', () => {
    const html = renderToString(<InkButton disabled>Go</InkButton>);
    expect(html).toContain('<button');
    expect(html).toContain('ink-button');
    expect(html).toContain('disabled=""');
  });
});

describe('IndexTab and Stamp', () => {
  it('render their classes', () => {
    expect(renderToString(<IndexTab>HỒ SƠ</IndexTab>)).toContain('index-tab');
    expect(renderToString(<Stamp animate>OK</Stamp>)).toContain('stamp--animate');
    expect(renderToString(<Stamp>OK</Stamp>)).not.toContain('stamp--animate');
  });
});

describe('KeyHintLine', () => {
  it('renders actionable items as buttons and the rest as text', () => {
    const html = renderToString(
      <KeyHintLine
        items={[
          { key: 'J', label: 'Sổ tay', onActivate: () => undefined },
          { key: 'E', label: 'Tương tác', dimmed: true },
        ]}
      />,
    );
    expect(html).toMatch(/<button[^>]*>/);
    expect(html).toContain('Sổ tay');
    expect(html).toContain('Tương tác');
    expect(html).toContain('key-hint--dimmed');
  });

  it('compact mode keeps only the key and moves the label into aria-label', () => {
    const html = renderToString(
      <KeyHintLine compact items={[{ key: 'J', label: 'Sổ tay', onActivate: () => undefined }]} />,
    );
    expect(html).toContain('aria-label="Sổ tay"');
    expect(html.replace('aria-label="Sổ tay"', '')).not.toContain('Sổ tay');
    expect(html).toContain('key-hint-line--compact');
  });

  it('disables a disabled item', () => {
    const html = renderToString(
      <KeyHintLine
        items={[{ key: 'J', label: 'Sổ tay', onActivate: () => undefined, disabled: true }]}
      />,
    );
    expect(html).toContain('disabled=""');
  });
});

describe('Keycap', () => {
  it('renders key label', () => {
    const html = renderToString(<Keycap>E</Keycap>);
    expect(html).toContain('E');
  });
});

describe('Stamp tone', () => {
  it('is ink by default and red only on request', () => {
    const ink = renderToString(<Stamp>OK</Stamp>);
    expect(ink).toContain('stamp--ink');
    expect(ink).not.toContain('stamp--red');
    expect(renderToString(<Stamp tone="red">OK</Stamp>)).toContain('stamp--red');
  });

  it('passes standard span attributes through', () => {
    const html = renderToString(
      <Stamp role="status" aria-live="polite">
        CLOSED
      </Stamp>,
    );
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
  });
});

describe('DeskBackdrop', () => {
  it('renders a hidden decorative layer around its children', () => {
    const html = renderToString(<DeskBackdrop>inside</DeskBackdrop>);
    expect(html).toContain('desk-backdrop');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('inside');
  });
});

describe('FolderCover', () => {
  it('renders label, a level-one title and tagline', () => {
    const html = renderToString(
      <FolderCover
        label="The Missing Report"
        title="The Lexicon Files"
        tagline="Every word is a clue."
      >
        body
      </FolderCover>,
    );
    expect(html).toContain('folder-cover');
    expect(html).toContain('The Missing Report');
    expect(html).toMatch(/<h1[^>]*>The Lexicon Files<\/h1>/);
    expect(html).toContain('Every word is a clue.');
    expect(html).toContain('body');
  });

  it('can use a level-two heading', () => {
    expect(renderToString(<FolderCover title="Cài đặt" headingLevel={2} />)).toMatch(
      /<h2[^>]*>Cài đặt<\/h2>/,
    );
  });
});

describe('FolderTabs', () => {
  const items = [
    {
      id: 'continue',
      label: 'Tiếp tục',
      onSelect: () => undefined,
      primary: true,
      autoFocus: true,
    },
    { id: 'new', label: 'Vụ án mới', onSelect: () => undefined, current: true },
    { id: 'settings', label: 'Cài đặt', onSelect: () => undefined, disabled: true },
  ];

  it('is a labelled nav with one button per item in order', () => {
    const html = renderToString(<FolderTabs label="Menu" items={items} />);
    expect(html).toMatch(/<nav[^>]*aria-label="Menu"/);
    expect(html.match(/<button/g)).toHaveLength(3);
    expect(html.indexOf('Tiếp tục')).toBeLessThan(html.indexOf('Vụ án mới'));
    expect(html.indexOf('Vụ án mới')).toBeLessThan(html.indexOf('Cài đặt'));
  });

  it('marks the primary, current and disabled tabs', () => {
    const html = renderToString(<FolderTabs label="Menu" items={items} />);
    expect(html).toContain('folder-tab--primary');
    expect(html).toContain('aria-current="true"');
    expect(html).toContain('disabled=""');
    expect(html).toContain('autofocus');
  });
});

describe('ModalSheet', () => {
  it('is a modal dialog labelled by its heading', () => {
    const html = renderToString(<ModalSheet heading="Tạm dừng">body</ModalSheet>);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    const labelledBy = /aria-labelledby="([^"]+)"/.exec(html)?.[1];
    expect(labelledBy).toBeTruthy();
    expect(html).toContain(`id="${labelledBy}"`);
  });

  it('can be an alertdialog and puts the stamp before the heading', () => {
    const html = renderToString(
      <ModalSheet role="alertdialog" heading="Xác nhận" stamp={<Stamp>MẬT</Stamp>}>
        x
      </ModalSheet>,
    );
    expect(html).toContain('role="alertdialog"');
    expect(html.indexOf('MẬT')).toBeLessThan(html.indexOf('Xác nhận'));
  });

  it('sits on the scrim and applies the extra class names', () => {
    const html = renderToString(
      <ModalSheet heading="H" className="pause-menu" overlayClassName="pause-menu-overlay">
        x
      </ModalSheet>,
    );
    expect(html).toContain('modal-scrim');
    expect(html).toContain('pause-menu-overlay');
    expect(html).toContain('modal-sheet');
    expect(html).toContain('pause-menu');
  });

  it('makes the dialog focusable when asked to take focus on mount', () => {
    expect(
      renderToString(
        <ModalSheet heading="H" focusOnMount>
          x
        </ModalSheet>,
      ),
    ).toContain('tabindex="-1"');
  });
});

describe('shell CSS guardrails', () => {
  const read = (name: string) => readFileSync(new URL(`./${name}`, import.meta.url), 'utf8');

  it('keeps the investigation red out of the shell materials', () => {
    for (const file of [
      'desk-backdrop.css',
      'folder-cover.css',
      'folder-tabs.css',
      'modal-sheet.css',
    ])
      expect(read(file).toLowerCase()).not.toContain('#a4412d');
  });

  it('levels tilted shell paper when the motion switch is on', () => {
    const css = read('motion.css');
    expect(css).toMatch(/\.lexicon-motion-off\s+\.folder-cover/);
    expect(css).toMatch(/\.lexicon-motion-off\s+\.modal-sheet/);
    expect(css).toMatch(/\.lexicon-motion-off\s+\.case-card/);
  });
});
