import { describe, it, expect } from 'vitest'
import { idSchema, slugSchema } from './validation'
import { slugify } from '@/lib/urls/slugify'

describe('idSchema', () => {
  it('refuses an id past Postgres int4, which SahajCloud answers with a 500', () => {
    expect(idSchema.parse('2147483647')).toBe('2147483647')
    expect(idSchema.safeParse('9999999999').success).toBe(false)
  })
})

describe('slugSchema', () => {
  // The gate 404s what it refuses, so anything the one slugifier emits has to
  // pass it. SahajCloud derives a page slug with the same recipe.
  it.each([
    'about',
    'über-uns',
    'софия',
    'universität-trier',
    'ինչ-է-սահաջա-յոգան',
    '合気道',
    'page-2',
  ])('accepts %s, which slugify produces', (slug) => {
    expect(slugify(slug)).toBe(slug)
    expect(slugSchema.parse(slug)).toBe(slug)
  })

  it.each([
    ['an empty slug', ''],
    ['a path separator', 'about/us'],
    ['an upper-case letter', 'Über-uns'],
    ['a percent escape, which Vike has already decoded', '%C3%BCber-uns'],
    ['a leading hyphen', '-about'],
    ['a trailing hyphen', 'about-'],
    ['consecutive hyphens', 'about--us'],
    ['a space', 'über uns'],
  ])('refuses %s', (_label, slug) => {
    expect(slugSchema.safeParse(slug).success).toBe(false)
  })
})
