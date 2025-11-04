import type { Story, StoryDefault } from "@ladle/react";
import { Box } from "./Box";
import {
  StorySection,
  StoryWrapper,
  StoryGrid,
  StoryGridHeader,
  StoryGridHeaderRow,
  StoryGridHeaderCell,
  StoryGridBody,
  StoryGridRow,
  StoryGridCell
} from '../../ladle';

export default {
  title: "Atoms / Layout"
} satisfies StoryDefault;

/**
 * Box component showcasing all color variants, borders, rounded corners, padding, shadows, and usage in context.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Variants">
      <StoryGrid>
        <StoryGridHeader>
          <StoryGridHeaderRow>
            <StoryGridHeaderCell />
            <StoryGridHeaderCell>White</StoryGridHeaderCell>
            <StoryGridHeaderCell>Gray</StoryGridHeaderCell>
            <StoryGridHeaderCell>Primary</StoryGridHeaderCell>
            <StoryGridHeaderCell>Secondary</StoryGridHeaderCell>
          </StoryGridHeaderRow>
        </StoryGridHeader>
        <StoryGridBody>
          <StoryGridRow>
            <StoryGridCell isLabel>Simple</StoryGridCell>
            <StoryGridCell>
              <Box padding="md" color="white">
                <p>White</p>
              </Box>
            </StoryGridCell>
            <StoryGridCell>
              <Box padding="md" color="gray">
                <p>Gray</p>
              </Box>
            </StoryGridCell>
            <StoryGridCell>
              <Box padding="md" color="primary">
                <p>Primary</p>
              </Box>
            </StoryGridCell>
            <StoryGridCell>
              <Box padding="md" color="secondary">
                <p>Secondary</p>
              </Box>
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Bordered</StoryGridCell>
            <StoryGridCell>
              <Box padding="md" color="white" border>
                <p>White</p>
              </Box>
            </StoryGridCell>
            <StoryGridCell>
              <Box padding="md" color="gray" border>
                <p>Gray</p>
              </Box>
            </StoryGridCell>
            <StoryGridCell>
              <Box padding="md" color="primary" border>
                <p>Primary</p>
              </Box>
            </StoryGridCell>
            <StoryGridCell>
              <Box padding="md" color="secondary" border>
                <p>Secondary</p>
              </Box>
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Rounded</StoryGridCell>
            <StoryGridCell>
              <Box padding="md" color="white" rounded>
                <p>White</p>
              </Box>
            </StoryGridCell>
            <StoryGridCell>
              <Box padding="md" color="gray" rounded>
                <p>Gray</p>
              </Box>
            </StoryGridCell>
            <StoryGridCell>
              <Box padding="md" color="primary" rounded>
                <p>Primary</p>
              </Box>
            </StoryGridCell>
            <StoryGridCell>
              <Box padding="md" color="secondary" rounded>
                <p>Secondary</p>
              </Box>
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Both</StoryGridCell>
            <StoryGridCell>
              <Box padding="md" color="white" border rounded>
                <p>White</p>
              </Box>
            </StoryGridCell>
            <StoryGridCell>
              <Box padding="md" color="gray" border rounded>
                <p>Gray</p>
              </Box>
            </StoryGridCell>
            <StoryGridCell>
              <Box padding="md" color="primary" border rounded>
                <p>Primary</p>
              </Box>
            </StoryGridCell>
            <StoryGridCell>
              <Box padding="md" color="secondary" border rounded>
                <p>Secondary</p>
              </Box>
            </StoryGridCell>
          </StoryGridRow>
        </StoryGridBody>
      </StoryGrid>
    </StorySection>

    <StorySection title="Padding">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">Small</p>
          <Box padding="sm" color="gray">
            <p>Small padding</p>
          </Box>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2">Medium</p>
          <Box padding="md" color="gray">
            <p>Medium padding</p>
          </Box>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2">Large</p>
          <Box padding="lg" color="gray">
            <p>Large padding</p>
          </Box>
        </div>
      </div>
    </StorySection>

    <StorySection title="Shadows">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div>
          <p className="text-sm text-gray-600 mb-2">Small</p>
          <Box padding="md" shadow="sm" color="white" border>
            <p>Small shadow</p>
          </Box>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2">Medium</p>
          <Box padding="md" shadow="md" color="white" border>
            <p>Medium shadow</p>
          </Box>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2">Large</p>
          <Box padding="md" shadow="lg" color="white" border>
            <p>Large shadow</p>
          </Box>
        </div>
      </div>
    </StorySection>

    <StorySection title="Examples" inContext={true}>
      <div className="flex flex-col gap-8 max-w-3xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Box padding="lg" shadow="md" color="white" rounded>
            <h4 className="font-semibold text-gray-900 mb-2">Morning Meditation</h4>
            <p className="text-gray-700 mb-3">Start your day with peace and clarity</p>
            <p className="text-sm text-teal-600">10 minutes</p>
          </Box>
          <Box padding="lg" shadow="md" color="white" rounded>
            <h4 className="font-semibold text-gray-900 mb-2">Evening Practice</h4>
            <p className="text-gray-700 mb-3">Wind down and release the day's stress</p>
            <p className="text-sm text-teal-600">15 minutes</p>
          </Box>
        </div>

        <div className="space-y-3">
          <Box padding="md" color="primary" border rounded>
            <p>
              <strong>Tip:</strong> For best results, practice meditation at the same time each day.
            </p>
          </Box>
          <Box padding="md" color="gray" border rounded>
            <p>
              <strong>Note:</strong> This meditation is suitable for beginners and experienced practitioners.
            </p>
          </Box>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Box padding="md" color="white" border rounded className="text-center">
            <div className="text-3xl mb-2">🧘</div>
            <h5 className="font-medium text-gray-900 mb-1">Guided</h5>
            <p className="text-sm text-gray-600">Step-by-step guidance</p>
          </Box>
          <Box padding="md" color="white" border rounded className="text-center">
            <div className="text-3xl mb-2">⏱️</div>
            <h5 className="font-medium text-gray-900 mb-1">Flexible</h5>
            <p className="text-sm text-gray-600">5-60 minute sessions</p>
          </Box>
          <Box padding="md" color="white" border rounded className="text-center">
            <div className="text-3xl mb-2">🌟</div>
            <h5 className="font-medium text-gray-900 mb-1">Free</h5>
            <p className="text-sm text-gray-600">Always 100% free</p>
          </Box>
        </div>
      </div>
    </StorySection>
  </StoryWrapper>
);
Default.storyName = "Box"
