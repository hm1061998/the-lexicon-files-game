export interface CaseSummary {
  readonly id: string;
  readonly title: string;
  readonly evidenceTotal: number;
  readonly initialObjective: {
    readonly id: string;
    readonly text: string;
  };
}

export interface UiStrings {
  readonly objectiveHeading: string;
  readonly caseFile: string;
  readonly interact: string;
  readonly pause: string;
  readonly paused: string;
  readonly resume: string;
}
