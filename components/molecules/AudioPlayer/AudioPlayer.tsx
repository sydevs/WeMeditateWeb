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
import { Button, Image, Link } from '../../atoms'
import type { PlaylistAudioPlayerState, PlaylistAudioPlayerControls } from './types'
import { useT } from '../../../hooks/useT'
import { formatDuration } from '../../../lib/duration'

export type { Track } from './types'

export type AudioControl = 'skip' | 'shuffle' | 'volume' | 'progress' | 'trackInfo'

export interface AudioPlayerProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Player state, from `usePlaylistAudioPlayer` */
  state: PlaylistAudioPlayerState

  /** Player controls, from `usePlaylistAudioPlayer` */
  controls: PlaylistAudioPlayerControls

  /**
   * Controls to disable in the player
   * @default []
   */
  disabledControls?: AudioControl[]
}

/**
 * AudioPlayer is a molecule: the transport controls for a playlist.
 *
 * It renders what `usePlaylistAudioPlayer` holds and calls back into it. The
 * owning component calls that hook, inside an `AudioPlayerProvider`, so the
 * playing track has one owner that the player, a playlist and album art all
 * read (#249).
 *
 * Features:
 * - Configurable controls through props
 * - Play/pause, previous, next controls
 * - Shuffle mode
 * - Volume control with mute
 * - Progress bar with time display
 * - Current track info display
 */
export function AudioPlayer({
  state,
  controls: playerControls,
  disabledControls = [],
  className = '',
  ...props
}: AudioPlayerProps) {
  const t = useT()

  const hasControl = (control: AudioControl) => {
    return !disabledControls.includes(control)
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
                // The 48px of `w-12 h-12` above.
                sizes="48px"
                src={state.currentTrack.thumbnailURL}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {state.currentTrack.title}
              </h3>
              <Link
                external
                className="text-xs truncate block"
                href={state.currentTrack.creditURL}
                variant="primary"
              >
                {state.currentTrack.credit}
              </Link>
            </div>
            {state.trackCount > 1 && (
              <div className="text-sm font-medium text-gray-700 whitespace-nowrap">
                {state.currentTrackIndex + 1} / {state.trackCount}
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
            <span>{formatDuration(state.currentTime)}</span>
            <span>{formatDuration(state.duration)}</span>
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
              // Howler's volume never clears its mute, and the slider reads 0
              // while muted, so without the unmute a drag snaps straight back.
              onChange={(e) => {
                playerControls.setVolume(parseFloat(e.target.value))
                playerControls.unmute()
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
