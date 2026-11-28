import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { TechniqueCard } from './TechniqueCard'
import { CF_PUBLIC_URL } from '@/tests/_helpers/cloudflare-images'
import { anchorFor, classFor, classOf, openTag } from '@/tests/_helpers/markup'
import { EN_TRANSLATIONS, getT } from '@/lib/i18n/i18n'

const t = getT(EN_TRANSLATIONS, 'en')

const props = {
  number: '01',
  title: 'Sit comfortably',
  description: 'Rest your hands on your lap.',
  imageSrc: CF_PUBLIC_URL,
  imageAlt: 'Seated posture',
  href: '/techniques/sit',
}

describe('<TechniqueCard> image sizes', () => {
  it('advertises one length per step of the wrapper it draws', () => {
    const html = renderToStaticMarkup(<TechniqueCard {...props} />)

    // Asserted together, so the pixel numbers cannot outlive the wrapper.
    expect(html).toContain('w-full max-w-md shrink-0 md:w-84 lg:w-96')
    expect(html).toContain(
      'sizes="(min-width: 1024px) 384px, (min-width: 768px) 336px, (min-width: 448px) 448px, 100vw"',
    )
    expect(html).not.toContain('/public')
  })
})

describe('<TechniqueCard> call to action', () => {
  it('labels the button from SahajCloud and names the page it leads to', () => {
    const html = renderToStaticMarkup(<TechniqueCard {...props} />)
    const anchor = anchorFor(html, '/techniques/sit')

    expect(anchor).not.toBe('')
    expect(html).toContain(`>${t('blocks.general.learn_more')}</a>`)
    expect(anchor).toContain(
      `aria-label="${t('blocks.a11y.learn_more_about', { title: 'Sit comfortably' })}"`,
    )
  })
})

describe('<TechniqueCard> number', () => {
  it('draws the number twice, once per breakpoint band', () => {
    const html = renderToStaticMarkup(<TechniqueCard {...props} />)

    expect(html.match(/>01</g)?.length).toBe(2)
  })

  it('draws no number for a card without one', () => {
    const html = renderToStaticMarkup(<TechniqueCard {...props} number={undefined} />)

    expect(html).toContain('Sit comfortably')
    expect(html).not.toContain('text-4xl')
  })
})

describe('<TechniqueCard> number tab', () => {
  it('hangs the tab on the edge the image is not on', () => {
    const left = renderToStaticMarkup(<TechniqueCard {...props} align="left" />)
    const right = renderToStaticMarkup(<TechniqueCard {...props} align="right" />)

    expect(classFor(left, 'bottom-full').split(' ')).toContain('-right-4')
    expect(classFor(left, 'bottom-full').split(' ')).toContain('bg-linear-to-l')
    expect(classFor(right, 'bottom-full').split(' ')).toContain('-left-4')
    expect(classFor(right, 'bottom-full').split(' ')).toContain('bg-linear-to-r')
  })

  it('positions the tab against the card, not against the image column', () => {
    const html = renderToStaticMarkup(<TechniqueCard {...props} />)

    expect(classFor(html, 'md:w-84')).toContain('max-w-md')
    expect(classFor(html, 'md:w-84').split(' ')).not.toContain('relative')
  })
})

describe('<TechniqueCard> heading and description', () => {
  it('takes its heading level from the caller, keeping the h5 size', () => {
    const html = renderToStaticMarkup(<TechniqueCard {...props} headingLevel="h2" />)

    expect(openTag(html, 'h2')).not.toBe('')
    expect(html).not.toContain('<h3')
    expect(classOf(html, 'Sit comfortably').split(' ')).toContain('text-lg')
  })

  it('keeps a line break in the description', () => {
    const html = renderToStaticMarkup(
      <TechniqueCard {...props} description={'Good for:\nBetter sleep'} />,
    )

    expect(classOf(html, 'Good for:').split(' ')).toContain('whitespace-pre-line')
  })
})
