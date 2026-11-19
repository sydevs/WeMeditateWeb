/**
 * The `local/image-aspect-ratio` rule is wired where it must be, and the raw
 * `<img>` population it cannot reach stays accounted for.
 *
 * Why the prop is required sits beside the rule, in `eslint-rules/index.js`,
 * whose own fixtures prove the matcher fires. A rule scoped to nothing fails
 * open just as silently, so this asks ESLint against the repo config instead
 * (`jsx-literals.test.ts`).
 *
 * `sizes` is not here: `ImageProps` requires it, so `tsc` owns that one and
 * catches the forwarded `undefined` a selector reads as compliant (#206).
 *
 * The rule reads `<Image>` tags only, and four of the ten sites #146 fixed
 * are a hand-rolled `<img>`. Holding those to `getImageURL` would need
 * exemptions: of the seven raw `<img>` the last test pins, only two name the
 * helper in the tag — the atom's own `<img>` is the pipeline, one paints a
 * bundled SVG, and three reach the helper a hop away. A measurement nothing
 * checks is the defect this guard exists to catch, so the population is
 * pinned: a seventh is a red test and a decision, not a silent over-fetch.
 */

import { describe, it, expect } from 'vitest'
import { ESLint } from 'eslint'
import { relative } from 'node:path'
import { componentGlobs, readSource, repoRoot, sourceFiles } from './_source-scan'

// Hoisted on purpose: a fresh instance re-resolves the config on every call,
// and loading this repo's config costs ~700ms.
const eslint = new ESLint({ cwd: repoRoot })

const PROPS = ['aspectRatio'] as const

/**
 * The props ESLint faults `tag` for, as the file at `filePath`.
 *
 * `lintText` resolves config by `filePath`, so a sample is linted as the file
 * it claims to be — which is what proves the scope and the story exclusion.
 */
async function faults(
  tag: string,
  filePath = 'components/organisms/Sample/Sample.tsx',
): Promise<string[]> {
  const [result] = await eslint.lintText(`export const Sample = () => (\n${tag}\n)\n`, { filePath })

  return result.messages
    .filter((message) => message.ruleId === 'local/image-aspect-ratio')
    .flatMap((message) => PROPS.filter((prop) => message.message.includes(prop)))
    .sort()
}

describe('the <Image> variant lint rule', () => {
  it('faults a call site that omits aspectRatio', async () => {
    expect(await faults('<Image alt="" sizes="48px" src="/a.jpg" />')).toEqual(['aspectRatio'])
  })

  // The TechniqueCard spelling: several lines, and a `sizes` holding media
  // queries with their own parentheses and quotes.
  it('passes a compliant tag, however it is spelled', async () => {
    const tag = [
      '  <Image',
      '    alt=""',
      '    aspectRatio="square"',
      '    sizes="(min-width: 1024px) 384px, (min-width: 768px) 336px, 100vw"',
      '    src="/a.jpg"',
      '  />',
    ].join('\n')

    expect(await faults(tag)).toEqual([])
    expect(await faults('<Image alt="" aspectRatio={ratio} sizes={sizes} src={src} />')).toEqual([])
  })

  it('leaves a story to its own fixture copy', async () => {
    expect(
      await faults('<Image alt="" src="/a.jpg" />', 'components/atoms/Image/Image.stories.tsx'),
    ).toEqual([])
  })
})

describe('every raw <img>', () => {
  it('is one of the sites the docstring accounts for', () => {
    const sites = sourceFiles(componentGlobs)
      .filter((file) => /<img[\s/>]/.test(readSource(file)))
      .map((file) => relative(repoRoot, file))

    expect(sites.sort()).toEqual([
      'components/atoms/Avatar/Avatar.tsx',
      'components/atoms/Image/Image.tsx',
      'components/atoms/SplashLoader/SplashLoader.tsx',
      'components/molecules/VideoPlayer/index.tsx',
      'components/organisms/MeditationPlayer/MeditationPlayer.tsx',
      'components/organisms/OrnateTextBox/OrnateTextBox.tsx',
      'components/organisms/Splash/Splash.tsx',
    ])
  })
})
