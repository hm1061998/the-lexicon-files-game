export class ContentValidationError extends Error {
  readonly source: string;
  readonly issues: string[];

  constructor(source: string, issues: string[]) {
    super(`Content validation failed for ${source}:\n${issues.join('\n')}`);
    this.name = 'ContentValidationError';
    this.source = source;
    this.issues = issues;
  }
}
