/**
 * Every form atom still hands its caller's `ref` to the element it wraps.
 *
 * `FormBuilder` and `react-hook-form` register a field by its ref, so an atom
 * that drops one takes its field out of the form without failing a render.
 * The five atoms used to guarantee this through `forwardRef`, whose absence
 * `tsc` would have caught; React 19 passes `ref` as an ordinary prop, and a
 * prop left out of the destructure still flows through `{...props}` onto the
 * element. So nothing above this file reports the day one stops being wired.
 *
 * It takes two halves, because neither alone can say it:
 *
 * - **The type.** Each atom is rendered with a `ref` of its element's type.
 *   That is a compile-time claim, enforced by `tsc --noEmit` in the gate: an
 *   atom that stopped accepting a ref, or started accepting the wrong element,
 *   fails there rather than here.
 * - **The wiring.** A ref never attaches under `renderToStaticMarkup`, so the
 *   rendered HTML cannot show it (`docs/rules/testing.md`). Where it lands is
 *   a fact about the source, read the way `ssr-visibility.test.ts` reads one.
 */

import ts from 'typescript'
import { describe, it, expect } from 'vitest'
import { createRef } from 'react'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { parse, readSource, repoRoot, walk } from './_source-scan'
import { Checkbox } from '../../components/atoms/form/Checkbox/Checkbox'
import { Input } from '../../components/atoms/form/Input/Input'
import { Radio } from '../../components/atoms/form/Radio/Radio'
import { Select } from '../../components/atoms/form/Select/Select'
import { Textarea } from '../../components/atoms/form/Textarea/Textarea'

/** Each atom, the tag it must wire its ref to, and the file that says so. */
const ATOMS = [
  { name: 'Checkbox', tag: 'input', file: 'components/atoms/form/Checkbox/Checkbox.tsx' },
  { name: 'Input', tag: 'input', file: 'components/atoms/form/Input/Input.tsx' },
  { name: 'Radio', tag: 'input', file: 'components/atoms/form/Radio/Radio.tsx' },
  { name: 'Select', tag: 'select', file: 'components/atoms/form/Select/Select.tsx' },
  { name: 'Textarea', tag: 'textarea', file: 'components/atoms/form/Textarea/Textarea.tsx' },
]

/** Every tag in `file` that carries `ref={ref}`. */
function tagsWiringRef(file: string): string[] {
  const tags: string[] = []

  walk(parse(readSource(join(repoRoot, file))), (node) => {
    if (!ts.isJsxSelfClosingElement(node) && !ts.isJsxOpeningElement(node)) {
      return
    }
    const wired = node.attributes.properties.some(
      (attribute) =>
        ts.isJsxAttribute(attribute) &&
        attribute.name.getText() === 'ref' &&
        attribute.initializer !== undefined &&
        ts.isJsxExpression(attribute.initializer) &&
        attribute.initializer.expression?.getText() === 'ref',
    )

    if (wired) {
      tags.push(node.tagName.getText())
    }
  })

  return tags
}

describe('form atoms forward a ref', () => {
  it.each(ATOMS)('$name wires its ref to its <$tag>', ({ tag, file }) => {
    expect(tagsWiringRef(file)).toContain(tag)
  })

  it('renders every atom given a ref of its own element type', () => {
    const input = createRef<HTMLInputElement>()
    const select = createRef<HTMLSelectElement>()
    const textarea = createRef<HTMLTextAreaElement>()

    const markup = [
      renderToStaticMarkup(<Checkbox ref={input} label="Agree" />),
      renderToStaticMarkup(<Input ref={input} type="email" />),
      renderToStaticMarkup(<Radio ref={input} label="Five minutes" name="duration" />),
      renderToStaticMarkup(<Select ref={select} />),
      renderToStaticMarkup(<Textarea ref={textarea} />),
    ]

    expect(markup.filter((html) => html.includes('<input'))).toHaveLength(3)
    expect(markup.some((html) => html.includes('<select'))).toBe(true)
    expect(markup.some((html) => html.includes('<textarea'))).toBe(true)
    // A ref is not an attribute: it must never reach the server's HTML.
    expect(markup.join('').includes(' ref=')).toBe(false)
  })
})
