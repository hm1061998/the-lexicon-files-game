import type { CaseDefinition, GameState } from '@lexicon/shared-types';
import { selectNotebookPeople } from '../notebook/selectNotebookPeople';

export interface InvestigationRelationship { readonly from: string; readonly to: string }
export function selectInvestigationView(definition: CaseDefinition, state: GameState) {
  const people = selectNotebookPeople(definition, state);
  const evidence = definition.evidences.filter(e => state.evidenceIds.includes(e.id));
  const facts = definition.facts.filter(f => state.discoveredFactIds.includes(f.id));
  const relationships: InvestigationRelationship[] = [];
  const add = (from: string, to: string) => {
    if (!relationships.some(r => r.from === from && r.to === to)) relationships.push({from,to});
  };
  for (const item of evidence) for (const id of item.relatedNpcIds ?? []) {
    if (people.some(p => p.npc.id === id)) add(`evidence:${item.id}`,`person:${id}`);
  }
  for (const fact of facts) {
    for (const id of fact.sourceEvidenceIds) if (evidence.some(e => e.id === id))
      add(`fact:${fact.id}`,`evidence:${id}`);
    for (const id of fact.sourceDialogueIds ?? []) {
      const tree = definition.dialogues.find(t => t.id === id);
      if (tree && people.some(p => p.npc.id === tree.npcId)) add(`fact:${fact.id}`,`person:${tree.npcId}`);
    }
  }
  const availableEvents = definition.timeline.events.filter(event =>
    !state.timelineEventIds.includes(event.id) && (event.availability.type === 'availableFromStart' ||
      event.availability.factIds.every(id => state.discoveredFactIds.includes(id))))
    .map(({id,text,location,source,confidence})=>({id,text,location,source,confidence}));
  const placedEvents = definition.timeline.slots.flatMap(slot => definition.timeline.events
    .filter(event => event.slotId === slot.id && state.timelineEventIds.includes(event.id))
    .map(({id,text,location,source})=>({id,text,location,source,time:slot.time})));
  const availableContradictions = definition.contradictions.filter(c =>
    !state.contradictionIds.includes(c.id) && c.factIds.every(id => state.discoveredFactIds.includes(id)))
    .map(({id})=>({id}));
  const confirmedContradictions = definition.contradictions.filter(c=>state.contradictionIds.includes(c.id));
  const conclusionAvailable = !!definition.conclusion &&
    state.objectiveStatuses[definition.conclusion.objectiveId] === 'active' && state.flags.case_closed !== true;
  const suspects = (definition.conclusion?.suspectNpcIds ?? []).flatMap(id => {
    const npc=definition.npcs.find(n=>n.id===id);return npc ? [{id,name:npc.name}] : [];
  });
  return {people,evidence,facts,relationships,availableEvents,placedEvents,availableContradictions,
    confirmedContradictions,conclusionAvailable,suspects};
}
export type InvestigationView = ReturnType<typeof selectInvestigationView>;
