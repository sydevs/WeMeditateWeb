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
  // Compared against the icon named explicitly: a swapped table entry still
  // renders an icon, and only this comparison notices which one.
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

  it('wraps the input when it renders an icon', () => {
    const html = renderToStaticMarkup(<Input type="search" />)

    expect(html).toContain('<div')
    expect(html).toContain('<svg')
  })

  it.each([
    ['a type with no default icon', { type: 'text' }],
    ['icon={null}', { icon: null, type: 'search' }],
    // FormBuilder hands `type` a SahajCloud block type as a plain string. An
    // inherited member must not be found and rendered: unguarded, `toString`
    // reaches the icon slot and React writes `[object Undefined]` into it.
    ['a type naming an inherited member', { type: 'toString' }],
  ])('renders a lone input for %s', (_label, props) => {
    const html = renderToStaticMarkup(<Input {...props} />)

    // Only the icon branch wraps the input, so a bare render has no element
    // around it and nothing in the icon slot.
    expect(html).toContain('<input')
    expect(html).not.toContain('<div')
  })
})
