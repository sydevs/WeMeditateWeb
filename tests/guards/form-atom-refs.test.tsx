/**
 * Every form atom hands its caller's `ref` to every element it renders.
 *
 * `FormBuilder` and `react-hook-form` register a field by its ref, so an atom
 * that drops one takes its field out of the form without failing a render.
 * `forwardRef` used to carry that contract in the type; React 19 passes `ref`
 * as an ordinary prop, and what is left reports a break only as one
 * `no-unused-vars` warning among twenty — in a run that exits 0.
 *
 * The branch that needs it most is the one no caller exercises: `Input`
 * renders a second `<input>` when it draws an icon, so a ref wired to the
 * plain branch alone looks correct everywhere a test renders it.
 *
 * A ref never attaches under `renderToStaticMarkup`, so the wiring is read
 * from the source the way `ssr-visibility.test.ts` reads one. The render below
 * is a compile-time claim instead: `tsc --noEmit` rejects it if an atom stops
 * accepting a ref, or starts accepting the wrong element.
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

/**
 * How many `<tag>` elements `file` renders, and how many of those carry a
 * `ref`. Any expression counts: the binding is renamed the moment an atom
 * needs two refs, and the contract is that the element has one.
 */
function refCoverage(file: string, tag: string): { elements: number; wired: number } {
  let elements = 0
  let wired = 0

  walk(parse(readSource(join(repoRoot, file))), (node) => {
    if (!ts.isJsxSelfClosingElement(node) && !ts.isJsxOpeningElement(node)) {
      return
    }

    if (node.tagName.getText() !== tag) {
      return
    }

    elements += 1

    const carriesRef = node.attributes.properties.some(
      (attribute) =>
        ts.isJsxAttribute(attribute) &&
        attribute.name.getText() === 'ref' &&
        attribute.initializer !== undefined &&
        ts.isJsxExpression(attribute.initializer),
    )

    if (carriesRef) {
      wired += 1
    }
  })

  return { elements, wired }
}

describe('form atoms forward a ref', () => {
  it.each(ATOMS)('$name wires a ref to every <$tag> it renders', ({ tag, file }) => {
    const { elements, wired } = refCoverage(file, tag)

    expect(elements).toBeGreaterThan(0)
    expect(wired).toBe(elements)
  })

  it('accepts a ref of its own element type, and keeps it out of the markup', () => {
    const input = createRef<HTMLInputElement>()
    const select = createRef<HTMLSelectElement>()
    const textarea = createRef<HTMLTextAreaElement>()

    const markup = [
      renderToStaticMarkup(<Checkbox ref={input} label="Agree" />),
      renderToStaticMarkup(<Input ref={input} type="search" />),
      renderToStaticMarkup(<Radio ref={input} label="Five minutes" name="duration" />),
      renderToStaticMarkup(<Select ref={select} />),
      renderToStaticMarkup(<Textarea ref={textarea} />),
    ].join('')

    expect(markup).not.toContain(' ref=')
  })
})
