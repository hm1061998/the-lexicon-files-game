import { expect,it } from 'vitest';
import { createNotebookReadingState, selectNotebookReading } from './notebookReadingState';
it('preserves same-case reading and resets selections for a different case',()=>{
 const state=createNotebookReadingState('case-a');state.tabs.people.selectedId='person';state.tabs.people.detailAnchor={blockId:'statement',offset:20};
 expect(selectNotebookReading(state,'case-a')).toBe(state);
 expect(selectNotebookReading(state,'case-b').tabs.people.selectedId).toBeNull();
 expect(selectNotebookReading(state,'case-b').tabs.people.detailAnchor).toBeNull();
});
