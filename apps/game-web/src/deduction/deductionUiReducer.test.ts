import { expect,it } from 'vitest';
import { initialDeductionUi,deductionUiReducer } from './deductionUiReducer';
it('keeps selection across faces, enforces two facts, and reconciles stale ids',()=>{
 let s=deductionUiReducer(initialDeductionUi(),{type:'toggleFact',id:'a'});
 s=deductionUiReducer(s,{type:'toggleFact',id:'b'});s=deductionUiReducer(s,{type:'toggleFact',id:'c'});
 s=deductionUiReducer(s,{type:'selectFace',face:'timeline'});s=deductionUiReducer(s,{type:'selectEvent',id:'event'});s=deductionUiReducer(s,{type:'selectSlot',id:'slot'});
 s=deductionUiReducer(s,{type:'selectSuspect',id:'person'});s=deductionUiReducer(s,{type:'selectFace',face:'compare'});
 expect(s.selectedFactIds).toEqual(['a','b']);expect(s.eventId).toBe('event');expect(s.slotId).toBe('slot');expect(s.suspectId).toBe('person');
 s=deductionUiReducer(s,{type:'reconcile',facts:['b'],events:['event'],slots:['slot'],suspects:['person'],nodes:[]});
 expect(s.selectedFactIds).toEqual(['b']);expect(s.eventId).toBe('event');
});
