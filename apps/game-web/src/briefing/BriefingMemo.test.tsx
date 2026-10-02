import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { loadCaseDefinition, loadUiStrings } from '@lexicon/game-content';
import { BriefingMemo } from './BriefingMemo';
import type { TranslationMode } from '@lexicon/shared-types';

const definition = loadCaseDefinition('case-001');
const strings = loadUiStrings('vi');
const briefing = definition.briefing;
if (!briefing) throw new Error('case-001 needs a briefing');
const noop = () => undefined;
const render = (translationMode: TranslationMode) =>
  renderToString(
    <BriefingMemo
      caseId={definition.id}
      briefing={briefing}
      strings={strings}
      vocabulary={definition.vocabulary}
      translationMode={translationMode}
      vocabularyTutorialSeen
      onVocabularyTutorialSeen={noop}
      onEncounter={noop}
      onInspect={noop}
      onRevealTranslation={noop}
      onAccept={noop}
    />,
  );

describe('BriefingMemo', () => {
  it('renders the title, sender, every line and the accept button', () => {
    const html = render('Learning');
    expect(html).toContain(strings.briefingTitle);
    expect(html).toContain(briefing.from);
    expect(html.match(/class="briefing-line"/g)).toHaveLength(briefing.lines.length);
    expect(html).toContain(strings.briefingAccept);
    expect(html).toContain('role="dialog"');
  });
  it('makes briefing vocabulary clickable in Learning mode', () => {
    expect(render('Learning')).toMatch(/<button[^>]*>confidential/);
  });
  it('shows the Vietnamese line in Beginner mode', () => {
    const translated = briefing.lines.find((line) => line.translationVi);
    expect(translated).toBeDefined();
    expect(render('Beginner')).toContain(translated?.translationVi?.slice(0, 12) ?? '');
  });

  it('is a paper modal sheet with an ink stamp and a focused accept button', () => {
    const html = render('Learning');
    expect(html).toContain('modal-sheet');
    expect(html).toContain('briefing-memo');
    expect(html).not.toContain('paper-panel');
    expect(html).toContain(strings.briefingStamp);
    expect(html).toContain('stamp--ink');
    expect(html).not.toContain('stamp--red');
    expect(html).toMatch(/autofocus[^>]*>Nhận hồ sơ</);
    expect(html.indexOf(strings.briefingStamp)).toBeLessThan(html.indexOf(strings.briefingTitle));
  });
});
