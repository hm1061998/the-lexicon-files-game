import { useMemo, type ReactNode } from 'react';
import type { PageAnchor, PageFragment, ReaderBlock } from './pageTypes';
import { MeasuredPage } from './MeasuredPage';import { slicePageText } from './splitPageText';
import { VocabularyText } from '../../vocabulary/VocabularyText';
import type { InvestigationLearningProps } from '../RecordedStatements';
export function textBlock(id:string,text:string,contextId:string|null=null,spans:Extract<ReaderBlock,{kind:'text'}>['spans']=[]):ReaderBlock {return {kind:'text',id,text,contextId,spans};}
export function ReadDocument({blocks,fixed={},anchor=null,onAnchorChange,label,learning,onPageTurn,revision='',empty}:{blocks:readonly ReaderBlock[];fixed?:Readonly<Record<string,ReactNode>>;anchor?:PageAnchor|null;onAnchorChange?:((a:PageAnchor)=>void)|undefined;label:string;learning:InvestigationLearningProps;onPageTurn?:(()=>void)|undefined;revision?:string;empty?:ReactNode}) {
 const render=(f:PageFragment,passive:boolean)=>{const b=blocks.find(b=>b.id===f.blockId);if(!b)return null;if(b.kind==='fixed')return fixed[b.id]??null;
  return <ReaderTextFragment block={b} fragment={f} passive={passive} learning={learning}/>;
 };
 return <MeasuredPage blocks={blocks} anchor={anchor} onAnchorChange={onAnchorChange} renderFragment={f=>render(f,false)} renderMeasurement={f=>render(f,true)} strings={learning.strings} controlsLabel={label} revision={revision} onPageTurn={onPageTurn} empty={empty}/>;
}

function ReaderTextFragment({block,fragment,passive,learning}:{block:Extract<ReaderBlock,{kind:'text'}>;fragment:PageFragment;passive:boolean;learning:InvestigationLearningProps}) {
 const spansKey=JSON.stringify(block.spans);const {text,contextId}=block;const {start,end}=fragment;
 const part=useMemo(()=>slicePageText({kind:'text',id:'fragment',text,contextId,spans:JSON.parse(spansKey)},start,end),[text,contextId,spansKey,start,end]);
 const cls=`page-text ${block.spans.length?'has-vocabulary':''} ${block.id.endsWith(':title')?'page-title':''} ${block.id.includes(':statement:')?'notebook-statement-list':''}`;
 const Tag=block.id.endsWith(':title')?'h3':'p';return <Tag className={cls} data-measure-text={passive?'true':undefined}>{!passive&&part.contextId?<VocabularyText text={part.text} spans={part.spans} contextId={part.contextId} mode={learning.translationMode} {...learning}/>:part.text}</Tag>;
}
