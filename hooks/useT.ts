/**
 * `useT`, the component-side translation accessor.
 *
 * `pages/+onBeforeRender.ts` fills `translations` from SahajCloud and
 * `passToClient` carries them into the browser. Outside a Vike app — Ladle, a
 * unit test rendering a component bare — there is none, so this falls back to
 * the committed English snapshot, which `pageContextT` applies.
 *
 * The other `pageContext` readers live in `hooks/usePageContext.ts`.
 */

import { pageContextT, type TFunction } from '@/lib/i18n/i18n'
import { useOptionalPageContext } from './usePageContext'

export function useT(): TFunction {
  return pageContextT(useOptionalPageContext())
}
