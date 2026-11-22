/**
 * The `/meditations` matcher, and the two routes it must not collide with.
 *
 * Named `route.test.ts`, not `+route.test.ts`: Vike loads every `+`-prefixed
 * file under `pages/` as a config file, and `pnpm build` is the only command
 * that catches the mistake.
 */

import { describe, it, expect } from 'vitest'
import route from './+route'
import documentRoute from '@/pages/meditations/[id]/(full)/+route'

const matches = (urlPathname: string) => route({ urlPathname })

describe('/meditations route', () => {
  it.each(['/meditations', '/meditations/'])('matches %s', (path) => {
    expect(matches(path)).toBe(true)
  })

  it.each(['/meditations/105', '/meditations/105/embed', '/meditate-now'])(
    'does not match %s',
    (path) => {
      expect(matches(path)).toBe(false)
    },
  )

  it('leaves /meditations to this route and /meditations/:id to the document route', () => {
    expect(documentRoute({ urlPathname: '/meditations' })).toBe(false)
    expect(documentRoute({ urlPathname: '/meditations/105' })).not.toBe(false)
  })

  // `+onBeforeRoute` strips a real locale before any route runs, so a prefix
  // reaching here is not one, and taking it would mint a second address of the
  // list. `pages/onBeforeRoute.test.ts` pins the hook-plus-route pair.
  it.each(['/fr/meditations', '/pt-BR/meditations', '/pt-br/meditations', '/zz/meditations'])(
    'refuses the unstripped prefix %s',
    (path) => {
      expect(matches(path)).toBe(false)
    },
  )
})
