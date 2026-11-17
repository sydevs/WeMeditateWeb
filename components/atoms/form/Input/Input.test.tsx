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

/** What marks the rendered icon, so the absence cases below cannot pass vacuously. */
const ICON_MARKER = 'aria-hidden="true"'

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

  it('marks the icon it renders', () => {
    expect(renderToStaticMarkup(<Input type="search" />)).toContain(ICON_MARKER)
  })

  it.each([
    ['a type with no default icon', { type: 'text' }],
    ['icon={null}', { icon: null, type: 'search' }],
  ])('renders a bare input for %s', (_label, props) => {
    const html = renderToStaticMarkup(<Input {...props} />)

    expect(html).toContain('<input')
    expect(html).not.toContain(ICON_MARKER)
  })
})
