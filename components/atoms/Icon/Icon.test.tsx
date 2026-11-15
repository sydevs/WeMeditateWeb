import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { Icon } from './Icon'

/** The wrapper alone, since Heroicons' own `aria-hidden` svg sits inside it. */
const wrapper = (html: string) => html.slice(0, html.indexOf('>') + 1)

describe('<Icon> accessible name', () => {
  it('names the icon on a role that accepts a name', () => {
    const html = wrapper(renderToStaticMarkup(<Icon aria-label="Error" icon={ExclamationCircleIcon} />))

    expect(html).toContain('role="img"')
    expect(html).toContain('aria-label="Error"')
    expect(html).not.toContain('aria-hidden')
  })

  it('hides an unlabelled icon and gives it no role', () => {
    const html = wrapper(renderToStaticMarkup(<Icon icon={ExclamationCircleIcon} />))

    expect(html).toContain('aria-hidden="true"')
    expect(html).not.toContain('role=')
  })

  it('lets a caller override the role through props', () => {
    const html = wrapper(
      renderToStaticMarkup(
        <Icon aria-label="Rating" icon={ExclamationCircleIcon} role="presentation" />,
      ),
    )

    expect(html).toContain('role="presentation"')
  })
})
