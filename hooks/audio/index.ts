export { useAudioPlayer } from './useAudioPlayer'
export type {
  UseAudioPlayerOptions,
  AudioPlayerState,
  AudioPlayerControls,
} from './useAudioPlayer'

export { usePlaylistAudioPlayer } from './usePlaylistAudioPlayer'
export type { UsePlaylistAudioPlayerOptions } from './usePlaylistAudioPlayer'

// Re-export types from AudioPlayer component for convenience
export type {
  Track,
  PlaylistAudioPlayerState,
  PlaylistAudioPlayerControls,
} from '../../components/molecules/AudioPlayer/types'
