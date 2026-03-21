/**
 * Merge sparse live preview payloads onto the last known good document.
 *
 * Payload's live preview messages can collapse populated relationships back to
 * scalar IDs. This preserves the richer server-fetched object when the relation
 * still points at the same document, while allowing real changes through.
 */

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date)
  )
}

function isRelationReference(value: unknown): value is string | number {
  return typeof value === 'string' || typeof value === 'number'
}

function isPopulatedRelation(value: unknown): value is { id: string | number } {
  return (
    isPlainObject(value) &&
    'id' in value &&
    isRelationReference(value.id)
  )
}

export function mergePreviewData<T>(
  baseData: T,
  incomingData: T | null | undefined,
  maxDepth: number = 3,
): T {
  if (!incomingData) {
    return baseData
  }

  if (!isPlainObject(baseData) || !isPlainObject(incomingData)) {
    return incomingData ?? baseData
  }

  return mergeRecursive(
    baseData as Record<string, unknown>,
    incomingData as Record<string, unknown>,
    0,
    maxDepth,
  ) as T
}

function mergeRecursive(
  base: Record<string, unknown>,
  overlay: Record<string, unknown>,
  currentDepth: number,
  maxDepth: number,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base }

  for (const key of Object.keys(overlay)) {
    const overlayValue = overlay[key]
    const baseValue = base[key]

    if (overlayValue === undefined) {
      continue
    }

    // Keep a populated relationship object when live preview only sends its ID.
    if (
      isPopulatedRelation(baseValue) &&
      isRelationReference(overlayValue) &&
      baseValue.id === overlayValue
    ) {
      result[key] = baseValue
      continue
    }

    if (
      isPlainObject(baseValue) &&
      isPlainObject(overlayValue) &&
      currentDepth < maxDepth
    ) {
      result[key] = mergeRecursive(baseValue, overlayValue, currentDepth + 1, maxDepth)
      continue
    }

    result[key] = overlayValue
  }

  return result
}
