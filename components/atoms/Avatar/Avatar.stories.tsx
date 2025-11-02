import type { Story, StoryDefault } from "@ladle/react";
import { Avatar } from "./Avatar";
import {
  StoryWrapper,
  StorySection,
  StoryGrid,
  StoryGridHeader,
  StoryGridHeaderRow,
  StoryGridHeaderCell,
  StoryGridBody,
  StoryGridRow,
  StoryGridCell,
  StoryExampleSection
} from '../../ladle';

export default {
  title: "Atoms / Media"
} satisfies StoryDefault;

/**
 * Avatar component showcasing all sizes, shapes, images, fallback initials, and usage in context.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Sizes">
      <div className="flex gap-4 items-center">
        <div className="flex flex-col items-center gap-2">
          <Avatar size="xs" alt="John Doe" />
          <p className="text-sm text-gray-600">xs</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Avatar size="sm" alt="John Doe" />
          <p className="text-sm text-gray-600">sm</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Avatar size="md" alt="John Doe" />
          <p className="text-sm text-gray-600">md</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Avatar size="lg" alt="John Doe" />
          <p className="text-sm text-gray-600">lg</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Avatar size="xl" alt="John Doe" />
          <p className="text-sm text-gray-600">xl</p>
        </div>
      </div>
    </StorySection>

    <StorySection title="Shapes">
      <StoryGrid>
        <StoryGridHeader>
          <StoryGridHeaderRow>
            <StoryGridHeaderCell />
            <StoryGridHeaderCell>Circle</StoryGridHeaderCell>
            <StoryGridHeaderCell>Rounded</StoryGridHeaderCell>
            <StoryGridHeaderCell>Square</StoryGridHeaderCell>
          </StoryGridHeaderRow>
        </StoryGridHeader>
        <StoryGridBody>
          <StoryGridRow>
            <StoryGridCell isLabel>With Images</StoryGridCell>
            <StoryGridCell>
              <Avatar
                size="lg"
                shape="circle"
                alt="User Avatar"
                src="https://picsum.photos/id/64/200/200"
              />
            </StoryGridCell>
            <StoryGridCell>
              <Avatar
                size="lg"
                shape="rounded"
                alt="User Avatar"
                src="https://picsum.photos/id/64/200/200"
              />
            </StoryGridCell>
            <StoryGridCell>
              <Avatar
                size="lg"
                shape="square"
                alt="User Avatar"
                src="https://picsum.photos/id/64/200/200"
              />
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Fallback Initials</StoryGridCell>
            <StoryGridCell>
              <Avatar size="lg" shape="circle" alt="John Doe" />
            </StoryGridCell>
            <StoryGridCell>
              <Avatar size="lg" shape="rounded" alt="John Doe" />
            </StoryGridCell>
            <StoryGridCell>
              <Avatar size="lg" shape="square" alt="John Doe" />
            </StoryGridCell>
          </StoryGridRow>
        </StoryGridBody>
      </StoryGrid>
    </StorySection>

    <StoryExampleSection>
      <div className="flex items-center gap-3">
        <Avatar
          size="md"
          alt="Shri Mataji Nirmala Devi"
          src="https://picsum.photos/id/64/200/200"
        />
        <div>
          <p className="font-medium text-gray-900">Shri Mataji Nirmala Devi</p>
          <p className="text-sm text-gray-600">Founder of Sahaja Yoga</p>
        </div>
      </div>
    </StoryExampleSection>

    <div />
  </StoryWrapper>
);
Default.storyName = "Avatar"
