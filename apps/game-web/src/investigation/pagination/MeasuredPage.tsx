import { useId, useRef, type ReactNode } from 'react';
import type { UiStrings } from '@lexicon/shared-types';
import type { PageAnchor, PageFragment, ReaderBlock } from './pageTypes';
import { useMeasuredPages } from './useMeasuredPages';
import { PageControls } from './PageControls';
import './pagination.css';
export function MeasuredPage({blocks,anchor=null,onAnchorChange,renderFragment,renderMeasurement,strings,controlsLabel,revision='',onPageTurn,empty}: {blocks:readonly ReaderBlock[];anchor?:PageAnchor|null;onAnchorChange?:(a:PageAnchor)=>void;renderFragment:(f:PageFragment)=>ReactNode;renderMeasurement:(f:PageFragment)=>ReactNode;strings:UiStrings;controlsLabel:string;revision?:string;onPageTurn?:()=>void;empty?:ReactNode}) {
 const viewport=useRef<HTMLDivElement>(null),measurement=useRef<HTMLDivElement>(null);const id=useId();
 const {layout,ready,error,pageIndex,goToPage}=useMeasuredPages({blocks,viewportRef:viewport,measureRef:measurement,revision,anchor,onAnchorChange});
 const change=(n:number)=>{if(n===pageIndex||n<0||n>=layout.pages.length)return;goToPage(n);onPageTurn?.();};
 return <section className="measured-page" aria-label={controlsLabel} onKeyDown={e=>{if(e.key!=='PageDown'&&e.key!=='PageUp')return;if(e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||(e.target as HTMLElement).closest('input,textarea,[contenteditable=true],[role=dialog].investigation-vocabulary-popover'))return;e.preventDefault();e.stopPropagation();change(pageIndex+(e.key==='PageDown'?1:-1));}}>
 <div ref={viewport} className="page-viewport" id={id} data-page-index={pageIndex}>
 {!ready?<p>{strings.pagePreparing}</p>:error?<p role="alert">{error}</p>:blocks.length===0?empty:layout.pages[pageIndex]?.map(f=><div className="page-fragment" data-block-id={f.blockId} data-start={f.start} data-end={f.end} key={`${f.blockId}:${f.start}`}>{renderFragment(f)}</div>)}
 </div>
 <div ref={measurement} className="page-measurement" aria-hidden="true">{blocks.map(b=>{const f={blockId:b.id,start:0,end:b.kind==='text'?b.text.length:0,spans:b.kind==='text'?b.spans:[]};return <div className="page-fragment" data-measure-id={b.id} key={b.id}>{renderMeasurement(f)}</div>;})}</div>
 <PageControls index={pageIndex} count={layout.pages.length} label={controlsLabel} strings={strings} onChange={change}/>
 </section>;
}
