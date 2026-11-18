/**
 * Where the axe gate leaves its per-target counts.
 *
 * Spelled once, because the spec writes the file and `scripts/a11y-summary.mjs`
 * reads it from a CI step; two spellings would make the summary silently empty
 * rather than wrong.
 */
export const A11Y_REPORT_PATH = 'a11y-report.json'
