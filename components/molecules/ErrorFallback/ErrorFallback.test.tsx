/**
 * Proves the status-page link is the atom's anchor, not a hand-written one.
 *
 * `isSafeHttpUrl` at the call site still decides whether the link renders at
 * all — the atom would render the words inert, and an error page offering a
 * dead status link is worse than one offering none. What the atom owns is
 * what the link announces once it does render.
 */

import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { anchorFor } from '../../../tests/_helpers/markup'
import { ErrorType } from '../../../server/error-utils'
import { ErrorFallback } from './ErrorFallback'

const STATUS_URL = 'https://status.example.com'

const render = (statusPageUrl: string) =>
  renderToStaticMarkup(
    <ErrorFallback
      error={new Error('upstream exploded')}
      errorType={ErrorType.SERVER}
      statusPageUrl={statusPageUrl}
    />,
  )

describe('<ErrorFallback> status-page link', () => {
  it('announces the new tab it opens', () => {
    const html = render(STATUS_URL)

    expect(anchorFor(html, STATUS_URL)).toContain('target="_blank"')
    expect(html).toContain('(opens in new tab)')
  })

  it('keeps its own colours, and takes the atom’s focus ring', () => {
    const anchor = anchorFor(render(STATUS_URL), STATUS_URL)

    expect(anchor).toContain('text-teal-600')
    expect(anchor).toContain('focus-ring')
    expect(anchor).toContain('rel="noopener noreferrer"')
  })

  it('renders no link at all for a scheme the call site refuses', () => {
    const html = render('javascript:alert(1)')

    expect(html).toContain('Service Temporarily Unavailable')
    expect(html).not.toContain('javascript:')
    expect(html).not.toContain('status page')
  })
})
