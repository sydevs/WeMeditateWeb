/**
 * Pure helpers for choosing which background-music track plays in the
 * MeditationPlayer. Kept separate from the component so the random-pick and
 * no-immediate-repeat logic can be unit-tested deterministically (the optional
 * `rng` defaults to `Math.random` but is injected as a stub in tests).
 *
 * `rng` must return a value in [0, 1) — the same contract as `Math.random`.
 */

/**
 * Pick a random index in `[0, length)`. Returns `0` for an empty or single-item
 * list (nothing meaningful to randomize).
 */
export function pickRandomIndex(length: number, rng: () => number = Math.random): number {
  if (length <= 1) return 0

  return Math.floor(rng() * length)
}

/**
 * Pick a random index in `[0, length)` that differs from `current` whenever the
 * list has more than one track — so shuffling never immediately repeats the
 * track that is already playing. Returns `0` for a single-item or empty list.
 *
 * Works by picking uniformly over the `length - 1` *other* indices and skipping
 * past `current`, so every other track is equally likely and `current` is never
 * returned.
 */
export function pickNextRandomIndex(
  length: number,
  current: number,
  rng: () => number = Math.random,
): number {
  if (length <= 1) return 0
  const offset = Math.floor(rng() * (length - 1))

  return offset < current ? offset : offset + 1
}
