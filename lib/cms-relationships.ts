/**
 * Helpers for working with PayloadCMS relationship and upload fields,
 * which return either as a fully populated document or a bare id
 * (number or string), depending on the read depth and the document's
 * publish state.
 */

/** Narrows a relationship field to its populated document, not a bare id. */
export function isPopulated<T extends object = Record<string, unknown>>(
  value: unknown,
): value is T {
  return typeof value === 'object' && value !== null
}

/** Resolves a populated Image relationship to its URL, or undefined if unpopulated. */
export function populatedImageUrl(image: unknown): string | undefined {
  return isPopulated(image) && typeof image.url === 'string' ? image.url : undefined
}
