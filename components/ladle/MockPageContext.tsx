import { ReactNode } from 'react'

export interface MockPageContextProps {
  children: ReactNode
  locale?: 'en' | 'fr'
}

/**
 * Mock PageContext provider for Ladle stories.
 *
 * Provides a minimal PageContext implementation that allows components
 * using usePageContext() (like Link) to work in Ladle's isolated environment.
 *
 * @example
 * <MockPageContext locale="en">
 *   <YourComponent />
 * </MockPageContext>
 */
export function MockPageContext({ children, locale = 'en' }: MockPageContextProps) {
  // Create a minimal pageContext object that satisfies the Link component's needs
  const mockPageContext = {
    locale,
    // Add any other required PageContext properties here
    urlPathname: '/',
    urlParsed: {
      pathname: '/',
      search: {},
      searchOriginal: null,
      hash: '',
      hashOriginal: null,
      origin: null,
      href: '/',
    },
  } as any // Use 'as any' to avoid full PageContext type requirements in stories

  return (
    <PageContextProvider pageContext={mockPageContext}>
      {children}
    </PageContextProvider>
  )
}
