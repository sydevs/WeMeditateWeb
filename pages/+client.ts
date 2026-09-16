/**
 * The client entry.
 *
 * Its first act is to take the live-preview token out of `location.href`,
 * before anything in the page can read it.
 *
 * ⚠ **The guarantee is not this file's line order.** It used to be: the two
 * calls sat ABOVE their own imports and relied on ESM hoisting, with a comment
 * as the only thing stopping an import-sorting rule from silently undoing it.
 * Now each reader is responsible for its own precondition —
 * `sentryBrowserConfig` scrubs before it initialises Sentry, and
 * `pages/+Head.tsx` omits the analytics script entirely under a preview — so
 * this file is written in ordinary order and nothing breaks if it is shuffled.
 *
 * The call below is still the one that must not be deleted: it is what scrubs
 * when Sentry is not what reads the URL. `scrubTokenFromLocation` early-returns
 * on a URL with no token, so calling it here and again from Sentry is free.
 */

import { scrubTokenFromLocation } from '../lib/live-preview/token-url'
import { sentryBrowserConfig } from '../sentry.browser.config'

scrubTokenFromLocation()
sentryBrowserConfig()
