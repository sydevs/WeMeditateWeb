import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { FormField } from './FormField'

describe('<FormField>', () => {
  it('points the control at its description', () => {
    const html = renderToStaticMarkup(
      <FormField description="We never share it" id="email" label="Email">
        <input id="email" />
      </FormField>,
    )

    expect(html).toContain('id="email-description"')
    expect(html).toContain('aria-describedby="email-description"')
  })

  it('points the control at its error, and not at the description it replaces', () => {
    const html = renderToStaticMarkup(
      <FormField description="We never share it" error="Required" id="email" label="Email">
        <input id="email" />
      </FormField>,
    )

    expect(html).toContain('id="email-error"')
    expect(html).toContain('aria-describedby="email-error"')
    expect(html).not.toContain('email-description')
  })

  it('keeps a description the control already names', () => {
    const html = renderToStaticMarkup(
      <FormField error="Required" id="email" label="Email">
        <input aria-describedby="hint" id="email" />
      </FormField>,
    )

    expect(html).toContain('aria-describedby="hint email-error"')
  })

  it('sets nothing when there is neither a description nor an error', () => {
    const html = renderToStaticMarkup(
      <FormField id="email" label="Email">
        <input id="email" />
      </FormField>,
    )

    expect(html).toContain('<input id="email"')
    expect(html).not.toContain('aria-describedby')
  })
})
