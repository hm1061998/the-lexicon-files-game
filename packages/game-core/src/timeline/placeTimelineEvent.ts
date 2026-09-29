import type { CaseDefinition, GameState, TimelinePlacementResult } from '@lexicon/shared-types';

export function placeTimelineEvent(
  definition: CaseDefinition,
  state: GameState,
  eventId: string,
  slotId: string,
): TimelinePlacementResult {
  const event = definition.timeline.events.find((item) => item.id === eventId);
  if (!event) return { ok: false, state, error: { code: 'unknownTimelineEvent', id: eventId } };

  const slotExists = definition.timeline.slots.some((slot) => slot.id === slotId);
  if (!slotExists) return { ok: false, state, error: { code: 'unknownTimelineSlot', id: slotId } };

  if (
    event.availability.type === 'requiresFacts' &&
    !event.availability.factIds.every((id) => state.discoveredFactIds.includes(id))
  ) {
    return { ok: false, state, error: { code: 'timelineEventUnavailable', id: eventId } };
  }

  const correct = event.slotId === slotId;
  if (!correct || state.timelineEventIds.includes(eventId)) {
    return { ok: true, correct, state };
  }

  return {
    ok: true,
    correct: true,
    state: { ...state, timelineEventIds: [...state.timelineEventIds, eventId] },
  };
}
