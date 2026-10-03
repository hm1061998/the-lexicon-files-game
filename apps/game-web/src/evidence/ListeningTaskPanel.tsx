import { useCallback, useRef, useState } from 'react';
import type {
  ListeningAnswerResult,
  ListeningTaskDefinition,
  TranslationMode,
  UiStrings,
} from '@lexicon/shared-types';
import type { LearningAction } from '@lexicon/shared-types';
import { useAudioPlayback } from '../audio/useAudioPlayback';
import { useOptionalPresentationAudio } from '../audio/PresentationAudioContext';
import type { SubtitlePreference } from '../persistence/settingsSchema';
import { resolveTranscriptBlock, resolveTranscriptVisibility } from './transcriptVisibility';
import { Stamp } from '@lexicon/ui';
import { CassetteRecorder } from './CassetteRecorder';
import { usePeaks } from './peaks';
import { useRecorderShortcuts } from './useRecorderShortcuts';

type ListeningEvent = Extract<LearningAction, { type: 'recordListeningEvent' }>['event'];

export function ListeningTaskPanel({
  task,
  mode,
  subtitles = 'auto',
  completed,
  onAnswer,
  onTelemetry,
  strings,
  reducedMotion = false,
  active = true,
}: {
  task: ListeningTaskDefinition;
  mode: TranslationMode;
  subtitles?: SubtitlePreference;
  completed: boolean;
  onAnswer(optionId: string): ListeningAnswerResult;
  onTelemetry(event: ListeningEvent, elapsedMs?: number): void;
  strings: UiStrings;
  reducedMotion?: boolean;
  /** False while the card shows its other section, so the recorder keys stay quiet. */
  active?: boolean;
}): JSX.Element {
  const presentationAudio = useOptionalPresentationAudio();
  const onPlayingChange = useCallback(
    (playing: boolean) => presentationAudio?.setListeningActive(playing),
    [presentationAudio],
  );
  const playback = useAudioPlayback(task.audioAsset, onPlayingChange);
  const visibility = resolveTranscriptVisibility(mode, subtitles);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const block = resolveTranscriptBlock(visibility, transcriptOpen);
  const [hintVisible, setHintVisible] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [answeredCorrectly, setAnsweredCorrectly] = useState(completed);
  const startedAt = useRef<number | null>(null);
  const subtitleCounted = useRef(false);
  const answerCounted = useRef(false);

  const beginPlayback = (replay: boolean) => {
    if (startedAt.current === null) startedAt.current = performance.now();
    if (visibility.transcriptShown && !subtitleCounted.current) {
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

  const running = playback.state === 'playing' || playback.state === 'loading';
  const togglePlayback = () => (running ? playback.pause() : beginPlayback(false));
  const peaks = usePeaks(task.audioAsset);
  const canHint = mode === 'Learning';
  const canTranscript = mode !== 'Immersion' && visibility.transcriptToggle;
  useRecorderShortcuts({
    enabled: active,
    optionCount: task.options.length,
    onPlayPause: togglePlayback,
    onRestart: () => beginPlayback(true),
    ...(canHint ? { onHint: toggleHint } : {}),
    ...(canTranscript ? { onTranscript: showTranscript } : {}),
    onAnswer: (index) => {
      const option = task.options[index];
      if (option) submitAnswer(option.id);
    },
  });

  return (
    <section className="listening-task" aria-label={task.question}>
      <CassetteRecorder
        state={playback.state}
        progress={playback.progress}
        elapsedSeconds={playback.progress * playback.duration}
        timestamp={task.timestamp}
        peaks={peaks}
        reducedMotion={reducedMotion}
        strings={strings}
        hintOpen={hintVisible}
        transcriptOpen={transcriptOpen}
        initialFocus
        onPlayPause={togglePlayback}
        onRestart={() => beginPlayback(true)}
        {...(canHint ? { onHint: toggleHint } : {})}
        {...(canTranscript ? { onTranscript: showTranscript } : {})}
      />
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
      {canHint && hintVisible && <p className="listening-hint">{task.keywordHints.join(' · ')}</p>}
      {block.transcript && (
        <TranscriptBlock task={task} strings={strings} translation={block.translation} />
      )}
      <fieldset className="listening-question" disabled={completed || answeredCorrectly}>
        <legend>
          <span>{strings.listeningQuestion}: </span>
          {mode === 'Beginner' && task.questionVi ? task.questionVi : task.question}
        </legend>
        <div className="listening-options">
          {task.options.map((option, index) => (
            <button
              key={option.id}
              type="button"
              className="listening-option"
              data-sfx="pen"
              onClick={() => submitAnswer(option.id)}
            >
              <span className="listening-option__key" aria-hidden="true">
                {index + 1}
              </span>
              {mode === 'Beginner' && option.textVi ? option.textVi : option.text}
            </button>
          ))}
        </div>
      </fieldset>
      {(completed || answeredCorrectly) && (
        <Stamp animate={!reducedMotion} className="listening-verified">
          {strings.listeningVerified}
        </Stamp>
      )}
      {feedback && (
        <p className="listening-feedback" role="status" aria-live="polite">
          {feedback}
        </p>
      )}
    </section>
  );
}

function TranscriptBlock({
  task,
  strings,
  translation,
}: {
  task: ListeningTaskDefinition;
  strings: UiStrings;
  translation: boolean;
}): JSX.Element {
  return (
    <div className="listening-transcript">
      <h3>{strings.listeningTranscript}</h3>
      <p>{task.transcript}</p>
      {translation && task.transcriptVi && (
        <p>
          <span>{strings.listeningTranslation}: </span>
          {task.transcriptVi}
        </p>
      )}
    </div>
  );
}
