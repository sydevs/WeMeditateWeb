import { ComponentProps } from 'react'
import { AudioPlayerProvider } from 'react-use-audio-player'
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
import { usePlaylistAudioPlayer } from '../../../hooks/audio'
import type { Track } from './types'
import { useT } from '../../../hooks/useT'

export type { Track } from './types'

export type AudioControl = 'skip' | 'shuffle' | 'volume' | 'progress' | 'trackInfo'

export interface AudioPlayerProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Array of audio tracks to play */
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

  /** Callback when track changes */
  onTrackChange?: (trackIndex: number) => void
}

/**
 * AudioPlayer is a molecule: a standalone audio player with configurable controls.
 *
 * Features:
 * - Built on react-use-audio-player (Howler.js) for reliable cross-browser audio
 * - Configurable controls through props
 * - Play/pause, previous, next controls
 * - Shuffle mode
 * - Volume control with mute
 * - Progress bar with time display
 * - Current track info display
 */
function AudioPlayerInner({
  tracks,
  shuffle = false,
  initialTrackIndex = 0,
  disabledControls = [],
  onTrackChange,
  className = '',
  ...props
}: AudioPlayerProps) {
  const t = useT()
  const [state, playerControls] = usePlaylistAudioPlayer({
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
                alt={state.currentTrack.title}
                aspectRatio="square"
                rounded="rounded"
                src={state.currentTrack.thumbnailURL}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {state.currentTrack.title}
              </h3>
              <a
                className="text-xs text-teal-600 hover:text-teal-700 truncate block"
                href={state.currentTrack.creditURL}
                rel="noopener noreferrer"
                target="_blank"
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
            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
            max={state.duration || 0}
            min="0"
            type="range"
            value={state.currentTime}
            onChange={(e) => playerControls.seek(parseFloat(e.target.value))}
          />
          <div className="flex justify-between text-xs font-number text-gray-700 mt-1">
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
              aria-label={t('media.a11y.previous_track')}
              icon={BackwardIcon}
              size="md"
              variant="ghost"
              onClick={playerControls.previous}
            />
          )}

          <Button
            aria-label={state.isPlaying ? t('media.a11y.pause') : t('media.a11y.play')}
            icon={state.isPlaying ? PauseIcon : PlayIcon}
            shape="circular"
            size="md"
            variant="primary"
            onClick={playerControls.togglePlayPause}
          />

          {hasControl('skip') && (
            <Button
              aria-label={t('media.a11y.next_track')}
              icon={ForwardIcon}
              size="md"
              variant="ghost"
              onClick={playerControls.next}
            />
          )}

          {hasControl('shuffle') && (
            <Button
              aria-label={t('media.a11y.toggle_shuffle')}
              aria-pressed={state.isShuffleOn}
              className={state.isShuffleOn ? 'text-teal-600 hover:text-teal-700' : ''}
              icon={ArrowsRightLeftIcon}
              size="md"
              variant="ghost"
              onClick={playerControls.toggleShuffle}
            />
          )}
        </div>

        {/* Volume Control */}
        {hasControl('volume') && (
          <div className="flex items-center gap-2">
            <Button
              aria-label={state.isMuted ? t('media.a11y.unmute') : t('media.a11y.mute')}
              icon={state.isMuted ? SpeakerXMarkIcon : SpeakerWaveIcon}
              size="md"
              variant="ghost"
              onClick={playerControls.toggleMute}
            />
            <input
              aria-label={t('media.a11y.volume')}
              className="w-20 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              max="1"
              min="0"
              step="0.01"
              type="range"
              value={state.isMuted ? 0 : state.volume}
              onChange={(e) => playerControls.setVolume(parseFloat(e.target.value))}
            />
          </div>
        )}
      </div>
    </div>
  )
}

/** AudioPlayer with AudioPlayerProvider context wrapper */
export function AudioPlayer(props: AudioPlayerProps) {
  return (
    <AudioPlayerProvider>
      <AudioPlayerInner {...props} />
    </AudioPlayerProvider>
  )
}
