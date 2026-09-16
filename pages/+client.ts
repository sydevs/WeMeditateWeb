// ⚠ Order matters, and it is the reverse of how it reads. ESM hoists both
// imports above the calls, so the scrub runs at module evaluation — before
// Plausible's deferred script executes and reads `location.href`.
scrubAddressBar()
sentryBrowserConfig()
import { scrubAddressBar } from '../lib/live-preview/token-url'
import { sentryBrowserConfig } from '../sentry.browser.config'
