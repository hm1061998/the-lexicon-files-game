import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { isValidElement, type ReactElement } from 'react';
import { loadUiStrings } from '@lexicon/game-content';
import { SupportPicker } from './SupportPicker';

const strings = loadUiStrings('vi');

describe('SupportPicker', () => {
  it('lists the three support levels with hints and a default button', () => {
    const html = renderToString(<SupportPicker strings={strings} onChoose={() => undefined} />);
    for (const text of [
      strings.vocabularyModeBeginner,
      strings.vocabularyModeLearning,
      strings.vocabularyModeImmersion,
      strings.supportBeginnerHint,
      strings.supportLearningHint,
      strings.supportImmersionHint,
      strings.supportUseDefault,
    ])
      expect(html).toContain(text);
  });
  it('chooses Learning for the default button', () => {
    const chosen: string[] = [];
    const tree = SupportPicker({ strings, onChoose: (m) => chosen.push(m) });
    const buttons: ReactElement<{ onClick?: () => void; children?: unknown }>[] = [];
    const walk = (node: unknown): void => {
      if (Array.isArray(node)) return node.forEach(walk);
      if (!isValidElement(node)) return;
      const el = node as ReactElement<{ onClick?: () => void; children?: unknown }>;
      if (el.type === 'button') buttons.push(el);
      walk(el.props.children);
    };
    walk(tree);
    const fallback = buttons.find((b) => b.props.children === strings.supportUseDefault);
    fallback?.props.onClick?.();
    expect(chosen).toEqual(['Learning']);
  });
});
