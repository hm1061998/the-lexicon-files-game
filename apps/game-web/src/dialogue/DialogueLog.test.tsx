import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { loadCaseDefinition, loadUiStrings } from '@lexicon/game-content';
import { DialogueLog, groupDialogueLog } from './DialogueLog';

const definition = loadCaseDefinition('case-001');
const strings = loadUiStrings('vi');
const entries = [
  { npcId: 'anna', treeId: 'anna_initial', nodeId: 'entry' },
  { npcId: 'leo', treeId: 'leo_initial', nodeId: 'entry' },
  { npcId: 'anna', treeId: 'anna_initial', nodeId: 'answer1' },
];

describe('groupDialogueLog', () => {
  it('groups by person in first-seen order, newest line last', () => {
    const groups = groupDialogueLog(definition, entries);
    expect(groups.map((g) => g.npcName)).toEqual(['Anna Reed', 'Leo Tran']);
    expect(groups[0]!.lines).toEqual([
      definition.dialogues[0]!.nodes.find((n) => n.id === 'entry')!.text,
      definition.dialogues[0]!.nodes.find((n) => n.id === 'answer1')!.text,
    ]);
  });

  it('skips lines whose node no longer exists', () => {
    expect(
      groupDialogueLog(definition, [{ npcId: 'anna', treeId: 'anna_initial', nodeId: 'gone' }]),
    ).toEqual([]);
  });
});

describe('DialogueLog', () => {
  it('is a labelled dialog listing each person and their lines', () => {
    const html = renderToString(
      <DialogueLog
        strings={strings}
        groups={groupDialogueLog(definition, entries)}
        onClose={() => {}}
      />,
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain(strings.dialogueLogHeading);
    expect(html).toContain('Anna Reed');
    expect(html).toContain('Leo Tran');
    expect(html).toContain('ink-button');
  });

  it('says so when nothing has been said yet', () => {
    const html = renderToString(<DialogueLog strings={strings} groups={[]} onClose={() => {}} />);
    expect(html).toContain(strings.dialogueLogEmpty);
  });
});
