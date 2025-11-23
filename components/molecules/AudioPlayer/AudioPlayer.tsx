import { ComponentProps } from 'react'
import {
  PlayIcon,
  PauseIcon,
  BackwardIcon,
  ForwardIcon,
  ArrowsRightLeftIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from '@heroicons/react/24/outline'
import { Button, Image } from '../../atoms'
import { useAudioPlayer, Track } from './useAudioPlayer'

export type { Track } from './useAudioPlayer'

export type AudioControl = 'skip' | 'shuffle' | 'volume' | 'progress' | 'trackInfo'

export interface AudioPlayerProps extends Omit<ComponentProps<'div'>, 'children'> {
  /**
   * Array of audio tracks to play
   */
  tracks: Track[]

  /**
   * Whether to enable shuffle mode (automatically removes shuffle control)
   * @default false
   */
  shuffle?: boolean

  /**
   * Initial track index to play
   * @default 0
   */
  initialTrackIndex?: number

  /**
   * Controls to disable in the player
   * @default []
   */
  disabledControls?: AudioControl[]

  /**
   * Callback when track changes
   */
  onTrackChange?: (trackIndex: number) => void
}

/**
 * AudioPlayer molecule - Standalone audio player with configurable controls
 *
 * Features:
 * - Lightweight custom hook for audio management
 * - Configurable controls via props
 * - Play/pause, previous, next controls
 * - Shuffle mode
 * - Volume control with mute
 * - Progress bar with time display
 * - Current track info display
 */
export function AudioPlayer({
  tracks,
  shuffle = false,
  initialTrackIndex = 0,
  disabledControls = [],
  onTrackChange,
  className = '',
  ...props
}: AudioPlayerProps) {
  const [state, playerControls] = useAudioPlayer({
    tracks,
    shuffle,
    initialTrackIndex,
    onTrackChange,
  })

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Add shuffle to disabled controls when shuffle is enabled
  const effectiveDisabledControls = shuffle
    ? [...disabledControls, 'shuffle' as AudioControl]
    : disabledControls

  const hasControl = (control: AudioControl) => {
    return !effectiveDisabledControls.includes(control)
  }

  return (
    <div className={`w-full ${className}`} {...props}>
      {/* Current Track Info */}
      {hasControl('trackInfo') && (
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12">
              <Image
                src={state.currentTrack.thumbnailURL}
                alt={state.currentTrack.title}
                aspectRatio="square"
                rounded="rounded"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {state.currentTrack.title}
              </h3>
              <a
                href={state.currentTrack.creditURL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-teal-600 hover:text-teal-700 truncate block"
              >
                {state.currentTrack.credit}
              </a>
            </div>
            {tracks.length > 1 && (
              <div className="text-sm font-medium text-gray-700 whitespace-nowrap">
                {state.currentTrackIndex + 1} / {tracks.length}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {hasControl('progress') && (
        <div className="mb-3">
          <input
            type="range"
            min="0"
            max={state.duration || 0}
            value={state.currentTime}
            onChange={(e) => playerControls.seek(parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
          />
          <div className="flex justify-between text-xs font-number text-gray-600 mt-1">
            <span>{formatTime(state.currentTime)}</span>
            <span>{formatTime(state.duration)}</span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          {hasControl('skip') && (
            <Button
              icon={BackwardIcon}
              variant="ghost"
              size="md"
              onClick={playerControls.previous}
              aria-label="Previous track"
            />
          )}

          <Button
            icon={state.isPlaying ? PauseIcon : PlayIcon}
            variant="primary"
            shape="circular"
            size="md"
            onClick={playerControls.togglePlayPause}
            aria-label={state.isPlaying ? 'Pause' : 'Play'}
          />

          {hasControl('skip') && (
            <Button
              icon={ForwardIcon}
              variant="ghost"
              size="md"
              onClick={playerControls.next}
              aria-label="Next track"
            />
          )}

          {hasControl('shuffle') && (
            <Button
              icon={ArrowsRightLeftIcon}
              variant="ghost"
              size="md"
              onClick={playerControls.toggleShuffle}
              aria-label="Toggle shuffle"
              aria-pressed={state.isShuffleOn}
              className={state.isShuffleOn ? 'text-teal-600 hover:text-teal-700' : ''}
            />
          )}
        </div>

        {/* Volume Control */}
        {hasControl('volume') && (
          <div className="flex items-center gap-2">
            <Button
              icon={state.isMuted ? SpeakerXMarkIcon : SpeakerWaveIcon}
              variant="ghost"
              size="md"
              onClick={playerControls.toggleMute}
              aria-label={state.isMuted ? 'Unmute' : 'Mute'}
            />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={state.isMuted ? 0 : state.volume}
              onChange={(e) => playerControls.setVolume(parseFloat(e.target.value))}
              className="w-20 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              aria-label="Volume"
            />
          </div>
        )}
      </div>
    </div>
  )
}
