export { useAudioPlayer } from './useAudioPlayer'
export type {
  UseAudioPlayerOptions,
  AudioPlayerState,
  AudioPlayerControls,
} from './useAudioPlayer'

export { usePlaylistAudioPlayer } from './usePlaylistAudioPlayer'
export type { UsePlaylistAudioPlayerOptions } from './usePlaylistAudioPlayer'

// Re-exports types from the AudioPlayer component
export type {
  Track,
  PlaylistAudioPlayerState,
  PlaylistAudioPlayerControls,
} from '../../components/molecules/AudioPlayer/types'
