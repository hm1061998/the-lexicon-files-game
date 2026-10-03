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
  it('is the interrogation band with numbered choices and an ink close button', () => {
    const html = renderToString(<DialogueView {...props} />);
    expect(html).toContain('dialogue-band');
    expect(html).toContain('dialogue-panel');
    expect(html).not.toContain('paper-panel');
    expect(html).toContain('ink-button dialogue-close');
    expect(html.match(/class="ink-button dialogue-choice[ "]/g)).toHaveLength(node.choices.length);
  });

  it('types a line out at a normal speed and holds the choices back until it is shown', () => {
    const html = renderToString(<DialogueView {...props} textSpeed="normal" />);
    expect(html).not.toContain('ink-button dialogue-choice');
    expect(html).toContain(node.text); // the live region carries the whole line
  });
});
