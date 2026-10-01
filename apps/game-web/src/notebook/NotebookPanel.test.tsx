import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createCaseState } from '@lexicon/game-core';
import { loadCaseDefinition, loadUiStrings } from '@lexicon/game-content';
import { createInitialLanguageProfile } from '@lexicon/learning-engine';
import { NotebookPanel } from './NotebookPanel';
const definition=loadCaseDefinition('case-001');const strings=loadUiStrings('vi');
const initial=createCaseState(definition);
const props={caseDefinition:definition,caseState:initial,strings,onSelectTab:()=>{},onClose:()=>{},onOpenDeduction:()=>{}};
describe('NotebookPanel reading pages',()=>{
 it('offers four reading tabs and routes all reasoning actions to the board',()=>{
  const html=renderToStaticMarkup(<NotebookPanel {...props} caseState={{...initial,objectiveStatuses:{...initial.objectiveStatuses,submit_your_conclusion:'active'}}} activeTab="timeline"/>);
  expect(html).toContain(strings.openDeductionBoard);
  expect(html).not.toContain(strings.conclusionSubmit);
  expect(html).not.toContain(strings.contradictionSubmit);
  expect(html).not.toContain(strings.timelinePlace);
  for(const label of [strings.people,strings.evidence,strings.vocabulary,strings.timeline])expect(html).toContain(label);
 });
 it('shows only collected evidence and one selected description',()=>{
  const html=renderToStaticMarkup(<NotebookPanel {...props} caseState={{...initial,evidenceIds:['meeting_minutes','leo_phone_recording']}} activeTab="evidence"/>);
  expect(html).toContain('/assets/evidence/evidence_meeting_minutes.png');
  expect(html).toContain('A phone recording Leo left at 20:29.');
  expect(html).not.toContain('vocabulary-word');
  expect(html).not.toContain('Security Access Log');
  expect(html).toContain(strings.evidenceReview);
 });
 it('keeps description and review action if evidence artwork is absent',()=>{
  const html=renderToStaticMarkup(<NotebookPanel {...props} caseDefinition={{...definition,evidences:definition.evidences.map(e=>({...e,image:undefined}))}} caseState={{...initial,evidenceIds:['meeting_minutes']}} activeTab="evidence"/>);
  expect(html).toContain('Meeting Minutes');expect(html).toContain(strings.evidenceReview);expect(html).toContain('vocabulary-word');
 });
 it('records only correctly placed timeline events',()=>{
  const empty=renderToStaticMarkup(<NotebookPanel {...props} activeTab="timeline"/>);
  expect(empty).not.toContain('21:05');expect(empty).not.toContain('The report was discovered missing.');
  const html=renderToStaticMarkup(<NotebookPanel {...props} activeTab="timeline" caseState={{...initial,timelineEventIds:['report_missing_21_05']}}/>);
  expect(html).toContain('21:05');expect(html).toContain('The report was discovered missing.');expect(html).toContain('Case introduction');
 });
 it('shows recorded names but mounts only the selected person statements',()=>{
  const html=renderToStaticMarkup(<NotebookPanel {...props} activeTab="people" caseState={{...initial,flags:{anna_q1_read:true,leo_q1_read:true}}}/>);
  expect(html).toContain('Anna Reed');expect(html).toContain('Leo Tran');
  expect(html).not.toContain(definition.dialogues.find(t=>t.npcId==='leo')!.nodes.find(n=>n.id==='answer1')!.text);
  expect(html).toContain('notebook-statement-list');
 });
 it('labels vocabulary sources with authored names and actual stages',()=>{
  const profile=createInitialLanguageProfile();const word=definition.vocabulary[0]!;
  profile.vocabulary[word.id]={vocabularyId:word.id,stage:'seen',encounterCount:1,correctRecognitionCount:0,incorrectRecognitionCount:0,lastSeenAt:'2026-10-01T00:00:00Z',contextsSeen:['evidence:meeting_minutes:description','stale:unknown']};
  const html=renderToStaticMarkup(<NotebookPanel {...props} activeTab="vocabulary" profile={profile}/>);
  expect(html).toContain(word.lemma);expect(html).toContain(word.definitionEn);expect(html).toContain(strings.vocabularyStageSeen);expect(html).toContain('Meeting Minutes');
  expect(html).not.toContain('evidence:meeting_minutes:description');expect(html).not.toContain('stale:unknown');
 });
 it.each(['people','evidence','vocabulary'] as const)('shows empty state on %s without hidden records',tab=>{
  const html=renderToStaticMarkup(<NotebookPanel {...props} activeTab={tab}/>);
  expect(html).not.toContain('Anna Reed');expect(html).not.toContain('Meeting Minutes');
  expect(html).toContain(tab==='people'?strings.notebookEmptyPeople:tab==='evidence'?strings.evidenceEmpty:strings.notebookEmptyVocabulary);
 });
});
