import type {CaseDefinition,GameState} from '@lexicon/shared-types';import type {InvestigationLearningProps} from '../investigation/RecordedStatements';import {ReadDocument,textBlock} from '../investigation/pagination/ReadDocument';
export function DeductionCaseFile({definition,state,learning}:{definition:CaseDefinition;state:GameState;learning:InvestigationLearningProps}){
 const s=learning.strings;const blocks=[textBlock('case:title',definition.title),textBlock('case:objective',s.objectiveHeading),...definition.objectives.filter(o=>state.objectiveStatuses[o.id]==='active').map(o=>textBlock('objective:'+o.id,o.text)),textBlock('case:instructions',s.deductionInstructions)];return <ReadDocument blocks={blocks} learning={learning} label={s.investigationCaseFile}/>;
}
