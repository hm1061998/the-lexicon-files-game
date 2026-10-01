import { useEffect,useState } from 'react';
import type { CaseDefinition,LanguageProfile,TranslationMode,UiStrings,VocabularyStage } from '@lexicon/shared-types';
import { resolveVocabularySources } from '../investigation/resolveVocabularySources';
export function NotebookVocabularyPage({definition,profile,strings,translationMode,onRevealTranslation}:{definition:CaseDefinition;profile?:LanguageProfile|undefined;strings:UiStrings;translationMode:TranslationMode;onRevealTranslation(id:string,contextId:string):void}):JSX.Element {
  const [selectedId,setSelectedId]=useState<string>();const [revealed,setRevealed]=useState<string>();
  useEffect(()=>setRevealed(undefined),[translationMode]);
  const words=definition.vocabulary.filter(w=>profile?.vocabulary[w.id]);
  const selected=words.find(w=>w.id===selectedId)??words[0];
  if(!selected)return <p className="notebook-empty">{strings.notebookEmptyVocabulary}</p>;
  const stageLabels:Record<VocabularyStage,string>={unknown:strings.vocabularyStageUnknown,seen:strings.vocabularyStageSeen,
    recognized:strings.vocabularyStageRecognized,understood:strings.vocabularyStageUnderstood,used:strings.vocabularyStageUsed,mastered:strings.vocabularyStageMastered};
  const progress=profile!.vocabulary[selected.id]!;
  const sources=resolveVocabularySources(definition,progress.contextsSeen);
  const translated=translationMode==='Beginner'||(translationMode==='Learning'&&revealed===selected.id);
  return <div className="notebook-spread"><section className="notebook-index" aria-label={strings.notebookVocabularyHeading}>
    <h3>{strings.notebookVocabularyHeading}</h3><ul className="notebook-word-list">{words.map(word=><li key={word.id}>
      <button type="button" aria-label={word.lemma} aria-pressed={word.id===selected.id} onClick={()=>{setSelectedId(word.id);setRevealed(undefined);}}>
        <strong>{word.lemma}</strong><em>{word.partOfSpeech}</em><span>{translationMode==='Beginner'?word.translationVi:word.definitionEn}</span>
      </button></li>)}</ul></section>
    <article className="notebook-detail notebook-word-detail"><header><h3>{selected.lemma}</h3><span className="notebook-person-status">{stageLabels[progress.stage]}</span></header>
      <p><em>{selected.partOfSpeech}</em></p><p>{selected.definitionEn}</p>
      {translated?<p className="notebook-word-translation">{selected.translationVi}</p>:translationMode==='Learning'&&progress.contextsSeen[0]?<button type="button" onClick={()=>{onRevealTranslation(selected.id,progress.contextsSeen[0]!);setRevealed(selected.id);}}>{strings.revealTranslation}</button>:null}
      <h4>{strings.notebookVocabularyExamples}</h4><ul className="notebook-examples">{selected.examples.map(example=><li key={example}>{example}</li>)}</ul>
      {sources.length>0&&<section className="notebook-source-note"><h4>{strings.notebookVocabularySources}</h4><ul>{sources.map(source=><li key={source}>{source}</li>)}</ul></section>}
    </article></div>;
}
