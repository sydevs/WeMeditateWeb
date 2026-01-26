/**
 * Deep merge utility for PayloadCMS live preview data
 *
 * Merges liveData with initialData, preserving initialData values when liveData
 * properties are undefined. This handles cases where the live preview mergeData
 * fails (e.g., 403 auth errors) and returns incomplete data.
 */

/**
 * Check if a value is a plain object (not null, array, Date, etc.)
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date)
  )
}

/**
 * Recursively merges liveData with initialData, preserving initialData values
 * when liveData properties are undefined.
 *
 * @param initialData - The base data from server-side fetch
 * @param liveData - The live preview data (may have undefined values)
 * @param maxDepth - Maximum recursion depth (default: 3)
 * @returns Merged data with initialData values preserved where liveData is undefined
 *
 * @example
 * const merged = mergeData(
 *   { id: 1, title: 'Hello', nested: { url: 'https://...' } },
 *   { id: 1, title: undefined, nested: { url: undefined, newField: 'value' } }
 * )
 * // Result: { id: 1, title: 'Hello', nested: { url: 'https://...', newField: 'value' } }
 */
export function mergeData<T>(
  initialData: T,
  liveData: T | undefined | null,
  maxDepth: number = 3
): T {
  // Log inputs for debugging live preview data flow
  console.log('[mergeData] Input:', {
    hasInitialData: !!initialData,
    hasLiveData: !!liveData,
    liveDataIsNull: liveData === null,
    liveDataIsUndefined: liveData === undefined,
    areSameReference: initialData === liveData,
    initialDataId: (initialData as Record<string, unknown>)?.id,
    liveDataId: (liveData as Record<string, unknown>)?.id,
  })

  // If no liveData, return initialData
  if (!liveData) {
    console.log('[mergeData] No liveData, returning initialData')
    return initialData
  }

  // If either is not a plain object, prefer liveData (unless undefined)
  if (!isPlainObject(initialData) || !isPlainObject(liveData)) {
    console.log('[mergeData] Not plain objects, returning liveData or initialData')
    return liveData ?? initialData
  }

  const result = mergeRecursive(
    initialData as Record<string, unknown>,
    liveData as Record<string, unknown>,
    0,
    maxDepth
  ) as T

  // Log merge result for debugging
  console.log('[mergeData] Merged result:', {
    resultId: (result as Record<string, unknown>)?.id,
    resultTitle: (result as Record<string, unknown>)?.title,
    resultHasUrl: !!(result as Record<string, unknown>)?.url,
    resultHasFrames: !!(result as Record<string, unknown>)?.frames,
  })

  return result
}

/**
 * Internal recursive merge function
 */
function mergeRecursive(
  base: Record<string, unknown>,
  overlay: Record<string, unknown>,
  currentDepth: number,
  maxDepth: number
): Record<string, unknown> {
  // Start with all properties from base
  const result: Record<string, unknown> = { ...base }

  // Iterate over overlay properties
  for (const key of Object.keys(overlay)) {
    const overlayValue = overlay[key]
    const baseValue = base[key]

    // Skip undefined values in overlay - keep base value
    if (overlayValue === undefined) {
      continue
    }

    // If both are plain objects and we haven't exceeded max depth, merge recursively
    if (
      isPlainObject(overlayValue) &&
      isPlainObject(baseValue) &&
      currentDepth < maxDepth
    ) {
      result[key] = mergeRecursive(baseValue, overlayValue, currentDepth + 1, maxDepth)
    } else {
      // Otherwise, use overlay value (including null, arrays, primitives)
      result[key] = overlayValue
    }
  }

  return result
}
