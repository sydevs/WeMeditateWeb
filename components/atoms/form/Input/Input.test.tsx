import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  MagnifyingGlassIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline'
import { Input } from './Input'
import type { HeroIcon } from '../../Icon/Icon'

describe('Input', () => {
  // Rendering the same input with the icon named explicitly is what pins the
  // table: a swapped pair still renders an icon, and only this comparison
  // notices which one.
  const defaults: [string, HeroIcon][] = [
    ['search', MagnifyingGlassIcon],
    ['email', EnvelopeIcon],
    ['tel', PhoneIcon],
    ['url', GlobeAltIcon],
  ]

  it.each(defaults)('gives a %s input its own default icon', (type, expected) => {
    expect(renderToStaticMarkup(<Input type={type} />)).toBe(
      renderToStaticMarkup(<Input icon={expected} type={type} />),
    )
  })

  it('does not give every type the same icon', () => {
    const rendered = defaults.map(([type]) => renderToStaticMarkup(<Input type={type} />))

    expect(new Set(rendered).size).toBe(defaults.length)
  })

  it('renders a bare input for a type with no default icon', () => {
    const html = renderToStaticMarkup(<Input type="text" />)

    expect(html).toContain('<input')
    expect(html).not.toContain('aria-hidden="true"')
  })

  it('drops the default icon when icon is null', () => {
    const html = renderToStaticMarkup(<Input icon={null} type="search" />)

    expect(html).toContain('<input')
    expect(html).not.toContain('aria-hidden="true"')
  })
})
