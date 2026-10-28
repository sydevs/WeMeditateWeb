import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { TechniqueCard } from './TechniqueCard'
import { CF_PUBLIC_URL } from '../../../tests/_helpers/cloudflare-images'

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
