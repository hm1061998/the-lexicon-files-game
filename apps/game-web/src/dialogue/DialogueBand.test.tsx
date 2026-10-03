import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { loadCaseDefinition, loadUiStrings } from '@lexicon/game-content';
import { DialogueBand } from './DialogueBand';

const definition = loadCaseDefinition('case-001');
const strings = loadUiStrings('vi');
const node = definition.dialogues[0]!.nodes[0]!;
const base = {
  speakerName: 'Anna Reed',
  speakerRole: 'Project Coordinator',
  portraitSrc: '/assets/portraits/anna.png',
  strings,
  node,
  shown: node.text.length,
  done: true,
  choices: node.choices.map((choice, index) => ({ choice, seen: index === 1 })),
  notes: ['I left the meeting early.'],
  translationMode: 'Learning' as const,
  reducedMotion: false,
  titleId: 'title',
  error: null,
  textRef: { current: null },
  renderText: () => <span>{node.text}</span>,
  onChoose() {},
  onClose() {},
};

describe('DialogueBand', () => {
  it('shows the portrait, the name, the role and the interrogation label', () => {
    const html = renderToString(<DialogueBand {...base} />);
    expect(html).toContain('portrait');
    expect(html).toContain('Anna Reed');
    expect(html).toContain('Project Coordinator');
    expect(html).toContain(strings.dialogueInterrogating);
    expect(html).toContain('dialogue-panel');
  });

  it('reads the whole line through a live region while the visible copy types out', () => {
    const typing = renderToString(
      <DialogueBand
        {...base}
        done={false}
        shown={3}
        renderText={() => <span>{node.text.slice(0, 3)}</span>}
      />,
    );
    expect(typing).toMatch(/aria-live="polite"[^>]*>[^<]*I left/);
    expect(typing).toContain('aria-hidden="true"');
    expect(typing).not.toContain('dialogue-choice"');
  });

  it('numbers the choices and marks the ones already asked', () => {
    const html = renderToString(<DialogueBand {...base} />);
    expect(html).toContain('dialogue-choice__key');
    expect(html.match(/class="dialogue-choice[ "]/g)?.length).toBe(node.choices.length);
    expect(html.match(/dialogue-choice--seen/g)).toHaveLength(1);
    expect(html).toContain(strings.dialogueChoiceSeen);
  });

  it('shows the recorded statements as a handwritten note, or an empty hint', () => {
    expect(renderToString(<DialogueBand {...base} />)).toContain('I left the meeting early.');
    const empty = renderToString(<DialogueBand {...base} notes={[]} />);
    expect(empty).toContain(strings.dialogueNotesEmpty);
    expect(empty).toContain(strings.dialogueNotesHeading);
  });

  it('keeps the labelled dialog and the readable error', () => {
    const html = renderToString(<DialogueBand {...base} error="effectFailed: x" />);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('role="alert"');
    expect(html).toContain('effectFailed: x');
  });
});
