import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { loadCaseDefinition, loadUiStrings } from '@lexicon/game-content';
import { DialogueView } from './DialogueView';
const definition = loadCaseDefinition('case-001'),
  strings = loadUiStrings('vi');
const node = definition.dialogues[0]!.nodes[0]!;
const props = {
  speakerName: 'Anna Reed',
  speakerRole: 'Project Coordinator',
  node,
  choices: node.choices,
  session: { treeId: 'anna_initial', npcId: 'anna', nodeId: 'entry', revision: 1 },
  strings,
  error: null,
  onChoose() {},
  onClose() {},
  returnFocusRef: { current: null },
};
describe('DialogueView', () => {
  it('keeps the translation selector in Settings only', () => {
    const html = renderToString(<DialogueView {...props} />);
    expect(html).not.toContain('translation-mode-control');
  });
  it('renders authored speaker and choices as an accessible paper dialog', () => {
    const html = renderToString(<DialogueView {...props} />);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('Anna Reed');
    expect(html).toContain('Project Coordinator');
    expect(html).toContain(node.text);
    expect(html).toContain('What time did you leave?');
    expect(html).toContain('lang="en"');
  });
  it('shows a terminal confession with only close and readable errors', () => {
    const terminal = definition.dialogues[2]!.nodes.find((n) => n.id === 'confession')!;
    const html = renderToString(
      <DialogueView {...props} node={terminal} choices={[]} error="effectFailed: unknown ID" />,
    );
    expect(html).toContain(terminal.text);
    expect(html).not.toContain('What time did you leave?');
    expect(html).toContain('role="alert"');
    expect(html).toContain('effectFailed: unknown ID');
    expect(html).toContain(strings.close);
  });
  it('is a torn paper sheet with note-style choices and an ink close button', () => {
    const html = renderToString(<DialogueView {...props} />);
    expect(html).toContain('paper-sheet');
    expect(html).toContain('dialogue-panel');
    expect(html).not.toContain('paper-panel');
    expect(html).toContain('ink-button dialogue-close');
    expect(html.match(/dialogue-choice"/g)?.length).toBe(node.choices.length);
  });
});
