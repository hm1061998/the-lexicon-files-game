import { useEffect, useId, useRef } from 'react';
import { InkButton } from '@lexicon/ui';
import type { CaseDefinition, UiStrings } from '@lexicon/shared-types';
import { getFocusTrapTarget } from '../pause/focusTrap';
import type { DialogueLogEntry } from '../state/gameStore';
import './dialogue-log.css';

export type DialogueLogGroup = { npcName: string; lines: readonly string[] };

const FOCUSABLE =
  'button:not(:disabled), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** The lines shown so far, grouped by person (first seen first), the newest line of each last. */
export function groupDialogueLog(
  definition: CaseDefinition,
  entries: readonly DialogueLogEntry[],
): readonly DialogueLogGroup[] {
  const groups = new Map<string, string[]>();
  for (const entry of entries) {
    const text = definition.dialogues
      .find((tree) => tree.id === entry.treeId)
      ?.nodes.find((node) => node.id === entry.nodeId)?.text;
    if (text === undefined) continue;
    const name = definition.npcs.find((npc) => npc.id === entry.npcId)?.name ?? entry.npcId;
    groups.set(name, [...(groups.get(name) ?? []), text]);
  }
  return [...groups].map(([npcName, lines]) => ({ npcName, lines }));
}

/** The conversation log: a paper column on the right. Esc and L close it; focus stays inside. */
export function DialogueLog({
  strings,
  groups,
  onClose,
}: {
  strings: UiStrings;
  groups: readonly DialogueLogGroup[];
  onClose(): void;
}): JSX.Element {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.querySelector<HTMLElement>('button')?.focus();
    function trap(event: KeyboardEvent) {
      if (event.key !== 'Tab') return;
      const focusables = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
      );
      const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const target = getFocusTrapTarget(focusables, active, event.shiftKey);
      if (target) {
        event.preventDefault();
        target.focus();
      }
    }
    window.addEventListener('keydown', trap);
    return () => {
      window.removeEventListener('keydown', trap);
      if (previous?.isConnected && previous !== document.body) previous.focus();
    };
  }, []);
  return (
    <div className="dialogue-log-overlay">
      <div className="dialogue-log">
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <div className="dialogue-log__header">
            <h2 id={titleId}>{strings.dialogueLogHeading}</h2>
            <InkButton sfx="paper-close" onClick={onClose}>
              {strings.close}
            </InkButton>
          </div>
          {groups.length === 0 ? (
            <p>{strings.dialogueLogEmpty}</p>
          ) : (
            groups.map((group) => (
              <section key={group.npcName} className="dialogue-log__group">
                <h3>{group.npcName}</h3>
                <ul>
                  {group.lines.map((line) => (
                    <li key={line} lang="en">
                      {line}
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
