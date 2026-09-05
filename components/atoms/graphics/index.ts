/**
 * Graphics are brand and visual atoms.
 *
 * This is a barrel export for the brand-and-identity and decorative
 * graphic atoms grouped under `atoms/graphics/` (Logo, LanguageFlag,
 * SocialIcon, and the svgs). The parent `components/atoms` barrel
 * re-exports it.
 */

export { Logo } from './Logo'
export type { LogoProps } from './Logo'

export { LanguageFlag } from './LanguageFlag'
export type { LanguageFlagProps } from './LanguageFlag'

export { SocialIcon } from './SocialIcon'
export type { SocialIconProps } from './SocialIcon'

export * from './svgs'
