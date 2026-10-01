import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import type { CaseDefinition, GameState, UiStrings } from '@lexicon/shared-types';
import { createCaseState } from '../../../packages/game-core/src/case/createCaseState';
import { openWorld } from './journeyHelpers';
const content=(file:string)=>JSON.parse(readFileSync(new URL('../../../packages/game-content/cases/case-001/'+file,import.meta.url),'utf8')) as object;
export const definition={...content('case.json'),...content('objectives.json'),...content('facts.json'),...content('npcs.json'),...content('dialogues.json'),...content('evidences.json'),...content('contradictions.json'),...content('vocabulary.json'),scenes:[content('scenes/main_office.json')],listeningTasks:[]} as CaseDefinition;
export const strings=JSON.parse(readFileSync(new URL('../../../packages/game-content/ui/vi.json',import.meta.url),'utf8')) as UiStrings;
export async function seedInvestigation(page:Page, patch:Partial<GameState>={}):Promise<void> {
  const state={...createCaseState(definition),...patch};
  await page.goto('/@vite/env');
  await page.evaluate(async state=>{
    const db=await new Promise<IDBDatabase>((resolve,reject)=>{
      const request=indexedDB.open('lexicon-game-saves',1);
      request.onupgradeneeded=()=>{request.result.createObjectStore('saves');request.result.createObjectStore('backups',{autoIncrement:true});};
      request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
    });
    await new Promise<void>((resolve,reject)=>{
      const tx=db.transaction('saves','readwrite');tx.objectStore('saves').put({schemaVersion:4,caseId:state.caseId,activeSceneId:'main_office',state,updatedAt:Date.now()},state.caseId);
      tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);
    });db.close();
  },state);
  await openWorld(page);
}
