/**
 * Organisms - Complex Component Sections
 *
 * This barrel export provides convenient access to all organism components.
 * Organisms are relatively complex UI components composed of groups of molecules
 * and/or atoms and/or other organisms.
 */

// Header
export { Header } from './Header'
export type { HeaderProps } from './Header'

// Footer
export { Footer } from './Footer'
export type { FooterProps, FooterSection, SocialLink } from './Footer'

// TechniqueCard
export { TechniqueCard } from './TechniqueCard'
export type { TechniqueCardProps } from './TechniqueCard'

// DiscoverMeditation
export { DiscoverMeditation } from './DiscoverMeditation'
export type { DiscoverMeditationProps } from './DiscoverMeditation'

// Splash
export { Splash } from './Splash'
export type { SplashProps } from './Splash'

// HeaderDropdown
export { HeaderDropdown } from './HeaderDropdown'
export type { HeaderDropdownProps, HeaderDropdownLink, HeaderDropdownArticle } from './HeaderDropdown'

// ContentTextBox
export { ContentTextBox } from './ContentTextBox'
export type { ContentTextBoxProps } from './ContentTextBox'

// ContentOverlay
export { ContentOverlay } from './ContentOverlay'
export type { ContentOverlayProps } from './ContentOverlay'

// FormBuilder
export { FormBuilder } from './FormBuilder'
export type {
  FormBuilderProps,
  FormBuilderConfig,
  FormBuilderField,
  FormBuilderSubmission,
  FormBuilderApiError,
} from './FormBuilder'

// SubtleSystem
export { SubtleSystem } from './SubtleSystem'
export type { SubtleSystemProps, SubtleSystemItem } from './SubtleSystem'

// MusicLibrary
export { MusicLibrary } from './MusicLibrary'
export type { MusicLibraryProps, MusicFilter } from './MusicLibrary'
