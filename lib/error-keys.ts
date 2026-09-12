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

const TITLE_KEY_BY_TYPE: Record<ErrorType, TranslationKey> = {
  [ErrorType.NETWORK]: 'errors.general.network_title',
  [ErrorType.SERVER]: 'errors.general.server_title',
  [ErrorType.CLIENT]: 'errors.general.not_found_title',
  [ErrorType.UNKNOWN]: 'errors.general.unknown_title',
}

const MESSAGE_KEY_BY_TYPE: Record<ErrorType, TranslationKey> = {
  [ErrorType.NETWORK]: 'errors.general.network_message',
  [ErrorType.SERVER]: 'errors.general.server_message',
  [ErrorType.CLIENT]: 'errors.general.not_found_message',
  [ErrorType.UNKNOWN]: 'errors.general.unknown_message',
}

/** The heading key for an error category. */
export function errorTitleKey(type: ErrorType): TranslationKey {
  return TITLE_KEY_BY_TYPE[type]
}

/** The body-copy key for an error category. */
export function errorMessageKey(type: ErrorType): TranslationKey {
  return MESSAGE_KEY_BY_TYPE[type]
}
