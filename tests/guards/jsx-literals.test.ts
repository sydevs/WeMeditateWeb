/**
 * The `no-restricted-syntax` selectors in `eslint.config.js` really match.
 *
 * They are the only AST-accurate check on visible copy, and a selector that
 * silently matches nothing fails open: lint goes green and every literal
 * ships. So this asks ESLint itself, against the repo config, rather than
 * re-implementing the selectors.
 *
 * `lintText` resolves config by `filePath`, so each sample is linted as the
 * file it claims to be — which is also what proves the scope and the story
 * and test exclusions.
 */

import { describe, it, expect } from 'vitest'
import { ESLint } from 'eslint'
import { repoRoot } from './_source-scan'

// Hoisted on purpose: a fresh instance re-resolves the config on every call,
// and loading this repo's config costs ~700ms.
const eslint = new ESLint({ cwd: repoRoot })

/** `lines` as a component body, so the first one lands on line 4. */
const FIRST_LINE = 4

const wrap = (lines: string[]) =>
  ['export function Sample() {', '  return (', '    <div>', ...lines, '    </div>', '  )', '}'].join(
    '\n',
  )

/** The lines ESLint reports literal copy on, for `lines` at `filePath`. */
async function reportedLines(lines: string[], filePath = 'components/organisms/Sample.tsx') {
  const [result] = await eslint.lintText(wrap(lines), { filePath })

  return result.messages
    .filter((message) => message.ruleId === 'no-restricted-syntax')
    .map((message) => message.line)
}

/** Each sample's own line, so a failure names the spelling that moved. */
const at = (offset: number) => FIRST_LINE + offset

describe('the visible-copy lint rule', () => {
  it('catches a text node, a braced string and a template literal', async () => {
    const samples = [
      '      <p>Inspiration comes from within</p>',
      "      <p>{'Inspiration comes from within'}</p>",
      '      <p>{`Inspiration comes from within`}</p>',
    ]

    expect(await reportedLines(samples)).toEqual([at(0), at(1), at(2)])
  })

  it('catches a branched brace, in an element and in a fragment', async () => {
    const samples = [
      "      <p>{cond ? 'Inspiration comes from within' : 'Or else'}</p>",
      "      <p>{cond && 'Something went wrong'}</p>",
      "      <>{'Fragment copy'}</>",
    ]

    // The ternary reports twice: one arm is not an excuse for the other.
    expect(await reportedLines(samples)).toEqual([at(0), at(0), at(1), at(2)])
  })

  it('catches a copy prop quoted, braced, or in either branch arm', async () => {
    const samples = [
      '      <Item title="Meditate Now" />',
      "      <Item title={'Meditate Now'} />",
      '      <Item subtitle={`Watch guided meditations`} />',
      "      <Item aria-label={muted ? 'Unmute voice' : 'Mute voice'} />",
      "      <Item description={cond && 'Sit quietly'} />",
      '      <img alt="A seated meditator" />',
    ]

    expect(await reportedLines(samples)).toEqual([
      at(0),
      at(1),
      at(2),
      at(3),
      at(3),
      at(4),
      at(5),
    ])
  })

  it('passes a resolved lookup, a separator, an empty alt and a style block', async () => {
    const samples = [
      "      <p>{t('navigation.featured_caption')}</p>",
      "      <Item title={t('navigation.about_meditation')} />",
      "      <Item title={t('media.general.embed_title', { title })} />",
      '      <span>·</span>',
      '      <span>{first} — {last}</span>',
      '      <img alt="" role="presentation" />',
      '      <style>{`.logo { fill: none; }`}</style>',
    ]

    expect(await reportedLines(samples)).toEqual([])
  })

  it('leaves stories and tests to their own English fixtures', async () => {
    const samples = ['      <p>Inspiration comes from within</p>']

    expect(await reportedLines(samples, 'components/organisms/Sample.stories.tsx')).toEqual([])
    expect(await reportedLines(samples, 'components/organisms/Sample.test.tsx')).toEqual([])
  })
})
