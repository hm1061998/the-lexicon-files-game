import type { CaseDefinition, EventBus, GameEventMap } from '@lexicon/shared-types';
import type { GameStore } from '../state/gameStore';

/**
 * The one way to start a scene transition: the store learns the new active scene first, then
 * Phaser is told to switch. Returns false (and emits nothing) for an unknown scene or spawn.
 */
export function requestSceneTransition(
  bus: EventBus<GameEventMap>,
  store: GameStore,
  sceneId: string,
  spawnId: string,
): boolean {
  if (!store.getState().transitionScene(sceneId, spawnId)) return false;
  bus.emit('scene:transitionRequested', { sceneId, spawnId });
  return true;
}

/** Resolves interaction IDs to content-authored effects and applies them through the case store. */
export function connectCaseEngine(
  bus: EventBus<GameEventMap>,
  store: GameStore,
  definition: CaseDefinition,
): () => void {
  let activeDialogueNpcId: string | null = null;
  const unsubscribeStore = store.subscribe((next, previous) => {
    if (previous.dialogueSession && !next.dialogueSession) {
      const npcId = activeDialogueNpcId ?? previous.dialogueSession.npcId;
      activeDialogueNpcId = null;
      bus.emit('dialogue:ended', { npcId });
    }
  });
  const unsubscribeBus = bus.on('interaction:triggered', ({ interactableId }) => {
    if (store.getState().inputLocked) return;
    const currentScene = definition.scenes.find(({ id }) => id === store.getState().activeSceneId);
    const interaction = currentScene?.assets.find(
      (asset) => asset.id === interactableId,
    )?.interaction;
    if (interaction?.npcId) {
      if (store.getState().startDialogue(interaction.npcId)) {
        activeDialogueNpcId = interaction.npcId;
        bus.emit('dialogue:started', { npcId: interaction.npcId });
      }
      return;
    }
    if (interaction?.transition) {
      const { targetSceneId: sceneId, targetSpawnId: spawnId } = interaction.transition;
      requestSceneTransition(bus, store, sceneId, spawnId);
      return;
    }
    if (interaction?.effects?.length) {
      const result = store.getState().applyCaseEffects(interaction.effects);
      if (!result.ok) return;
      for (const event of result.events) {
        if (event.type === 'evidenceAdded') store.getState().openEvidence(event.evidenceId);
      }
    }
  });
  return () => {
    unsubscribeBus();
    unsubscribeStore();
    activeDialogueNpcId = null;
  };
}
