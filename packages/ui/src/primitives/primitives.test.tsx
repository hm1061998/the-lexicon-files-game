import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Keycap } from './Keycap';
import { PaperSheet } from './PaperSheet';
import { InkButton } from './InkButton';
import { PaperButton } from './PaperButton';
import { DeviceKey } from './DeviceKey';
import { IndexTab } from './IndexTab';
import { Stamp } from './Stamp';
import { KeyHintLine } from './KeyHintLine';
import { DeskBackdrop } from './DeskBackdrop';
import { FolderCover } from './FolderCover';
import { FolderTabs } from './FolderTabs';
import { PinnedCard } from './PinnedCard';
import { ModalSheet } from './ModalSheet';
import { readFileSync } from 'node:fs';

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

describe('PinnedCard', () => {
  it('is a clean fresh paper card with a pin by default', () => {
    const html = renderToString(<PinnedCard>Note</PinnedCard>);
    expect(html).toContain('pinned-card');
    expect(html).toContain('paper-sheet--clean');
    expect(html).toContain('pinned-card__pin');
    expect(html).not.toContain('pinned-card--selected');
    expect(html).toContain('Note');
  });

  it('marks the selected card and clamps the tilt', () => {
    expect(renderToString(<PinnedCard selected>x</PinnedCard>)).toContain('pinned-card--selected');
    expect(renderToString(<PinnedCard tilt={5}>x</PinnedCard>)).toContain('--paper-tilt:2deg');
  });

  it('holds the card with tape instead of a pin', () => {
    const html = renderToString(<PinnedCard pin="tape">x</PinnedCard>);
    expect(html).toContain('pinned-card__tape');
    expect(html).not.toContain('pinned-card__pin');
  });

  it('renders as another element and keeps its attributes', () => {
    const html = renderToString(
      <PinnedCard as="button" type="button" aria-pressed="true">
        x
      </PinnedCard>,
    );
    expect(html).toMatch(/^<button[^>]*aria-pressed="true"/);
  });
});

describe('FolderTabs variants', () => {
  const items = [
    { id: 'a', label: 'A', onSelect: () => undefined, current: true },
    { id: 'b', label: 'B', onSelect: () => undefined },
  ];

  it('defaults to the folder variant and aria-current="true"', () => {
    const html = renderToString(<FolderTabs label="Menu" items={items} />);
    expect(html).toContain('folder-tabs--folder');
    expect(html.match(/aria-current="true"/g)).toHaveLength(1);
  });

  it('book and board variants add their class; ariaCurrent="page" marks the current page', () => {
    const book = renderToString(
      <FolderTabs label="Sổ" items={items} variant="book" ariaCurrent="page" />,
    );
    expect(book).toContain('folder-tabs--book');
    expect(book.match(/aria-current="page"/g)).toHaveLength(1);
    expect(renderToString(<FolderTabs label="B" items={items} variant="board" />)).toContain(
      'folder-tabs--board',
    );
  });
});

describe('investigation desk motion guards', () => {
  const motion = readFileSync(new URL('./motion.css', import.meta.url), 'utf8');
  const off = motion.slice(motion.indexOf('Shell paper never tilts'), motion.indexOf('@media'));
  const os = motion.slice(motion.indexOf('@media (prefers-reduced-motion'));

  it('levels pinned cards and lifts the tab variants under both switches', () => {
    for (const part of [off, os]) {
      expect(part).toContain('.pinned-card');
      expect(part).toContain('.folder-tabs--book .folder-tab');
      expect(part).toContain('.folder-tabs--board .folder-tab');
    }
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

describe('button kinds and their sounds', () => {
  it('InkButton defaults to the press sound and accepts an override', () => {
    expect(renderToString(<InkButton>Go</InkButton>)).toContain('data-sfx="press"');
    expect(renderToString(<InkButton sfx="paper-close">Go</InkButton>)).toContain(
      'data-sfx="paper-close"',
    );
  });

  it('PaperButton is a paper-button with the press sound by default', () => {
    const html = renderToString(<PaperButton>Vụ án mới</PaperButton>);
    expect(html).toContain('paper-button');
    expect(html).toContain('data-sfx="press"');
    expect(html).toContain('Vụ án mới');
    expect(renderToString(<PaperButton sfx="stamp">x</PaperButton>)).toContain('data-sfx="stamp"');
  });

  it('a disabled button still carries its sound id (the listener skips it)', () => {
    const html = renderToString(<PaperButton disabled>x</PaperButton>);
    expect(html).toContain('disabled=""');
    expect(html).toContain('data-sfx="press"');
  });

  it('DeviceKey shows its icon and label, a device click sound and aria-pressed', () => {
    const html = renderToString(
      <DeviceKey icon={<svg data-icon="play" />} label="Phát" pressed>
        {null}
      </DeviceKey>,
    );
    expect(html).toContain('device-key');
    expect(html).toContain('data-sfx="device-click"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('data-icon="play"');
    expect(html).toContain('Phát');
  });

  it('DeviceKey omits aria-pressed when it is not a toggle', () => {
    const html = renderToString(<DeviceKey icon={<svg />} label="Phát" />);
    expect(html).not.toContain('aria-pressed');
  });
});
