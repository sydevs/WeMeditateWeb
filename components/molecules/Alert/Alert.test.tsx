import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Alert } from './Alert'

describe('<Alert>', () => {
  it('renders the message with role="alert"', () => {
    const html = renderToStaticMarkup(<Alert>Something happened</Alert>)

    expect(html).toContain('role="alert"')
    expect(html).toContain('Something happened')
  })

  it('defaults to the info variant', () => {
    const html = renderToStaticMarkup(<Alert>Info</Alert>)

    expect(html).toContain('bg-teal-50')
  })

  it('applies variant styles', () => {
    expect(renderToStaticMarkup(<Alert variant="warning">w</Alert>)).toContain('bg-amber-50')
    expect(renderToStaticMarkup(<Alert variant="error">e</Alert>)).toContain('bg-red-50')
    expect(renderToStaticMarkup(<Alert variant="success">s</Alert>)).toContain('bg-green-50')
  })

  it('renders an optional title', () => {
    const html = renderToStaticMarkup(
      <Alert title="Heads up" variant="warning">
        Body text
      </Alert>,
    )

    expect(html).toContain('Heads up')
    expect(html).toContain('Body text')
  })

  it('renders a dismiss button only when onDismiss is provided', () => {
    const without = renderToStaticMarkup(<Alert>x</Alert>)

    expect(without).not.toContain('aria-label="Dismiss"')

    const withDismiss = renderToStaticMarkup(<Alert onDismiss={() => {}}>x</Alert>)

    expect(withDismiss).toContain('aria-label="Dismiss"')
  })
})
