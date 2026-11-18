import type { LegacyRedirectMap } from '../../lib/legacy-redirects/core'

/** The map as JSON with one slug per line, so a regeneration diffs per address. */
export function stringifyMap(map: LegacyRedirectMap): string {
  const line = (depth: number, text: string): string => `${'  '.repeat(depth)}${text}`
  const out: string[] = ['{']

  out.push(line(1, '"pages": {'))
  const pageIds = Object.keys(map.pages)

  pageIds.forEach((id, i) =>
    out.push(
      line(
        2,
        `${JSON.stringify(id)}: ${JSON.stringify(map.pages[id])}${i < pageIds.length - 1 ? ',' : ''}`,
      ),
    ),
  )
  out.push(line(1, '},'))

  out.push(line(1, '"roles": {'))
  const roleKeys = Object.keys(map.roles)

  roleKeys.forEach((key, i) =>
    out.push(
      line(2, `${JSON.stringify(key)}: ${map.roles[key]}${i < roleKeys.length - 1 ? ',' : ''}`),
    ),
  )
  out.push(line(1, '},'))

  out.push(line(1, '"words": {'))
  const wordLocales = Object.keys(map.words)

  wordLocales.forEach((locale, i) =>
    out.push(
      line(
        2,
        `${JSON.stringify(locale)}: ${JSON.stringify(map.words[locale])}${i < wordLocales.length - 1 ? ',' : ''}`,
      ),
    ),
  )
  out.push(line(1, '},'))

  out.push(line(1, '"exact": {'))
  const types = Object.keys(map.exact) as (keyof LegacyRedirectMap['exact'])[]

  types.forEach((type, t) => {
    out.push(line(2, `${JSON.stringify(type)}: {`))
    const locales = Object.keys(map.exact[type])

    locales.forEach((locale, l) => {
      out.push(line(3, `${JSON.stringify(locale)}: {`))
      const slugs = Object.keys(map.exact[type][locale])

      slugs.forEach((slug, s) =>
        out.push(
          line(
            4,
            `${JSON.stringify(slug)}: ${map.exact[type][locale][slug]}${s < slugs.length - 1 ? ',' : ''}`,
          ),
        ),
      )
      out.push(line(3, `}${l < locales.length - 1 ? ',' : ''}`))
    })
    out.push(line(2, `}${t < types.length - 1 ? ',' : ''}`))
  })
  out.push(line(1, '}'), '}', '')

  return out.join('\n')
}
