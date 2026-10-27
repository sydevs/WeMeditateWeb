import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { TechniqueCard } from './TechniqueCard'

// The shape a SahajCloud read sends: `…/<image_id>/public`
// (sydevs/SahajCloud `src/plugins/storage/cloudflareImagesAdapter.ts:203`).
const CF_PUBLIC_URL = 'https://imagedelivery.net/dOm4imjweFFL1Pto29l-4Q/abc123/public'

const props = {
  number: '01',
  title: 'Sit comfortably',
  description: 'Rest your hands on your lap.',
  imageSrc: CF_PUBLIC_URL,
  imageAlt: 'Seated posture',
  href: '/techniques/sit',
  buttonText: 'Learn more',
}

describe('<TechniqueCard> image sizes', () => {
  // Without an explicit `sizes` the atom assumed a full-width layout and
  // fetched 800px into a card at most 384px wide on desktop (#146).
  it('advertises one length per step of the wrapper width', () => {
    const html = renderToStaticMarkup(<TechniqueCard {...props} />)

    expect(html).toContain(
      'sizes="(min-width: 1024px) 384px, (min-width: 768px) 336px, (min-width: 448px) 448px, 100vw"',
    )
    expect(html).not.toContain('/public')
  })
})
