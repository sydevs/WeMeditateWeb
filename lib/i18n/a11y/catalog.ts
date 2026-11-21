/**
 * Every locale's screen-reader strings, for the server to mount per request.
 *
 * ⚠ **Server only.** This imports every locale's file, and a browser import would
 * ship all of them in the client bundle. The browser never needs this: the
 * strings reach it inside `pageContext.translations`, already mounted for the
 * request's locale by `loadTranslations` (`server/site-context.ts`).
 */

import type { Locale } from '@/types/sahajcloud'
import { type A11yFile, type A11yStrings, EN_A11Y, overEnglish } from './a11y'
import bg from './bg.json'
import cs from './cs.json'
import de from './de.json'
import el from './el.json'
import es from './es.json'
import fa from './fa.json'
import fr from './fr.json'
import hu from './hu.json'
import hy from './hy.json'
import it from './it.json'
import nl from './nl.json'
import pl from './pl.json'
import ptBR from './pt-BR.json'
import ro from './ro.json'
import ru from './ru.json'
import tr from './tr.json'
import uk from './uk.json'

/**
 * Each locale's own file. An English variant (`en-AU`) has none and reads
 * English; `a11y.test.ts` holds every other known locale to having one.
 */
export const A11Y_FILES: Partial<Record<Locale, A11yFile>> = {
  bg,
  cs,
  de,
  el,
  es,
  fa,
  fr,
  hu,
  hy,
  it,
  nl,
  pl,
  'pt-BR': ptBR,
  ro,
  ru,
  tr,
  uk,
}

const RESOLVED = new Map<Locale, A11yStrings>()

/** One locale's screen-reader strings, complete: any key its file lacks reads English. */
export function a11yStringsFor(locale: Locale): A11yStrings {
  const cached = RESOLVED.get(locale)

  if (cached) return cached

  const file = A11Y_FILES[locale]
  const strings = file ? overEnglish(file) : EN_A11Y

  RESOLVED.set(locale, strings)

  return strings
}
