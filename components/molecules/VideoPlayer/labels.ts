/**
 * Vidstack's control labels, as SahajCloud keys.
 *
 * `<DefaultVideoLayout>` ships its own English labels and looks each one up
 * by the English phrase itself — `i18n(translations, word) => translations?.[word] ?? word`.
 * So the phrase is both the key and the fallback, and `Captions look like this`
 * cannot be a SahajCloud field name. This map is the translation layer: a
 * Vidstack word on the left, the `wm-web-translations` key that replaces it
 * on the right.
 *
 * `@vidstack/react` ships no locale data of its own — the published package
 * carries no locale, i18n or translation file — so there is nothing upstream
 * to import.
 */

import type {
  DefaultLayoutTranslations,
  DefaultLayoutWord,
} from '@vidstack/react/player/layouts/default'
import type { TFunction, TranslationKey } from '../../../lib/i18n'

/**
 * The `video` tab covers the control bar and the settings menu. `Volume`
 * is the exception: the bank already names that slider for the audio
 * player, and a second copy of one word would be a second thing to
 * translate.
 */
export const VIDEO_LAYOUT_KEYS = {
  Accessibility: 'video.general.accessibility',
  Announcements: 'video.general.announcements',
  Audio: 'video.general.audio',
  Auto: 'video.general.auto',
  Boost: 'video.general.boost',
  'Caption Styles': 'video.general.caption_styles',
  Captions: 'video.general.captions',
  'Captions look like this': 'video.general.captions_look_like_this',
  'Closed-Captions Off': 'video.general.closed_captions_off',
  'Closed-Captions On': 'video.general.closed_captions_on',
  Color: 'video.general.color',
  Default: 'video.general.default',
  'Display Background': 'video.general.display_background',
  'Enter Fullscreen': 'video.general.enter_fullscreen',
  'Enter PiP': 'video.general.enter_pip',
  'Exit Fullscreen': 'video.general.exit_fullscreen',
  'Exit PiP': 'video.general.exit_pip',
  Family: 'video.general.family',
  Font: 'video.general.font',
  Fullscreen: 'video.a11y.fullscreen',
  'Keyboard Animations': 'video.general.keyboard_animations',
  Mute: 'video.general.mute',
  Normal: 'video.general.normal',
  Off: 'video.general.off',
  Opacity: 'video.general.opacity',
  Pause: 'video.general.pause',
  PiP: 'video.a11y.pip',
  Play: 'video.general.play',
  Quality: 'video.general.quality',
  Reset: 'video.general.reset',
  Seek: 'video.a11y.seek',
  'Seek Backward': 'video.general.seek_backward',
  'Seek Forward': 'video.general.seek_forward',
  Settings: 'video.general.settings',
  Shadow: 'video.general.shadow',
  Size: 'video.general.size',
  Speed: 'video.general.speed',
  Text: 'video.general.text',
  'Text Background': 'video.general.text_background',
  Track: 'video.general.track',
  Unmute: 'video.general.unmute',
  Volume: 'media.a11y.volume',
} as const satisfies Partial<Record<DefaultLayoutWord, TranslationKey>>

/**
 * Words `<DefaultVideoLayout>` declares that no visitor of this player
 * reads, so each keeps Vidstack's English and costs nobody a translation.
 *
 * Measured against `@vidstack/react@1.15.7`. A feature this player does not
 * configure: remote playback (`AirPlay`, `Google Cast`, its three connection
 * states), a `download` prop, a live stream, a chapters track — the two cast
 * buttons do render, as `display: none` and `aria-hidden`, so the rendered
 * page holds their English. A word the layout never renders at all: `Loop`,
 * `Playback`, and `Disabled`, which is Plyr's. And `Replay` / `Continue`,
 * which only `DefaultAudioTitle` renders.
 *
 * Enabling one of those features adds its key. A Vidstack upgrade does not.
 */
export const UNREACHABLE_WORDS = [
  'AirPlay',
  'Chapters',
  'Connected',
  'Connecting',
  'Continue',
  'Disabled',
  'Disconnected',
  'Download',
  'Google Cast',
  'LIVE',
  'Loop',
  'Playback',
  'Replay',
  'Skip To Live',
] as const satisfies readonly DefaultLayoutWord[]

type HandledWord = keyof typeof VIDEO_LAYOUT_KEYS | (typeof UNREACHABLE_WORDS)[number]

type AssertNever<T extends never> = T

/**
 * A Vidstack upgrade that adds a control word fails to compile here, until
 * that word is either mapped above or listed as unreachable. Nothing else
 * would catch it: an unmapped word renders its English phrase, which looks
 * exactly like a working player.
 */
export type EveryLayoutWordHandled = AssertNever<Exclude<DefaultLayoutWord, HandledWord>>

/**
 * The `translations` prop for `<DefaultVideoLayout>`.
 *
 * The prop is `Partial<>`, so a word this map omits keeps Vidstack's own
 * English rather than rendering blank.
 */
export function videoLayoutTranslations(t: TFunction): Partial<DefaultLayoutTranslations> {
  const entries = Object.entries(VIDEO_LAYOUT_KEYS) as [DefaultLayoutWord, TranslationKey][]

  return Object.fromEntries(entries.map(([word, key]) => [word, t(key)]))
}
