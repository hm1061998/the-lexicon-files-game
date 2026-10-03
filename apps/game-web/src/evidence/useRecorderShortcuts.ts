import { useEffect, useRef } from 'react';
import { isTypingTarget } from '../game/systems/input';

export type RecorderKeyEvent = {
  key: string;
  repeat: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  target: unknown;
};

export type RecorderKeyAction =
  | { type: 'playPause' }
  | { type: 'restart' }
  | { type: 'hint' }
  | { type: 'transcript' }
  | { type: 'answer'; index: number }
  | null;

const CONTROL_TAGS = new Set(['BUTTON', 'A', 'SELECT']);

/**
 * What a key does while the recorder is open: Space plays or pauses, R rewinds, H opens the hint,
 * T the transcript, 1-9 answer. Text fields keep their keys; a focused control keeps Space (the
 * browser already clicks it), so nothing is activated twice.
 */
export function recorderKeyAction(event: RecorderKeyEvent, optionCount: number): RecorderKeyAction {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return null;
  if (isTypingTarget(event.target as Element | null)) return null;
  const { key } = event;
  if (key === ' ') {
    const tag = (event.target as { tagName?: string } | null)?.tagName ?? '';
    return CONTROL_TAGS.has(tag) ? null : { type: 'playPause' };
  }
  const lower = key.toLowerCase();
  if (lower === 'r') return { type: 'restart' };
  if (lower === 'h') return { type: 'hint' };
  if (lower === 't') return { type: 'transcript' };
  if (/^[1-9]$/.test(key)) {
    const index = Number(key) - 1;
    return index < optionCount ? { type: 'answer', index } : null;
  }
  return null;
}

export type RecorderShortcutHandlers = {
  enabled: boolean;
  optionCount?: number;
  onPlayPause(): void;
  onRestart(): void;
  onHint?(): void;
  onTranscript?(): void;
  onAnswer?(index: number): void;
};

export function useRecorderShortcuts(handlers: RecorderShortcutHandlers): void {
  const latest = useRef(handlers);
  latest.current = handlers;
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      const current = latest.current;
      if (!current.enabled) return;
      const action = recorderKeyAction(event, current.optionCount ?? 0);
      if (!action) return;
      if (action.type === 'playPause') current.onPlayPause();
      else if (action.type === 'restart') current.onRestart();
      else if (action.type === 'hint' && current.onHint) current.onHint();
      else if (action.type === 'transcript' && current.onTranscript) current.onTranscript();
      else if (action.type === 'answer' && current.onAnswer) current.onAnswer(action.index);
      else return;
      event.preventDefault();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
