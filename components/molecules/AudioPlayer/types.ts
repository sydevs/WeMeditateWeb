/**
 * Represents an audio track with metadata for display and playback
 */
export interface Track {
  /** Audio file URL (MP3, etc.) */
  url: string
  /** Track title/name */
  title: string
  /** Artist/creator name */
  credit: string
  /** Link to credit (external) */
  creditURL: string
  /** Album art/thumbnail image URL */
  thumbnailURL: string
  /** Duration in seconds */
  duration: number
  /** Optional tags for filtering in playlists */
  tags?: string[]
}

/**
 * State returned by usePlaylistAudioPlayer hook
 */
export interface PlaylistAudioPlayerState {
  /** Current track index in the tracks array */
  currentTrackIndex: number
  /** Whether audio is currently playing */
  isPlaying: boolean
  /** Current playback position in seconds */
  currentTime: number
  /** Total track duration in seconds */
  duration: number
  /** Volume level (0-1) */
  volume: number
  /** Whether audio is muted */
  isMuted: boolean
  /** Whether shuffle mode is enabled */
  isShuffleOn: boolean
  /** The current Track object */
  currentTrack: Track
  /** Whether audio is loading/buffering */
  isLoading: boolean
  /** Whether the current track has ended */
  hasEnded: boolean
}

/**
 * Controls returned by usePlaylistAudioPlayer hook
 */
export interface PlaylistAudioPlayerControls {
  /** Start playback */
  play: () => void
  /** Pause playback */
  pause: () => void
  /** Toggle between play and pause */
  togglePlayPause: () => void
  /** Go to previous track (respects shuffle order) */
  previous: () => void
  /** Go to next track (respects shuffle order) */
  next: () => void
  /** Seek to a specific time in seconds */
  seek: (time: number) => void
  /** Set volume (0-1) */
  setVolume: (volume: number) => void
  /** Toggle mute on/off */
  toggleMute: () => void
  /** Toggle shuffle mode on/off */
  toggleShuffle: () => void
  /** Jump to a specific track by index */
  selectTrack: (index: number) => void
}
