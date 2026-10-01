import { test, expect } from '@playwright/test';
import { definition, strings, seedInvestigation } from './investigationFixture';
import { saved } from './journeyHelpers';
test.setTimeout(90_000);
test('notebook selects one dossier and one evidence without changing case progress',async({page})=>{
  await seedInvestigation(page,{flags:{anna_q1_read:true,leo_q1_read:true},evidenceIds:['meeting_minutes','leo_phone_recording']});
  const before=await saved(page);
  await page.keyboard.press('j');const notebook=page.locator('.notebook-panel');
  expect((await notebook.boundingBox())!.width).toBeGreaterThan(700);
  await expect(notebook.locator('.notebook-tabs button')).toHaveCount(4);
  await notebook.getByRole('button',{name:strings.people,exact:true}).click();
  await expect(notebook.locator('.notebook-person')).toHaveCount(1);
  await notebook.getByRole('button',{name:'Leo Tran',exact:true}).click();
  await expect(notebook.locator('.notebook-person h3')).toHaveText('Leo Tran');
  await expect(notebook.locator('.notebook-statement-list')).toContainText(definition.dialogues.find(t=>t.npcId==='leo')!.nodes.find(n=>n.id==='answer1')!.text);
  await notebook.getByRole('button',{name:strings.evidence,exact:true}).click();
  await notebook.getByRole('button',{name:"Leo's Phone Recording",exact:true}).click();
  await expect(notebook.locator('.notebook-evidence-detail')).toContainText('A phone recording Leo left at 20:29.');
  expect((await saved(page))?.state).toEqual(before?.state);
  await notebook.getByRole('button',{name:strings.close,exact:true}).click();
  await expect(page.locator('.game-root > [tabindex="-1"]')).toBeFocused();
  await expect(page.locator('canvas')).toHaveCount(1);
});

test('board is separate and supports atomic switching with native keyboard focus',async({page})=>{
 await seedInvestigation(page,{flags:{anna_q1_read:true,leo_q1_read:true},evidenceIds:['meeting_minutes']});
 const before=await saved(page);await page.keyboard.press('b');
 const board=page.locator('.deduction-board');await expect(board).toBeVisible();
 await expect(page.locator('.notebook-panel')).toHaveCount(0);
 await expect(board.getByRole('button',{name:strings.close,exact:true})).toBeFocused();
 await board.getByRole('button',{name:strings.openNotebookFromBoard,exact:true}).click();
 await expect(board).toHaveCount(0);await expect(page.locator('.notebook-panel')).toBeVisible();
 await page.keyboard.press('b');await expect(board).toBeVisible();
 await page.keyboard.press('Escape');await expect(board).toHaveCount(0);
 await expect(page.locator('.game-root > [tabindex="-1"]')).toBeFocused();
 expect((await saved(page))?.state).toEqual(before?.state);await expect(page.locator('canvas')).toHaveCount(1);
});
