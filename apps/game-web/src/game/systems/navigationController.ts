import type { LogicalPoint } from './isometricProjection';
export interface NavigationController {
 replace(points:readonly LogicalPoint[]):void;
 cancel():void;
 direction(position:LogicalPoint,deltaMs:number):LogicalPoint|null;
 observeMovement(before:LogicalPoint,after:LogicalPoint,deltaMs:number):void;
 isActive():boolean;
}
/** Scene-local transient route; no interaction callback or persistence. */
export function createNavigationController():NavigationController {
 let points:readonly LogicalPoint[]=[],index=0,stuckMs=0;
 const cancel=()=>{points=[];index=0;stuckMs=0;};
 return {
  replace(next){points=next;index=0;stuckMs=0;},cancel,
  isActive:()=>index<points.length,
  direction(position,_deltaMs){
   while(index<points.length){const p=points[index]!,u=p.u-position.u,v=p.v-position.v;
    if(Math.hypot((u-v)*64,(u+v)*32)<=2){index++;continue;}
    return {u,v};
   }cancel();return null;
  },
  observeMovement(before,after,deltaMs){
   if(index>=points.length)return;
   if(Math.hypot(after.u-before.u,after.v-before.v)<1e-6)stuckMs+=Math.max(0,Math.min(50,deltaMs));else stuckMs=0;
   if(stuckMs>=500)cancel();
  },
 };
}
