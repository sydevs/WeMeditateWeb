/**
 * Translation keys for each error category.
 *
 * These used to be English literals in `server/error-utils.ts`, returned by
 * `getUserFriendlyErrorMessage(error)` — which re-classified the error from
 * its message text. `ErrorFallback` therefore showed the UNKNOWN body under
 * the "Content Not Found" title on every 404, because the synthetic `Error`
 * the error page throws carries no recognisable 404 wording.
 *
 * Keying off the resolved `ErrorType` instead fixes that: the title and the
 * body now always describe the same thing.
 */

import { ErrorType } from '../server/error-utils'
import type { TranslationKey } from './i18n'

/**
 * The key stem each category uses. One map, not two: a title and its body
 * falling out of sync is the failure this module exists to prevent, so
 * they are built from the same stem rather than listed separately.
 */
const STEM_BY_TYPE = {
  [ErrorType.NETWORK]: 'network',
  [ErrorType.SERVER]: 'server',
  [ErrorType.CLIENT]: 'not_found',
  [ErrorType.UNKNOWN]: 'unknown',
} as const satisfies Record<ErrorType, string>

/** The heading key for an error category. */
export function errorTitleKey(type: ErrorType): TranslationKey {
  return `errors.general.${STEM_BY_TYPE[type]}_title`
}

/** The body-copy key for an error category. */
export function errorMessageKey(type: ErrorType): TranslationKey {
  return `errors.general.${STEM_BY_TYPE[type]}_message`
}
