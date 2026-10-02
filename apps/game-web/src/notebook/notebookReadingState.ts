import type { NotebookTab } from '../state/gameStore';
import type { PageAnchor } from '../investigation/pagination/pageTypes';
export type NotebookReadingState = {
  caseId: string;
  tabs: Record<
    NotebookTab,
    {
      selectedId: string | null;
      view: 'contents' | 'detail';
      contentsAnchor: PageAnchor | null;
      detailAnchor: PageAnchor | null;
    }
  >;
};
export function createNotebookReadingState(caseId: string): NotebookReadingState {
  return {
    caseId,
    tabs: Object.fromEntries(
      ['people', 'evidence', 'vocabulary', 'timeline'].map((tab) => [
        tab,
        { selectedId: null, view: 'contents', contentsAnchor: null, detailAnchor: null },
      ]),
    ) as NotebookReadingState['tabs'],
  };
}
export function selectNotebookReading(state: NotebookReadingState, caseId: string) {
  return state.caseId === caseId ? state : createNotebookReadingState(caseId);
}
