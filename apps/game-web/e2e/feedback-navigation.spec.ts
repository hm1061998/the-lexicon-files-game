import {expect,test,type Page} from '@playwright/test';
import {scenePoint} from './sceneTestData';
async function worldClick(page:Page,point:{x:number;y:number}) {
 await page.waitForTimeout(350);
 const view=await page.evaluate(()=>window.__lexiconDebug!.cameraState().view);
 const box=(await page.locator('canvas').boundingBox())!;
 await page.mouse.click(box.x+(point.x-view.x)/view.width*box.width,box.y+(point.y-view.y)/view.height*box.height);
}
test('arrow keys match WASD and HUD controls work with mouse',async({page})=>{
 await page.goto('/');await page.waitForFunction(()=>window.__lexiconDebug!==undefined);
 const travel=async(keys:string[])=>{
  await page.evaluate(()=>window.__lexiconDebug!.teleportLogical(10,9));
  for(const key of keys)await page.keyboard.down(key);
  await page.waitForTimeout(250);
  for(const key of keys)await page.keyboard.up(key);
  return page.evaluate(()=>window.__lexiconDebug!.logicalPlayer()!);
 };
 const wasd=await travel(['d']),arrow=await travel(['ArrowRight']),paired=await travel(['d','ArrowRight']);
 expect(Math.abs(wasd.u-arrow.u)).toBeLessThan(.3);expect(Math.abs(wasd.u-paired.u)).toBeLessThan(.3);
 await page.getByRole('button',{name:'Tạm dừng',exact:false}).click();
 await expect(page.getByLabel('Chế độ dịch')).toBeVisible();
});
test('click floor navigates and keyboard interrupts without resuming',async({page})=>{
 await page.goto('/');await page.waitForFunction(()=>window.__lexiconDebug!==undefined);
 await page.evaluate(()=>window.__lexiconDebug!.teleportLogical(10,9));
 await worldClick(page,{x:832+(11-9)*64,y:180+(11+9)*32});
 await expect.poll(async()=>{const p=await page.evaluate(()=>window.__lexiconDebug!.logicalPlayer()!);return Math.hypot((p.u-11)*64,(p.v-9)*64);}).toBeLessThan(4);
 await worldClick(page,{x:832+(13-9)*64,y:180+(13+9)*32});
 await page.keyboard.press('ArrowLeft');
 const p=await page.evaluate(()=>window.__lexiconDebug!.logicalPlayer()!);
 await page.waitForTimeout(700);
 const after=await page.evaluate(()=>window.__lexiconDebug!.logicalPlayer()!);
 expect(Math.hypot(after.u-p.u,after.v-p.v)).toBeLessThan(.1);
});
test('distant NPC needs a second click after approach',async({page})=>{
 await page.goto('/');await page.waitForFunction(()=>window.__lexiconDebug!==undefined);
 const anchor=scenePoint('main_office','anna');
 await page.evaluate(()=>window.__lexiconDebug!.teleportLogical(8,4.8));
 await worldClick(page,{x:anchor.x,y:anchor.y-35});
 await expect(page.getByRole('dialog')).toHaveCount(0);
 await expect.poll(()=>page.evaluate(()=>window.__lexiconDebug!.nearby()),{timeout:12000}).toBe('anna');
 await expect(page.getByRole('dialog')).toHaveCount(0);
 await worldClick(page,{x:anchor.x,y:anchor.y-35});
 await expect(page.getByRole('dialog')).toBeVisible();
});

