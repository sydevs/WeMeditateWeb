import type { Story, StoryDefault } from "@ladle/react";
import { Badge } from "./Badge";
import { HeartIcon, BellIcon, StarIcon } from '@heroicons/react/24/solid';
import {
  StoryWrapper,
  StorySection,
  StoryGrid,
  StoryGridHeader,
  StoryGridHeaderRow,
  StoryGridHeaderCell,
  StoryGridBody,
  StoryGridRow,
  StoryGridCell
} from '../../ladle';

export default {
  title: "Atoms / Specialty"
} satisfies StoryDefault;

/**
 * Badge component showcasing all color variants, shapes, and usage examples.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Shapes × Colors">
      <StoryGrid>
        <StoryGridHeader>
          <StoryGridHeaderRow>
            <StoryGridHeaderCell />
            <StoryGridHeaderCell>Square</StoryGridHeaderCell>
            <StoryGridHeaderCell>Circular</StoryGridHeaderCell>
          </StoryGridHeaderRow>
        </StoryGridHeader>
        <StoryGridBody>
          <StoryGridRow>
            <StoryGridCell isLabel>Primary</StoryGridCell>
            <StoryGridCell>
              <Badge color="primary" shape="square">10 min</Badge>
            </StoryGridCell>
            <StoryGridCell>
              <Badge color="primary" shape="circular">10 min</Badge>
            </StoryGridCell>
          </StoryGridRow>
          <StoryGridRow>
            <StoryGridCell isLabel>Secondary</StoryGridCell>
            <StoryGridCell>
              <Badge color="secondary" shape="square">New</Badge>
            </StoryGridCell>
            <StoryGridCell>
              <Badge color="secondary" shape="circular">New</Badge>
            </StoryGridCell>
          </StoryGridRow>
          <StoryGridRow>
            <StoryGridCell isLabel>Neutral</StoryGridCell>
            <StoryGridCell>
              <Badge color="neutral" shape="square">15 min</Badge>
            </StoryGridCell>
            <StoryGridCell>
              <Badge color="neutral" shape="circular">15 min</Badge>
            </StoryGridCell>
          </StoryGridRow>
        </StoryGridBody>
      </StoryGrid>
    </StorySection>

    <StorySection title="Sizes">
      <div className="flex items-center gap-3">
        <Badge size="sm">Small</Badge>
        <Badge size="md">Medium</Badge>
        <Badge size="lg">Large</Badge>
      </div>
    </StorySection>

    <StorySection title="Examples" inContext={true}>
      <div className="flex flex-col gap-6">
        <StorySection title="Duration labels" variant="subsection">
          <div className="flex gap-2">
            <Badge color="neutral" shape="circular">5 min</Badge>
            <Badge color="neutral" shape="circular">10 min</Badge>
            <Badge color="neutral" shape="circular">15 min</Badge>
            <Badge color="neutral" shape="circular">20 min</Badge>
          </div>
        </StorySection>

        <StorySection title="Notification counts" variant="subsection">
          <div className="flex gap-2">
            <Badge color="primary" shape="circular">3</Badge>
            <Badge color="primary" shape="circular">12</Badge>
            <Badge color="secondary" shape="circular">99+</Badge>
          </div>
        </StorySection>

        <StorySection title="Status indicators" variant="subsection">
          <div className="flex gap-2">
            <Badge color="secondary" shape="square">New</Badge>
            <Badge color="primary" shape="square">Featured</Badge>
            <Badge color="neutral" shape="square">Popular</Badge>
          </div>
        </StorySection>

        <StorySection title="Icons" variant="subsection">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Badge color="primary" shape="circular">
                24
                <HeartIcon className="w-3 h-3 ml-1" />
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge color="secondary" shape="circular">
                <BellIcon className="w-3 h-3 mr-1" />
                5
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge color="neutral" shape="square">
                <StarIcon className="w-3 h-3 mr-1" />
                Pro
              </Badge>
            </div>
          </div>
        </StorySection>

        <StorySection title="On a card with thumbnail" variant="subsection">
          <div className="relative w-64 h-40 bg-gray-200 rounded flex items-center justify-center">
            <span className="text-gray-500">Thumbnail Image</span>
            <div className="absolute bottom-2 left-2">
              <Badge color="primary" shape="circular">
                10 min
              </Badge>
            </div>
          </div>
        </StorySection>

        <StorySection title="On dark backgrounds" variant="subsection">
          <div className="bg-gray-800 p-6 rounded-lg space-y-4">
            <div className="flex gap-2">
              <Badge color="primary" shape="circular">5 min</Badge>
              <Badge color="secondary" shape="circular">New</Badge>
              <Badge color="neutral" shape="square">Popular</Badge>
            </div>
            <div className="relative w-64 h-40 bg-gray-900 rounded flex items-center justify-center">
              <span className="text-gray-400">Dark Thumbnail</span>
              <div className="absolute bottom-2 left-2">
                <Badge color="primary" shape="circular">
                  15 min
                </Badge>
              </div>
            </div>
          </div>
        </StorySection>
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
);

Default.storyName = "Badge"
