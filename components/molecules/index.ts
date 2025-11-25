/**
 * Molecules - Simple Component Groups
 *
 * This barrel export provides convenient access to all molecular components.
 * Molecules are groups of atoms bonded together, forming relatively simple
 * functional units.
 */

// Author
export { Author } from './Author'
export type { AuthorProps } from './Author'

// Content
export { Column } from './Column'
export type { ColumnProps } from './Column'
export { ColumnCarousel } from './ColumnCarousel'
export type { ColumnCarouselProps } from './ColumnCarousel'
export { ContentCard } from './ContentCard/ContentCard'
export type { ContentCardProps } from './ContentCard/ContentCard'

// Blocks
export { HeroQuote } from './blocks/HeroQuote/HeroQuote'
export type { HeroQuoteProps } from './blocks/HeroQuote/HeroQuote'

// Forms
export { FormField } from './FormField'
export type { FormFieldProps } from './FormField'
export { LocationSearch } from './LocationSearch'
export type { LocationSearchProps, SelectedLocation } from './LocationSearch'

// Feedback
export { ErrorFallback } from './ErrorFallback'
export type { ErrorFallbackProps } from './ErrorFallback'

// Audio
export { AudioPlayer } from './AudioPlayer'
export type { AudioPlayerProps, Track } from './AudioPlayer'
export { Playlist } from './Playlist'
export type { PlaylistProps, MusicFilter } from './Playlist'

// Social
export { SocialShare } from './SocialShare'
export type { SocialShareProps } from './SocialShare'

// Footer
export { FooterLinkList } from './FooterLinkList'
export { LanguageDropdown } from './LanguageDropdown'
export type { FooterLinkListProps, FooterLink } from './FooterLinkList'
export type { LanguageDropdownProps, LanguageOption } from './LanguageDropdown'

// Sections
export { ContentGrid } from './ContentGrid'
export type { ContentGridProps, ContentGridItem } from './ContentGrid'
export { MasonryGrid } from './MasonryGrid'
export type { MasonryGridProps, MasonryGridItem } from './MasonryGrid'
