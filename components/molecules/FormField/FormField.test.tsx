import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { FormField } from './FormField'

describe('<FormField>', () => {
  it('points the control at its error', () => {
    const html = renderToStaticMarkup(
      <FormField error="Required" id="email" label="Email">
        <input id="email" />
      </FormField>,
    )

    expect(html).toContain('id="email-error"')
    expect(html).toContain('aria-describedby="email-error"')
  })

  it('keeps a description the control already names', () => {
    const html = renderToStaticMarkup(
      <FormField error="Required" id="email" label="Email">
        <input aria-describedby="hint" id="email" />
      </FormField>,
    )

    expect(html).toContain('aria-describedby="hint email-error"')
  })

  it('sets nothing when there is no error', () => {
    const html = renderToStaticMarkup(
      <FormField id="email" label="Email">
        <input id="email" />
      </FormField>,
    )

    expect(html).toContain('<input id="email"')
    expect(html).not.toContain('aria-describedby')
  })
})
