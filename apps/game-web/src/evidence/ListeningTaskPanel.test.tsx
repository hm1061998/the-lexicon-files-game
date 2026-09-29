import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { loadCaseDefinition, loadUiStrings } from '@lexicon/game-content';
import { ListeningTaskPanel } from './ListeningTaskPanel';

const content = loadCaseDefinition('case-001');
const task = content.listeningTasks[0]!;
const strings = loadUiStrings('vi');

describe('ListeningTaskPanel', () => {
  it('shows transcript and translation in Beginner mode', () => {
    const html = renderToString(
      <ListeningTaskPanel
        task={task}
        mode="Beginner"
        completed={false}
        onAnswer={() => {
          throw new Error('SSR must not submit answers');
        }}
        onTelemetry={() => {}}
        strings={strings}
      />,
    );
    expect(html).toContain(task.transcript.replaceAll("'", '&#x27;'));
    expect(html).toContain(task.transcriptVi);
  });

  it('shows language hints but keeps transcript and translation hidden in Learning mode', () => {
    const html = renderToString(
      <ListeningTaskPanel
        task={task}
        mode="Learning"
        completed={false}
        onAnswer={() => {
          throw new Error('SSR must not submit answers');
        }}
        onTelemetry={() => {}}
        strings={strings}
      />,
    );
    expect(html).toContain(task.keywordHints[0]!);
    expect(html).not.toContain(task.transcript.replaceAll("'", '&#x27;'));
    expect(html).not.toContain(task.transcriptVi);
  });

  it('does not render transcript or translation in Immersion mode', () => {
    const html = renderToString(
      <ListeningTaskPanel
        task={task}
        mode="Immersion"
        completed={false}
        onAnswer={() => {
          throw new Error('SSR must not submit answers');
        }}
        onTelemetry={() => {}}
        strings={strings}
      />,
    );
    expect(html).not.toContain(task.transcript.replaceAll("'", '&#x27;'));
    expect(html).not.toContain(task.transcriptVi);
  });

  it('shows transcript without translation when subtitles are on in Immersion', () => {
    const html = renderToString(
      <ListeningTaskPanel
        task={task}
        mode="Immersion"
        subtitles="on"
        completed={false}
        onAnswer={() => {
          throw new Error('SSR must not submit answers');
        }}
        onTelemetry={() => {}}
        strings={strings}
      />,
    );
    expect(html).toContain(task.transcript.replaceAll("'", '&#x27;'));
    expect(html).not.toContain(task.transcriptVi);
  });

  it('offers a button but no auto transcript when subtitles are off in Beginner', () => {
    const html = renderToString(
      <ListeningTaskPanel
        task={task}
        mode="Beginner"
        subtitles="off"
        completed={false}
        onAnswer={() => {
          throw new Error('SSR must not submit answers');
        }}
        onTelemetry={() => {}}
        strings={strings}
      />,
    );
    expect(html).toContain(strings.listeningShowTranscript);
    expect(html).not.toContain(task.transcript.replaceAll("'", '&#x27;'));
  });
});
