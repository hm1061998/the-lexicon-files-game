import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PaperPanel } from './PaperPanel';
import { Keycap } from './Keycap';
import { PaperSheet } from './PaperSheet';
import { InkButton } from './InkButton';
import { IndexTab } from './IndexTab';
import { Stamp } from './Stamp';
import { KeyHintLine } from './KeyHintLine';

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
