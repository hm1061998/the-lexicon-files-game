import { useRef, useState } from 'react';
import type {
  ListeningAnswerResult,
  ListeningTaskDefinition,
  TranslationMode,
  UiStrings,
} from '@lexicon/shared-types';
import type { LearningAction } from '@lexicon/shared-types';
import { useAudioPlayback } from '../audio/useAudioPlayback';

type ListeningEvent = Extract<LearningAction, { type: 'recordListeningEvent' }>['event'];

export function ListeningTaskPanel({
  task,
  mode,
  completed,
  onAnswer,
  onTelemetry,
  strings,
}: {
  task: ListeningTaskDefinition;
  mode: TranslationMode;
  completed: boolean;
  onAnswer(optionId: string): ListeningAnswerResult;
  onTelemetry(event: ListeningEvent, elapsedMs?: number): void;
  strings: UiStrings;
}): JSX.Element {
  const playback = useAudioPlayback(task.audioAsset);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [answeredCorrectly, setAnsweredCorrectly] = useState(completed);
  const startedAt = useRef<number | null>(null);
  const subtitleCounted = useRef(false);
  const answerCounted = useRef(false);

  const beginPlayback = (replay: boolean) => {
    if (startedAt.current === null) startedAt.current = performance.now();
    if (mode === 'Beginner' && !subtitleCounted.current) {
      subtitleCounted.current = true;
      onTelemetry('subtitleUsed');
    }
    if (replay) {
      onTelemetry('replay');
      playback.replay();
    } else {
      playback.play();
    }
  };

  const submitAnswer = (optionId: string) => {
    if (completed || answeredCorrectly) return;
    const result = onAnswer(optionId);
    if (!result.ok || !result.correct) {
      onTelemetry('answerIncorrect');
      setFeedback(strings.listeningMismatch);
      return;
    }
    if (!answerCounted.current) {
      answerCounted.current = true;
      const elapsedMs =
        startedAt.current === null
          ? undefined
          : Math.max(0, Math.round(performance.now() - startedAt.current));
      onTelemetry('answerCorrect', elapsedMs);
    }
    setAnsweredCorrectly(true);
    setFeedback(strings.listeningCompleted);
  };

  const showTranscript = () => {
    if (!transcriptOpen) onTelemetry('transcriptOpened');
    setTranscriptOpen(!transcriptOpen);
  };

  const toggleHint = () => {
    if (!hintVisible) onTelemetry('hintUsed');
    setHintVisible(!hintVisible);
  };

  return (
    <section className="listening-task" aria-label={task.question}>
      <p className="listening-timestamp">
        <span>{strings.listeningTimestamp}</span> <time>{task.timestamp}</time>
      </p>
      <div className="listening-controls" aria-label={strings.listeningPlay}>
        {playback.state === 'playing' || playback.state === 'loading' ? (
          <button type="button" onClick={playback.pause} aria-label={strings.listeningPause}>
            {strings.listeningPause}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => beginPlayback(false)}
            aria-label={strings.listeningPlay}
          >
            {playback.state === 'ended' ? strings.listeningReplay : strings.listeningPlay}
          </button>
        )}
        <button
          type="button"
          onClick={() => beginPlayback(true)}
          aria-label={strings.listeningReplay}
        >
          {strings.listeningReplay}
        </button>
      </div>
      <p className="listening-playback-state" role="status" aria-live="polite">
        {playback.state === 'loading' ? strings.listeningLoading : null}
        {playback.state === 'playing' ? strings.listeningPlaying : null}
        {playback.state === 'paused' ? strings.listeningPaused : null}
        {playback.state === 'ended' ? strings.listeningEnded : null}
        {playback.state === 'error' ? strings.listeningPlaybackError : null}
      </p>
      {playback.state === 'error' && (
        <button type="button" onClick={() => beginPlayback(false)}>
          {strings.listeningRetry}
        </button>
      )}

      {mode === 'Beginner' && (
        <div className="listening-transcript">
          <h3>{strings.listeningTranscript}</h3>
          <p>{task.transcript}</p>
          {task.transcriptVi && (
            <p>
              <span>{strings.listeningTranslation}: </span>
              {task.transcriptVi}
            </p>
          )}
        </div>
      )}
      {mode === 'Learning' && (
        <div className="listening-support">
          <button type="button" onClick={toggleHint} aria-expanded={hintVisible}>
            {strings.listeningHint}
          </button>
          {hintVisible && <p>{task.keywordHints.join(' · ')}</p>}
          <button type="button" onClick={showTranscript} aria-expanded={transcriptOpen}>
            {strings.listeningShowTranscript}
          </button>
          {transcriptOpen && (
            <div className="listening-transcript">
              <h3>{strings.listeningTranscript}</h3>
              <p>{task.transcript}</p>
              {task.transcriptVi && (
                <p>
                  <span>{strings.listeningTranslation}: </span>
                  {task.transcriptVi}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <fieldset className="listening-question" disabled={completed || answeredCorrectly}>
        <legend>
          <span>{strings.listeningQuestion}: </span>
          {mode === 'Beginner' && task.questionVi ? task.questionVi : task.question}
        </legend>
        <div className="listening-options">
          {task.options.map((option) => (
            <button key={option.id} type="button" onClick={() => submitAnswer(option.id)}>
              {mode === 'Beginner' && option.textVi ? option.textVi : option.text}
            </button>
          ))}
        </div>
      </fieldset>
      {feedback && (
        <p className="listening-feedback" role="status" aria-live="polite">
          {feedback}
        </p>
      )}
    </section>
  );
}
