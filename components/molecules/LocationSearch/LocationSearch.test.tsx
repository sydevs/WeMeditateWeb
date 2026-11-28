// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { enT } from '@/lib/i18n/i18n'

// The Mapbox hooks need a browser and a token; the field's name is settled
// before either is called.
vi.mock('@mapbox/search-js-react', () => ({
  useSearchBoxCore: () => ({}),
  useSearchSession: () => ({ sessionToken: 'test' }),
}))

const { LocationSearch } = await import('./LocationSearch')

describe('<LocationSearch> name', () => {
  it('draws a visible label that names the field', () => {
    render(
      <LocationSearch
        accessToken="pk.test"
        label="Find a class near you"
        onLocationSelect={() => {}}
      />,
    )

    const field = screen.getByLabelText('Find a class near you')

    expect(field.tagName).toBe('INPUT')
    // An aria-label would override the label it can see.
    expect(field.hasAttribute('aria-label')).toBe(false)
  })

  it('names the field for screen readers alone without one', () => {
    const { container } = render(
      <LocationSearch accessToken="pk.test" onLocationSelect={() => {}} />,
    )

    expect(container.querySelector('label')).toBeNull()
    expect(screen.getByLabelText(enT('location.a11y.search_label')).tagName).toBe('INPUT')
  })
})
