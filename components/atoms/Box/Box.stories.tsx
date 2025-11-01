import type { Story, StoryDefault } from "@ladle/react";
import { Box } from "./Box";

export default {
  title: "Atoms / Layout"
} satisfies StoryDefault;

/**
 * Box component showcasing all padding, backgrounds, borders, shadows, and usage in context.
 */
export const Default: Story = () => (
  <div className="flex flex-col gap-8">
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Padding Options</h3>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">Small</p>
          <Box padding="sm" className="bg-gray-100">
            <p className="text-gray-700">Small padding</p>
          </Box>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2">Medium</p>
          <Box padding="md" className="bg-gray-100">
            <p className="text-gray-700">Medium padding</p>
          </Box>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2">Large</p>
          <Box padding="lg" className="bg-gray-100">
            <p className="text-gray-700">Large padding</p>
          </Box>
        </div>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Background Colors</h3>
      <div className="grid grid-cols-4 gap-4">
        <Box padding="md" background="white" border>
          <p className="text-gray-700">White</p>
        </Box>
        <Box padding="md" background="light">
          <p className="text-gray-700">Light (gray-100)</p>
        </Box>
        <Box padding="md" background="primary">
          <p className="text-teal-900">Primary (teal-50)</p>
        </Box>
        <Box padding="md" background="secondary">
          <p className="text-coral-900">Secondary (coral-50)</p>
        </Box>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Borders</h3>
      <div className="grid grid-cols-3 gap-4">
        <Box padding="md" background="light">
          <p className="text-gray-700">No border</p>
        </Box>
        <Box padding="md" background="light" border="light">
          <p className="text-gray-700">Light border (gray-300)</p>
        </Box>
        <Box padding="md" background="light" border>
          <p className="text-gray-700">Default border (gray-400)</p>
        </Box>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Shadows</h3>
      <div className="grid grid-cols-3 gap-6">
        <div>
          <p className="text-sm text-gray-600 mb-2">Small</p>
          <Box padding="md" shadow="sm" background="white">
            <p className="text-gray-700">Small shadow</p>
          </Box>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2">Medium</p>
          <Box padding="md" shadow="md" background="white">
            <p className="text-gray-700">Medium shadow</p>
          </Box>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2">Large</p>
          <Box padding="md" shadow="lg" background="white">
            <p className="text-gray-700">Large shadow</p>
          </Box>
        </div>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Rounded Corners</h3>
      <div className="grid grid-cols-3 gap-4 bg-gray-200 p-4 rounded">
        <Box padding="md" background="light" rounded="sm">
          <p className="text-gray-700">Rounded (sm)</p>
        </Box>
        <Box padding="md" background="light" rounded="lg">
          <p className="text-gray-700">Rounded (lg)</p>
        </Box>
        <Box padding="md" background="light" rounded="xl">
          <p className="text-gray-700">Rounded (xl)</p>
        </Box>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">In Context - Card Layouts and Sections</h3>
      <div className="flex flex-col gap-8 max-w-3xl">
        <div className="grid grid-cols-2 gap-4">
          <Box padding="lg" shadow="md" background="white" rounded="lg">
            <h4 className="font-semibold text-gray-900 mb-2">Morning Meditation</h4>
            <p className="text-gray-700 mb-3">Start your day with peace and clarity</p>
            <p className="text-sm text-teal-600">10 minutes</p>
          </Box>
          <Box padding="lg" shadow="md" background="white" rounded="lg">
            <h4 className="font-semibold text-gray-900 mb-2">Evening Practice</h4>
            <p className="text-gray-700 mb-3">Wind down and release the day's stress</p>
            <p className="text-sm text-teal-600">15 minutes</p>
          </Box>
        </div>

        <div className="space-y-3">
          <Box padding="md" background="primary" border rounded="md">
            <p className="text-teal-900">
              <strong>Tip:</strong> For best results, practice meditation at the same time each day.
            </p>
          </Box>
          <Box padding="md" background="light" border rounded="md">
            <p className="text-gray-700">
              <strong>Note:</strong> This meditation is suitable for beginners and experienced practitioners.
            </p>
          </Box>
        </div>

        <Box padding="lg" border rounded="lg" className="max-w-xs">
          <h4 className="font-semibold text-gray-900 mb-3">Popular Meditations</h4>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Stress Relief</p>
              <p className="text-xs text-gray-600">1,234 sessions</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Better Sleep</p>
              <p className="text-xs text-gray-600">987 sessions</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Focus & Clarity</p>
              <p className="text-xs text-gray-600">756 sessions</p>
            </div>
          </div>
        </Box>

        <div className="grid grid-cols-3 gap-4">
          <Box padding="md" border rounded="md" className="text-center">
            <div className="text-3xl mb-2">🧘</div>
            <h5 className="font-medium text-gray-900 mb-1">Guided</h5>
            <p className="text-sm text-gray-600">Step-by-step guidance</p>
          </Box>
          <Box padding="md" border rounded="md" className="text-center">
            <div className="text-3xl mb-2">⏱️</div>
            <h5 className="font-medium text-gray-900 mb-1">Flexible</h5>
            <p className="text-sm text-gray-600">5-60 minute sessions</p>
          </Box>
          <Box padding="md" border rounded="md" className="text-center">
            <div className="text-3xl mb-2">🌟</div>
            <h5 className="font-medium text-gray-900 mb-1">Free</h5>
            <p className="text-sm text-gray-600">Always 100% free</p>
          </Box>
        </div>
      </div>
    </div>
  </div>
);
Default.storyName = "Box"
