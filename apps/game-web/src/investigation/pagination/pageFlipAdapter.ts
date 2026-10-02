export function createPageFlipAdapter(host:HTMLElement,reducedMotion:boolean) {
 let timer:ReturnType<typeof setTimeout>|undefined;let animation:Animation|undefined;let disposed=false;
 const cancel=()=>{clearTimeout(timer);animation?.cancel();animation=undefined;};
 return {turn(direction:'forward'|'backward',done:()=>void){if(disposed)return;cancel();if(reducedMotion){done();return;}
  animation=host.animate?.([{opacity:0,transform:`perspective(1400px) rotateY(${direction==='forward'?12:-12}deg)`,clipPath:'inset(0 0 0 96%)'},{opacity:.9,offset:.3,transform:'perspective(1400px) rotateY(-12deg)',clipPath:'inset(0 0 0 28%)'},{opacity:0,transform:'perspective(1400px) rotateY(-65deg)',clipPath:'inset(0 96% 0 0)'}],{duration:550,easing:'cubic-bezier(.22,.7,.2,1)',fill:'none'});
  timer=setTimeout(()=>{cancel();if(!disposed)done();},550);
 },resize(width:number,height:number){host.style.width=`${width}px`;host.style.height=`${height}px`;},destroy(){disposed=true;cancel();}};
}
