/**
 * Splits a SahajCloud textarea into paragraphs: every run of line breaks
 * starts one, each is trimmed, and an empty one drops.
 *
 * The text-box organisms (`ContentTextBox`, `ContentOverlay`,
 * `OrnateTextBox`) all render through it, one `<p>` per paragraph, so a break
 * reads the same whichever style an editor picks (#286). A single break counts
 * because editors use one to start a new tip or step.
 */
export function toParagraphs(text: string): string[] {
  return text
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}
