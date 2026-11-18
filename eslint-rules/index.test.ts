/**
 * The rules' own fixtures, and the wiring they are worth nothing without.
 * `RuleTester` reports a rule that stops firing, which the tree itself cannot:
 * a tree with no violation in it is green under a broken rule too.
 *
 * The default parser, not `typescript-eslint`'s: every fixture here is plain
 * JSX, and the TS parser carries the 9 MB `typescript` module into this
 * worker for nothing.
 */

import { ESLint, RuleTester } from 'eslint'
import { describe, it, expect } from 'vitest'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { rules } from './index.js'

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    parserOptions: { ecmaFeatures: { jsx: true } },
    sourceType: 'module',
  },
})

describe('local/img-loading', () => {
  ruleTester.run('img-loading', rules['img-loading'], {
    invalid: [
      { code: 'const a = <img alt="" src="/x.png" />', errors: [{ messageId: 'unsaid' }] },
      {
        code: ['const a = (', '  <img', '    alt=""', '    src="/x.png"', '  />', ')'].join('\n'),
        errors: [{ messageId: 'unsaid' }],
      },
      // React preloads a srcSet with no src too, so a src-only rule fails open
      // on the shape the `VideoPlayer` fallback is one attribute away from.
      {
        code: 'const a = <img alt="" sizes="100vw" srcSet={ladder} />',
        errors: [{ messageId: 'unsaid' }],
      },
      // The `Avatar` spelling. A regex ending the tag at the first `>` would
      // miss this one and report the compliant one below.
      {
        code: 'const a = <img alt="" src="/x.png" onError={() => reset()} />',
        errors: [{ messageId: 'unsaid' }],
      },
    ],
    valid: [
      'const a = <img alt="" loading="lazy" src="/x.png" />',
      'const a = <img alt="" loading="eager" src="/x.png" />',
      'const a = <img alt="" loading={priority ? "eager" : "lazy"} src={src} />',
      'const a = <img alt="" loading="lazy" sizes="100vw" srcSet={ladder} />',
      'const a = <img alt="" src="/x.png" onError={() => reset()} loading="lazy" />',
      // No src and no srcSet: React hoists nothing.
      'const a = <img alt="" />',
      // The first ⚠ gap in `index.js`: a spread contributes no name.
      'const a = <img alt="" {...props} />',
      // The rule is about the hand-rolled tag. The atom decides its own.
      'const a = <Image alt="" aspectRatio="video" src="/x.png" />',
    ],
  })
})

describe('local/image-aspect-ratio', () => {
  ruleTester.run('image-aspect-ratio', rules['image-aspect-ratio'], {
    invalid: [
      { code: 'const a = <Image alt="" src="/x.png" />', errors: [{ messageId: 'unnamed' }] },
    ],
    valid: [
      'const a = <Image alt="" aspectRatio="video" src="/x.png" />',
      'const a = <img alt="" loading="lazy" src="/x.png" />',
    ],
  })
})

// A rule the config scopes to nothing passes every fixture above and reaches no
// file, which is the failure a tree with no violation in it cannot show.
// `image-variants.test.ts` asks the same of the other rule.
describe('local/img-loading, as the repo config wires it', () => {
  const eslint = new ESLint({ cwd: dirname(dirname(fileURLToPath(import.meta.url))) })

  const faults = async (filePath: string): Promise<string[]> => {
    const [result] = await eslint.lintText(
      'export const Sample = () => <img alt="" src="/a.png" />\n',
      {
        filePath,
      },
    )

    return result.messages.flatMap((message) => (message.ruleId ? [message.ruleId] : []))
  }

  it('faults a component that leaves loading unsaid', async () => {
    expect(await faults('components/organisms/Sample/Sample.tsx')).toContain('local/img-loading')
  })

  it('leaves a story to its own fixture copy', async () => {
    expect(await faults('components/atoms/Image/Image.stories.tsx')).not.toContain(
      'local/img-loading',
    )
  })
})
