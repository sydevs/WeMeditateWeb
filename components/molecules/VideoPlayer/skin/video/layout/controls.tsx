/** @jsxImportSource react */

import { Controls, BufferingIndicator, Time, Tooltip } from '@videojs/react'
import { use, type ComponentProps } from 'react'

// wm: the clip window's own time UI. Video.js 10 has no clipping, so a lecture clip's timeline
// is this repo's to draw (videojs/video.js#3040).
import { ClipDuration, ClipElapsed, ClipTimeSlider, ClipWindowContext } from '../../../clip-window'

import { AirPlayButton } from '../../ui/airplay-button'
import { ButtonTooltip } from '../../ui/button-tooltip'
import { CaptionsButton } from '../../ui/captions-button'
import { CastButton } from '../../ui/cast-button'
import { FullscreenButton } from '../../ui/fullscreen-button'
import { PiPButton } from '../../ui/pip-button'
import { PlayButton } from '../../ui/play-button'
import { SeekButton } from '../../ui/seek-button'
import { TimeSlider } from '../../ui/time-slider'
import { VolumePopover } from '../../ui/volume-popover'
import { cn } from '../../lib/resolve-class-name'

import { VideoSettingsMenu } from '../menus/settings-menu'

export interface DefaultVideoControlsProps {
  renderThumbnail?: NonNullable<ComponentProps<typeof TimeSlider>>['renderThumbnail']
}

export function DefaultVideoControls({ renderThumbnail }: DefaultVideoControlsProps = {}) {
  // wm: a window replaces the three time controls below; `null` leaves the skin as it ships.
  const clip = use(ClipWindowContext)

  return (
    <Controls.Root>
      <BufferingIndicator className={'group/buffering contents'}>
        <Controls.Group
          className={cn(
            'group/center pointer-events-none absolute top-1/2 left-1/2 z-30 flex -translate-1/2 items-center rtl:flex-row-reverse gap-6',
            'transition-[filter,opacity,scale] duration-media-controls-enter ease-out',
            'not-data-visible:opacity-0 not-data-visible:scale-media-hidden not-data-visible:duration-media-controls',
            'pointer-fine:not-data-visible:blur-media-hidden',
            'group-data-visible/buffering:hidden',
          )}
        >
          <SeekButton
            className={cn(
              'pointer-events-auto group-not-data-visible/center:pointer-events-none',
              'media-max-2xs:hidden! pointer-fine:hidden! group-not-data-started/center:hidden!',
              'rounded-media-pill! bg-media-backdrop/35! text-media-controls-foreground! backdrop-filter-media-indicator',
              'media-high-contrast:bg-media-background!',
            )}
            seconds={-10}
          />
          <PlayButton
            className={cn(
              'pointer-events-auto group-not-data-visible/center:pointer-events-none',
              'rounded-media-pill!',
              'size-auto! p-4! media-max-360:p-3!',
              // wm: at a container under 360px the skin shrinks both the icon and the padding,
              // which measured 42x42 — under the 44x44 this project requires
              // (docs/rules/design-system.md). The floor is the control size every other button
              // already takes.
              'min-h-media-control! min-w-media-control!',
              'bg-media-primary! text-media-primary-foreground! media-high-contrast:bg-media-primary!',
              'hover:bg-[color-mix(in_oklab,var(--media-primary)_85%,var(--media-primary-foreground))]!',
              'focus-visible:bg-[color-mix(in_oklab,var(--media-primary)_85%,var(--media-primary-foreground))]!',
              'pointer-fine:data-started:not-focus-visible:opacity-0!',
              'pointer-fine:data-started:not-focus-visible:pointer-events-none!',
            )}
            iconClassName={'size-media-icon-lg! media-max-360:size-media-icon!'}
          />
          <SeekButton
            className={cn(
              'pointer-events-auto group-not-data-visible/center:pointer-events-none',
              'media-max-2xs:hidden! pointer-fine:hidden! group-not-data-started/center:hidden!',
              'rounded-media-pill! bg-media-backdrop/35! text-media-controls-foreground! backdrop-filter-media-indicator',
              'media-high-contrast:bg-media-background!',
            )}
            seconds={10}
          />
        </Controls.Group>
      </BufferingIndicator>
      <Controls.Backdrop
        className={cn(
          'pointer-events-none absolute inset-0 z-10 rounded-[inherit]',
          'bg-(image:--media-controls-gradient) bg-bottom bg-no-repeat bg-size-[100%_var(--media-controls-bottom-gradient-height)]',
          'transition-opacity duration-media-controls ease-out not-data-visible:opacity-0',
          'not-data-started:[visibility:var(--media-controls-before-start,hidden)]',
          'media-before-start-fade:not-data-started:opacity-0',
          'media-max-lg:before:absolute media-max-lg:before:inset-x-0 media-max-lg:before:top-0',
          'media-max-lg:before:h-(--media-controls-gradient-height) media-max-lg:before:bg-(image:--media-controls-top-gradient)',
        )}
      />
      <Controls.Content
        className={cn(
          'video-controls',
          'group/controls text-media-controls-foreground text-shadow-media',
          'duration-media-controls-enter ease-out',
          'not-data-started:[visibility:var(--media-controls-before-start,hidden)]',
          'media-before-start-fade:not-data-started:opacity-0',
          'contents p-1 transition-[filter,opacity,scale,translate]',
          'media-lg:absolute media-lg:inset-x-2 media-lg:bottom-2 media-lg:z-30',
          'media-lg:flex media-lg:items-center media-lg:rtl:flex-row-reverse media-lg:rounded-media-controls',
          'media-lg:bg-media-popover media-lg:text-media-popover-foreground',
          'media-lg:surface-media media-lg:after:surface-media-inset',
          'media-2xl:inset-x-3 media-2xl:bottom-3',
          'media-lg:not-data-visible:pointer-events-none media-lg:not-data-visible:opacity-0',
          'media-lg:not-data-visible:scale-media-hidden media-lg:not-data-visible:translate-y-media-hidden-offset',
          'media-lg:pointer-fine:not-data-visible:blur-media-hidden',
          'media-lg:not-data-visible:duration-media-controls',
        )}
      >
        <Tooltip.Provider>
          <Controls.Group
            className={cn(
              'absolute inset-x-2 bottom-2 z-30 flex origin-bottom items-center rtl:flex-row-reverse rounded-media-controls p-0.5',
              'media-max-lg:bg-media-popover media-max-lg:text-media-popover-foreground',
              'media-max-lg:surface-media media-max-lg:after:surface-media-inset',
              'media-lg:contents',
              'media-max-lg:group-[:not([data-visible])]/controls:pointer-events-none',
              'media-max-lg:group-[:not([data-visible])]/controls:opacity-0',
              'media-max-lg:group-[:not([data-visible])]/controls:scale-media-hidden',
              'media-max-lg:pointer-fine:group-[:not([data-visible])]/controls:blur-media-hidden',
              'transition-[filter,opacity,scale,translate] duration-media-controls-enter ease-out',
              'media-max-lg:group-[:not([data-visible])]/controls:duration-media-controls',
              'media-max-lg:group-[:not([data-visible])]/controls:translate-y-media-hidden-offset',
              'media-max-4xs:right-auto!',
            )}
          >
            <ButtonTooltip side="top">
              <PlayButton />
            </ButtonTooltip>
            <VolumePopover className={'ms-px'} />

            <Controls.Group
              className={cn(
                'flex flex-1 items-center rtl:flex-row-reverse gap-2.5 px-2 media-lg:px-3',
                'media-max-3xs:pr-3.5',
                'media-max-4xs:flex-none',
              )}
            >
              {/* wm: the window's elapsed time, from 0:00, in place of the media position. */}
              {clip ? (
                <ClipElapsed
                  className={cn('tabular-nums', 'media-4xs:media-max-2xs:hidden!')}
                  window={clip}
                />
              ) : (
                <Time.Value
                  className={cn(
                    'tabular-nums transition-opacity duration-media-slow ease-out data-unavailable:opacity-50',
                    'media-4xs:media-max-2xs:hidden!',
                  )}
                  type="current"
                />
              )}
              {/* wm: the window's own scale, so the scrubber runs 0:00 to its length. */}
              {clip ? (
                <ClipTimeSlider className={'min-w-0! media-max-4xs:hidden'} window={clip} />
              ) : (
                <TimeSlider
                  className={'min-w-0! media-max-4xs:hidden'}
                  renderThumbnail={renderThumbnail}
                />
              )}
              {/* wm: the window's length. A toggle to remaining would contradict nothing the
                  skin shows, but it is machinery the window does not need. */}
              {clip ? (
                <ClipDuration className={cn('tabular-nums', 'media-max-sm:hidden')} window={clip} />
              ) : (
                <Time.Value
                  toggle
                  className={cn(
                    'cursor-pointer rounded-sm tabular-nums focus-ring-media',
                    'aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
                    'transition-[outline-color,outline-offset] duration-media-fast ease-out',
                    'focus-visible:outline-media-ring focus-visible:outline-offset-2',
                    'media-max-sm:hidden',
                  )}
                  type="remaining"
                />
              )}
            </Controls.Group>

            <ButtonTooltip side="top">
              <CaptionsButton className={'media-max-lg:hidden'} />
            </ButtonTooltip>
            <VideoSettingsMenu className={'media-lg:ms-px media-max-3xs:hidden'} />
          </Controls.Group>

          <Controls.Group
            className={cn(
              'absolute top-2 right-2 z-30 flex origin-top items-center rtl:flex-row-reverse gap-px rounded-media-controls p-0.5',
              'media-max-lg:bg-media-popover media-max-lg:text-media-popover-foreground',
              'media-max-lg:surface-media media-max-lg:after:surface-media-inset',
              'media-lg:static media-lg:p-0',
              'media-max-lg:group-[:not([data-visible])]/controls:pointer-events-none',
              'media-max-lg:group-[:not([data-visible])]/controls:opacity-0',
              'media-max-lg:group-[:not([data-visible])]/controls:scale-media-hidden',
              'media-max-lg:pointer-fine:group-[:not([data-visible])]/controls:blur-media-hidden',
              'transition-[filter,opacity,scale,translate] duration-media-controls-enter ease-out',
              'media-max-lg:group-[:not([data-visible])]/controls:duration-media-controls',
              'media-max-lg:group-[:not([data-visible])]/controls:-translate-y-media-hidden-offset',
              'media-max-4xs:hidden',
            )}
          >
            <ButtonTooltip side="top">
              <CastButton />
            </ButtonTooltip>
            <ButtonTooltip side="top">
              <AirPlayButton />
            </ButtonTooltip>
            <ButtonTooltip side="top">
              <PiPButton />
            </ButtonTooltip>
            <ButtonTooltip side="top">
              <FullscreenButton />
            </ButtonTooltip>
          </Controls.Group>
        </Tooltip.Provider>
      </Controls.Content>
    </Controls.Root>
  )
}
