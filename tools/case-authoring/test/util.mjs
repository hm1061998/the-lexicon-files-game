/** Only the findings that stop a build. */
export const errorsOf = (issues) => issues.filter((issue) => issue.level === 'error');
