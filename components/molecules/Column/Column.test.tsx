import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Column } from './Column'
import {
  CF_BASE,
  CF_PUBLIC_URL,
  PASSTHROUGH_SOURCES,
} from '../../../tests/_helpers/cloudflare-images'

const render = (imageUrl: string) =>
  renderToStaticMarkup(
    <Column description="Body" imageAlt="Alpha" imageUrl={imageUrl} title="Alpha" />,
  )

describe('<Column> image variant', () => {
  const html = render(CF_PUBLIC_URL)

  // The image carried width and height but no aspect ratio, so <Image>
  // returned the src untouched and a 160px box got the original (#146).
  it('requests a variant and a srcset for a SahajCloud image', () => {
    expect(html).toContain(`srcSet="${CF_BASE}/width=200 200w`)
    expect(html).not.toContain('/public')
  })

  // `forceAspectRatio={false}`: the square ratio picks the variant without
  // boxing the layout, so the drawn size stays the caller's own classes.
  it('keeps the image in natural flow, not in a forced ratio box', () => {
    expect(html).toContain('w-32 h-32 md:w-40 md:h-40')
    expect(html).toContain('sizes="160px"')
    expect(html).not.toContain('aspect-square')
  })

  it.each(PASSTHROUGH_SOURCES)('leaves %s unchanged, with no srcset', (_label, src) => {
    const passthrough = render(src)

    expect(passthrough).toContain(`src="${src}"`)
    expect(passthrough).not.toContain('srcSet=')
  })
})
