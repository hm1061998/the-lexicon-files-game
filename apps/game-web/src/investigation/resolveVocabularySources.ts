import type { CaseDefinition } from '@lexicon/shared-types';
export function resolveVocabularySources(definition: CaseDefinition, contextIds: readonly string[]): readonly string[] {
  const names = contextIds.flatMap(id => {
    const [kind,owner,node,field,...extra] = id.split(':');
    if (kind==='evidence' && node==='description' && field===undefined) {
      const evidence=definition.evidences.find(e=>e.id===owner); return evidence ? [evidence.name] : [];
    }
    if (kind==='dialogue' && field==='text' && extra.length===0) {
      const tree=definition.dialogues.find(t=>t.id===owner && t.nodes.some(n=>n.id===node));
      const npc=definition.npcs.find(n=>n.id===tree?.npcId);return npc ? [npc.name] : [];
    }
    return [];
  });
  return [...new Set(names)];
}
