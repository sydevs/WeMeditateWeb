/**
 * Atoms - Foundational UI Elements
 *
 * This barrel export provides convenient access to all atomic components.
 * Atoms are the basic building blocks of the design system that cannot
 * be broken down further without losing their meaning.
 */

// Typography
export { Heading } from './Heading'
export { Text } from './Text'
export { Label } from './Label'
export { PageTitle } from './PageTitle/PageTitle'
export { Blockquote } from './Blockquote'
export { Link } from './Link'
export type { HeadingProps } from './Heading'
export type { TextProps } from './Text'
export type { LabelProps } from './Label'
export type { PageTitleProps } from './PageTitle/PageTitle'
export type { BlockquoteProps } from './Blockquote'
export type { LinkProps } from './Link'

// Interactive
export { Button } from './Button'
export { Dropdown } from './Dropdown'
export type { ButtonProps } from './Button'
export type { DropdownProps } from './Dropdown'

// Form Inputs
export { Input } from './Input'
export { Textarea } from './Textarea'
export { Checkbox } from './Checkbox'
export { Radio } from './Radio'
export { Select } from './Select'
export type { InputProps } from './Input'
export type { TextareaProps } from './Textarea'
export type { CheckboxProps } from './Checkbox'
export type { RadioProps } from './Radio'
export type { SelectProps } from './Select'

// Media
export { Image } from './Image'
export { Icon } from './Icon'
export { Avatar } from './Avatar'
export { Logo } from './Logo'
export type { ImageProps, IconProps, HeroIcon } from './Icon'
export type { AvatarProps } from './Avatar'
export type { LogoProps } from './Logo'

// SVG Components
export {
  LogoSvg,
  LeafSvg,
  MeditationSvg,
  LocationSvg,
  FloralDividerSvg,
  HeaderIllustrationSvg
} from './svgs'
export type {
  LogoSvgProps,
  LeafSvgProps,
  MeditationSvgProps,
  LocationSvgProps,
  FloralDividerSvgProps,
  HeaderIllustrationSvgProps
} from './svgs'

// Feedback
export { Spinner } from './Spinner'
export { Duration } from './Duration'
export { Badge } from './Badge'
export type { SpinnerProps } from './Spinner'
export type { DurationProps } from './Duration'
export type { BadgeProps } from './Badge'

// Layout
export { Container } from './Container'
export { Spacer } from './Spacer'
export { Box } from './Box'
export { LeafDivider } from './LeafDivider/LeafDivider'
export { Breadcrumbs } from './Breadcrumbs'
export type { ContainerProps } from './Container'
export type { SpacerProps } from './Spacer'
export type { BoxProps } from './Box'
export type { LeafDividerProps } from './LeafDivider/LeafDivider'
export type { BreadcrumbsProps, BreadcrumbItem } from './Breadcrumbs'

// Specialty
export { LanguageFlag } from './LanguageFlag'
export { SocialIcon } from './SocialIcon'
export { Countdown } from './Countdown'
export type { LanguageFlagProps } from './LanguageFlag'
export type { SocialIconProps } from './SocialIcon'
export type { CountdownProps } from './Countdown'
