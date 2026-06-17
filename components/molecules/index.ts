/**
 * Molecules - Simple Component Groups
 *
 * This barrel export provides convenient access to all molecular components.
 * Molecules are groups of atoms bonded together, forming relatively simple
 * functional units.
 */

// Alert
export { Alert } from './Alert'
export type { AlertProps, AlertVariant } from './Alert'

// Author
export { Author } from './Author'
export type { AuthorProps } from './Author'

// VideoPlayer (shared HLS player)
export { VideoPlayer } from './VideoPlayer'
export type { VideoPlayerProps } from './VideoPlayer'
export type { VideoSubtitleCue } from './VideoPlayer'

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
export { ContentCarousel } from './blocks/ContentCarousel'
export type { ContentCarouselProps } from './blocks/ContentCarousel'
export { LayoutBlock } from './blocks/LayoutBlock'
export type { LayoutBlockProps } from './blocks/LayoutBlock'
export { TableOfContents } from './blocks/TableOfContents'
export type { TableOfContentsProps } from './blocks/TableOfContents'

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

// Embed
export { EmbedButton } from './EmbedButton'
export type { EmbedButtonProps } from './EmbedButton'

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
