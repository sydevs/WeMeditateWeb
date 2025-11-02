import type { Story, StoryDefault } from "@ladle/react";
import { Icon } from "./Icon";
import {
  HeartIcon,
  StarIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  PlayIcon,
  PauseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  InformationCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import {
  HeartIcon as HeartIconSolid,
  StarIcon as StarIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
  Bars3Icon as Bars3IconSolid,
  XMarkIcon as XMarkIconSolid,
  PlayIcon as PlayIconSolid,
  PauseIcon as PauseIconSolid,
  ChevronLeftIcon as ChevronLeftIconSolid,
  ChevronRightIcon as ChevronRightIconSolid,
  CheckIcon as CheckIconSolid,
  InformationCircleIcon as InformationCircleIconSolid,
  ClockIcon as ClockIconSolid,
} from '@heroicons/react/24/solid'
import {
  StorySection,
  StoryExampleSection,
  StorySubsection,
  StoryGrid,
  StoryGridHeader,
  StoryGridHeaderRow,
  StoryGridHeaderCell,
  StoryGridBody,
  StoryGridRow,
  StoryGridCell,
  StoryWrapper
} from '../../ladle';

export default {
  title: "Atoms / Media"
} satisfies StoryDefault;

/**
 * Icon component showcasing all sizes, colors, common icons, and usage in context.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Sizes">
      <div className="flex gap-6 items-center">
        <div className="flex flex-col items-center gap-2">
          <Icon icon={HeartIcon} size="xs" />
          <p className="text-sm text-gray-600">XS (3×3)</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon icon={HeartIcon} size="sm" />
          <p className="text-sm text-gray-600">Small (4×4)</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon icon={HeartIcon} size="md" />
          <p className="text-sm text-gray-600">Medium (5×5)</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon icon={HeartIcon} size="lg" />
          <p className="text-sm text-gray-600">Large (6×6)</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon icon={HeartIcon} size="xl" />
          <p className="text-sm text-gray-600">XL (8×8)</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon icon={HeartIcon} size="2xl" />
          <p className="text-sm text-gray-600">2XL (10×10)</p>
        </div>
      </div>
    </StorySection>

    <StorySection title="Colors">
      <StoryGrid>
        <StoryGridHeader>
          <StoryGridHeaderRow>
            <StoryGridHeaderCell />
            <StoryGridHeaderCell>Primary</StoryGridHeaderCell>
            <StoryGridHeaderCell>Secondary</StoryGridHeaderCell>
            <StoryGridHeaderCell>Tertiary</StoryGridHeaderCell>
            <StoryGridHeaderCell>Current Color</StoryGridHeaderCell>
          </StoryGridHeaderRow>
        </StoryGridHeader>
        <StoryGridBody>
          <StoryGridRow>
            <StoryGridCell isLabel>Outline</StoryGridCell>
            <StoryGridCell>
              <Icon icon={StarIcon} size="lg" color="primary" />
            </StoryGridCell>
            <StoryGridCell>
              <Icon icon={StarIcon} size="lg" color="secondary" />
            </StoryGridCell>
            <StoryGridCell>
              <Icon icon={StarIcon} size="lg" color="tertiary" />
            </StoryGridCell>
            <StoryGridCell>
              <div className="text-blue-600">
                <Icon icon={StarIcon} size="lg" color="currentColor" />
              </div>
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Solid</StoryGridCell>
            <StoryGridCell>
              <Icon icon={StarIconSolid} size="lg" color="primary" />
            </StoryGridCell>
            <StoryGridCell>
              <Icon icon={StarIconSolid} size="lg" color="secondary" />
            </StoryGridCell>
            <StoryGridCell>
              <Icon icon={StarIconSolid} size="lg" color="tertiary" />
            </StoryGridCell>
            <StoryGridCell>
              <div className="text-blue-600">
                <Icon icon={StarIconSolid} size="lg" color="currentColor" />
              </div>
            </StoryGridCell>
          </StoryGridRow>
        </StoryGridBody>
      </StoryGrid>
    </StorySection>

    <StorySection title="Outline Style">
      <div className="grid grid-cols-6 gap-6">
        <div className="flex flex-col items-center gap-2">
          <Icon icon={MagnifyingGlassIcon} size="lg" />
          <p className="text-xs text-gray-600">Search</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon icon={Bars3Icon} size="lg" />
          <p className="text-xs text-gray-600">Menu</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon icon={XMarkIcon} size="lg" />
          <p className="text-xs text-gray-600">Close</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon icon={HeartIcon} size="lg" />
          <p className="text-xs text-gray-600">Heart</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon icon={StarIcon} size="lg" />
          <p className="text-xs text-gray-600">Star</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon icon={PlayIcon} size="lg" />
          <p className="text-xs text-gray-600">Play</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon icon={PauseIcon} size="lg" />
          <p className="text-xs text-gray-600">Pause</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon icon={ChevronLeftIcon} size="lg" />
          <p className="text-xs text-gray-600">Chevron Left</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon icon={ChevronRightIcon} size="lg" />
          <p className="text-xs text-gray-600">Chevron Right</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon icon={CheckIcon} size="lg" />
          <p className="text-xs text-gray-600">Check</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon icon={InformationCircleIcon} size="lg" />
          <p className="text-xs text-gray-600">Info</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon icon={ClockIcon} size="lg" />
          <p className="text-xs text-gray-600">Clock</p>
        </div>
      </div>
    </StorySection>

    <StorySection title="Solid Style">
      <div className="grid grid-cols-6 gap-6">
        <div className="flex flex-col items-center gap-2">
          <Icon icon={MagnifyingGlassIconSolid} size="lg" />
          <p className="text-xs text-gray-600">Search</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon icon={Bars3IconSolid} size="lg" />
          <p className="text-xs text-gray-600">Menu</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon icon={XMarkIconSolid} size="lg" />
          <p className="text-xs text-gray-600">Close</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon icon={HeartIconSolid} size="lg" />
          <p className="text-xs text-gray-600">Heart</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon icon={StarIconSolid} size="lg" />
          <p className="text-xs text-gray-600">Star</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon icon={PlayIconSolid} size="lg" />
          <p className="text-xs text-gray-600">Play</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon icon={PauseIconSolid} size="lg" />
          <p className="text-xs text-gray-600">Pause</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon icon={ChevronLeftIconSolid} size="lg" />
          <p className="text-xs text-gray-600">Chevron Left</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon icon={ChevronRightIconSolid} size="lg" />
          <p className="text-xs text-gray-600">Chevron Right</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon icon={CheckIconSolid} size="lg" />
          <p className="text-xs text-gray-600">Check</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon icon={InformationCircleIconSolid} size="lg" />
          <p className="text-xs text-gray-600">Info</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon icon={ClockIconSolid} size="lg" />
          <p className="text-xs text-gray-600">Clock</p>
        </div>
      </div>
    </StorySection>

    <StoryExampleSection>
      <StorySubsection label="Button with Icons">
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600">
            <Icon icon={PlayIcon} size="sm" />
            <span>Play</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
            <Icon icon={HeartIcon} size="sm" />
            <span>Like</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
            <span>Next</span>
            <Icon icon={ChevronRightIcon} size="sm" />
          </button>
        </div>
      </StorySubsection>

      <StorySubsection label="List Items with Icons">
        <ul className="space-y-3">
          <li className="flex items-center gap-3">
            <Icon icon={CheckIcon} size="md" color="primary" />
            <span className="text-gray-700">Reduce stress and anxiety</span>
          </li>
          <li className="flex items-center gap-3">
            <Icon icon={CheckIcon} size="md" color="primary" />
            <span className="text-gray-700">Improve focus and concentration</span>
          </li>
          <li className="flex items-center gap-3">
            <Icon icon={CheckIcon} size="md" color="primary" />
            <span className="text-gray-700">Enhance emotional well-being</span>
          </li>
          <li className="flex items-center gap-3">
            <Icon icon={CheckIcon} size="md" color="primary" />
            <span className="text-gray-700">Better sleep quality</span>
          </li>
        </ul>
      </StorySubsection>

      <StorySubsection label="Information Cards">
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-teal-200 bg-teal-50 rounded-lg p-4 flex gap-3">
            <Icon icon={InformationCircleIcon} size="lg" color="primary" />
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Beginner Friendly</h4>
              <p className="text-sm text-gray-700">Perfect for those new to meditation</p>
            </div>
          </div>
          <div className="border border-coral-200 bg-coral-50 rounded-lg p-4 flex gap-3">
            <Icon icon={ClockIcon} size="lg" color="secondary" />
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Quick Session</h4>
              <p className="text-sm text-gray-700">Just 10 minutes a day</p>
            </div>
          </div>
        </div>
      </StorySubsection>
    </StoryExampleSection>
  </StoryWrapper>
);
Default.storyName = "Icon"
