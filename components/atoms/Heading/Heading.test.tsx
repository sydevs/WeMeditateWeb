import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { openTag } from '../../../tests/_helpers/markup'
import { Heading } from './Heading'

describe('Heading', () => {
  it('keeps the element and the type scale independent', () => {
    const html = renderToStaticMarkup(
      <Heading level="h3" styleAs="h5">
        Section
      </Heading>,
    )

    expect(html).toContain('<h3')
    expect(openTag(html, 'h3')).toContain('text-lg')
  })

  it('emits no type classes at all for styleAs="none"', () => {
    // The escape a caller needs to own its own size. Without it the atom's
    // `levelStyles` win on source order, which is what drove three callers to
    // hand-roll the element and so to own the heading level too (#278).
    const tag = openTag(
      renderToStaticMarkup(
        <Heading className="text-lg font-semibold" level="h2" styleAs="none">
          Item
        </Heading>,
      ),
      'h2',
    )

    expect(tag).toContain('text-lg font-semibold')
    expect(tag).not.toContain('text-3xl')
    expect(tag).not.toContain('leading-tight')
  })
})
