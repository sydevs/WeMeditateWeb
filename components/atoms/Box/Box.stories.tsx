import type { Story, StoryDefault } from '@ladle/react'
import { Box } from './Box'
import {
  StorySection,
  StoryWrapper,
  StoryGrid,
  StoryGridHeader,
  StoryGridHeaderRow,
  StoryGridHeaderCell,
  StoryGridBody,
  StoryGridRow,
  StoryGridCell,
} from '../../ladle'

export default {
  title: 'Atoms',
} satisfies StoryDefault

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
              <Box color="white" padding="md">
                <p>White</p>
              </Box>
            </StoryGridCell>
            <StoryGridCell>
              <Box color="gray" padding="md">
                <p>Gray</p>
              </Box>
            </StoryGridCell>
            <StoryGridCell>
              <Box color="primary" padding="md">
                <p>Primary</p>
              </Box>
            </StoryGridCell>
            <StoryGridCell>
              <Box color="secondary" padding="md">
                <p>Secondary</p>
              </Box>
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Bordered</StoryGridCell>
            <StoryGridCell>
              <Box border color="white" padding="md">
                <p>White</p>
              </Box>
            </StoryGridCell>
            <StoryGridCell>
              <Box border color="gray" padding="md">
                <p>Gray</p>
              </Box>
            </StoryGridCell>
            <StoryGridCell>
              <Box border color="primary" padding="md">
                <p>Primary</p>
              </Box>
            </StoryGridCell>
            <StoryGridCell>
              <Box border color="secondary" padding="md">
                <p>Secondary</p>
              </Box>
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Rounded</StoryGridCell>
            <StoryGridCell>
              <Box rounded color="white" padding="md">
                <p>White</p>
              </Box>
            </StoryGridCell>
            <StoryGridCell>
              <Box rounded color="gray" padding="md">
                <p>Gray</p>
              </Box>
            </StoryGridCell>
            <StoryGridCell>
              <Box rounded color="primary" padding="md">
                <p>Primary</p>
              </Box>
            </StoryGridCell>
            <StoryGridCell>
              <Box rounded color="secondary" padding="md">
                <p>Secondary</p>
              </Box>
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Both</StoryGridCell>
            <StoryGridCell>
              <Box border rounded color="white" padding="md">
                <p>White</p>
              </Box>
            </StoryGridCell>
            <StoryGridCell>
              <Box border rounded color="gray" padding="md">
                <p>Gray</p>
              </Box>
            </StoryGridCell>
            <StoryGridCell>
              <Box border rounded color="primary" padding="md">
                <p>Primary</p>
              </Box>
            </StoryGridCell>
            <StoryGridCell>
              <Box border rounded color="secondary" padding="md">
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
          <p className="text-sm text-gray-700 mb-2">Small</p>
          <Box color="gray" padding="sm">
            <p>Small padding</p>
          </Box>
        </div>
        <div>
          <p className="text-sm text-gray-700 mb-2">Medium</p>
          <Box color="gray" padding="md">
            <p>Medium padding</p>
          </Box>
        </div>
        <div>
          <p className="text-sm text-gray-700 mb-2">Large</p>
          <Box color="gray" padding="lg">
            <p>Large padding</p>
          </Box>
        </div>
      </div>
    </StorySection>

    <StorySection title="Shadows">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div>
          <p className="text-sm text-gray-700 mb-2">Small</p>
          <Box border color="white" padding="md" shadow="sm">
            <p>Small shadow</p>
          </Box>
        </div>
        <div>
          <p className="text-sm text-gray-700 mb-2">Medium</p>
          <Box border color="white" padding="md" shadow="md">
            <p>Medium shadow</p>
          </Box>
        </div>
        <div>
          <p className="text-sm text-gray-700 mb-2">Large</p>
          <Box border color="white" padding="md" shadow="lg">
            <p>Large shadow</p>
          </Box>
        </div>
      </div>
    </StorySection>

    <StorySection inContext={true} title="Examples">
      <div className="flex flex-col gap-8 max-w-3xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Box rounded color="white" padding="lg" shadow="md">
            <h4 className="font-semibold text-gray-900 mb-2">Morning Meditation</h4>
            <p className="text-gray-700 mb-3">Start your day with peace and clarity</p>
            <p className="text-sm text-teal-600">10 minutes</p>
          </Box>
          <Box rounded color="white" padding="lg" shadow="md">
            <h4 className="font-semibold text-gray-900 mb-2">Evening Practice</h4>
            <p className="text-gray-700 mb-3">Wind down and release the day's stress</p>
            <p className="text-sm text-teal-600">15 minutes</p>
          </Box>
        </div>

        <div className="space-y-3">
          <Box border rounded color="primary" padding="md">
            <p>
              <strong>Tip:</strong> For best results, practice meditation at the same time each day.
            </p>
          </Box>
          <Box border rounded color="gray" padding="md">
            <p>
              <strong>Note:</strong> This meditation is suitable for beginners and experienced
              practitioners.
            </p>
          </Box>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Box border rounded className="text-center" color="white" padding="md">
            <div className="text-3xl mb-2">🧘</div>
            <h5 className="font-medium text-gray-900 mb-1">Guided</h5>
            <p className="text-sm text-gray-700">Step-by-step guidance</p>
          </Box>
          <Box border rounded className="text-center" color="white" padding="md">
            <div className="text-3xl mb-2">⏱️</div>
            <h5 className="font-medium text-gray-900 mb-1">Flexible</h5>
            <p className="text-sm text-gray-700">5-60 minute sessions</p>
          </Box>
          <Box border rounded className="text-center" color="white" padding="md">
            <div className="text-3xl mb-2">🌟</div>
            <h5 className="font-medium text-gray-900 mb-1">Free</h5>
            <p className="text-sm text-gray-700">Always 100% free</p>
          </Box>
        </div>
      </div>
    </StorySection>
  </StoryWrapper>
)
Default.storyName = 'Box'
