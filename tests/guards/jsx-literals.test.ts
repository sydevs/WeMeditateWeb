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

const eslint = new ESLint({ cwd: new URL('../..', import.meta.url).pathname })

/** The literal-copy complaints ESLint reports for `source` at `filePath`. */
async function violations(source: string, filePath = 'components/organisms/Sample.tsx') {
  const [result] = await eslint.lintText(source, { filePath })

  return result.messages
    .filter((message) => message.ruleId === 'no-restricted-syntax')
    .map((message) => message.line)
}

const wrap = (jsx: string) => `export function Sample() {\n  return (\n${jsx}\n  )\n}\n`

describe('the visible-copy lint rule', () => {
  it('catches JSX text', async () => {
    expect(await violations(wrap('    <p>Inspiration comes from within</p>'))).toHaveLength(1)
  })

  it('catches a quoted prop that carries copy', async () => {
    const samples = [
      '    <Item title="Meditate Now" />',
      "    <Item title={'Meditate Now'} />",
      "    <Item aria-label={muted ? 'Unmute voice' : 'Mute voice'} />",
      '    <img alt="A seated meditator" />',
    ]

    for (const sample of samples) {
      expect(await violations(wrap(sample)), sample).not.toHaveLength(0)
    }
  })

  it('passes a resolved lookup, a separator and a lone initial', async () => {
    const samples = [
      "    <p>{t('navigation.featured_caption')}</p>",
      "    <Item title={t('navigation.about_meditation')} />",
      '    <span>·</span>',
      '    <span>{first} — {last}</span>',
    ]

    for (const sample of samples) {
      expect(await violations(wrap(sample)), sample).toHaveLength(0)
    }
  })

  it('leaves stories and tests to their own English fixtures', async () => {
    const sample = wrap('    <p>Inspiration comes from within</p>')

    expect(await violations(sample, 'components/organisms/Sample.stories.tsx')).toHaveLength(0)
    expect(await violations(sample, 'components/organisms/Sample.test.tsx')).toHaveLength(0)
  })
})
