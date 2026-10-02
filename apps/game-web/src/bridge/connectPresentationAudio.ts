import type { CaseDefinition, EventBus, GameEventMap } from '@lexicon/shared-types';
import type { PresentationAudio } from '../audio/presentationAudio';
import type { GameStore } from '../state/gameStore';

export function connectPresentationAudio(
  bus: EventBus<GameEventMap>,
  store: GameStore,
  definition: CaseDefinition,
  audio: PresentationAudio,
): () => void {
  const offCue = bus.on('audio:cue', ({ cue }) => audio.playCue(cue));
  const offTransition = bus.on('scene:transitionRequested', () => {
    audio.stopVoice();
    bus.emit('audio:cue', { cue: 'door' });
  });
  const offTriggered = bus.on('interaction:triggered', ({ interactableId }) => {
    if (store.getState().inputLocked) return;
    const scene = definition.scenes.find(({ id }) => id === store.getState().activeSceneId);
    const interaction = scene?.assets.find(({ id }) => id === interactableId)?.interaction;
    if (interaction?.npcId) return;
    if (interaction?.effects?.some(({ type }) => type === 'completeObjective'))
      bus.emit('audio:cue', { cue: 'paper' });
  });
  const offDialogueStarted = bus.on('dialogue:started', () =>
    bus.emit('audio:cue', { cue: 'dialogue' }),
  );
  const unsubscribe = store.subscribe((next, previous) => {
    if (next.paused && !previous.paused) audio.stopVoice();
    if (next.paused !== previous.paused) audio.setPaused(next.paused);
    if (
      previous.notebookOpen !== next.notebookOpen ||
      previous.deductionOpen !== next.deductionOpen
    )
      bus.emit('audio:cue', { cue: 'paper' });
    if (
      previous.paused !== next.paused ||
      previous.minimapVisible !== next.minimapVisible ||
      previous.objectiveVisible !== next.objectiveVisible
    )
      bus.emit('audio:cue', { cue: 'ui' });
    if (previous.activeEvidenceId !== next.activeEvidenceId && next.activeEvidenceId)
      bus.emit('audio:cue', { cue: 'evidence' });
    if (previous.activeEvidenceId && !next.activeEvidenceId)
      bus.emit('audio:cue', { cue: 'paper' });
    if (
      previous.dialogueSession?.nodeId !== next.dialogueSession?.nodeId ||
      previous.dialogueSession?.revision !== next.dialogueSession?.revision
    ) {
      if (!next.dialogueSession) {
        audio.stopVoice();
        return;
      }
      const tree = definition.dialogues.find(({ id }) => id === next.dialogueSession!.treeId);
      const node = tree?.nodes.find(({ id }) => id === next.dialogueSession!.nodeId);
      if (previous.dialogueSession) bus.emit('audio:cue', { cue: 'dialogue' });
      if (node?.audio)
        audio.playVoice(`${next.dialogueSession.revision}:${tree!.id}:${node.id}`, node.audio);
    }
  });
  return () => {
    offCue();
    offTransition();
    offTriggered();
    offDialogueStarted();
    unsubscribe();
    audio.stopVoice();
  };
}
