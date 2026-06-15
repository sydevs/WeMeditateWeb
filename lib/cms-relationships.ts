/**
 * Helpers for working with PayloadCMS relationship/upload fields, which come
 * back either as a fully populated document or a bare id (number/string)
 * depending on the read depth and the document's publish state.
 */

/** Narrow a relationship field to its populated document (vs. a bare id). */
export function isPopulated<T extends object = Record<string, unknown>>(
  value: unknown,
): value is T {
  return typeof value === 'object' && value !== null
}

/** Resolve a populated Image relationship to its URL (undefined if unpopulated). */
export function populatedImageUrl(image: unknown): string | undefined {
  return isPopulated(image) && typeof image.url === 'string' ? image.url : undefined
}
