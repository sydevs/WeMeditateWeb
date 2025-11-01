import type { Story } from "@ladle/react";
import { Box } from "./Box";

/**
 * Box component showcasing padding, backgrounds, borders, and shadows.
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
      <div className="grid grid-cols-3 gap-4">
        <Box padding="md" background="white" className="border border-gray-200">
          <p className="text-gray-700">White background</p>
        </Box>
        <Box padding="md" background="gray">
          <p className="text-gray-700">Gray background</p>
        </Box>
        <Box padding="md" background="teal">
          <p className="text-white">Teal background</p>
        </Box>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Borders</h3>
      <div className="grid grid-cols-3 gap-4">
        <Box padding="md" border="none">
          <p className="text-gray-700">No border</p>
        </Box>
        <Box padding="md" border="default">
          <p className="text-gray-700">Default border</p>
        </Box>
        <Box padding="md" border="teal">
          <p className="text-gray-700">Teal border</p>
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
      <div className="grid grid-cols-3 gap-4">
        <Box padding="md" background="gray" className="rounded">
          <p className="text-gray-700">Rounded (sm)</p>
        </Box>
        <Box padding="md" background="gray" className="rounded-lg">
          <p className="text-gray-700">Rounded (lg)</p>
        </Box>
        <Box padding="md" background="gray" className="rounded-xl">
          <p className="text-gray-700">Rounded (xl)</p>
        </Box>
      </div>
    </div>
  </div>
);

/**
 * Box in context creating card layouts and sections.
 */
export const InContext: Story = () => (
  <div className="flex flex-col gap-8 max-w-3xl">
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Content Cards</h3>
      <div className="grid grid-cols-2 gap-4">
        <Box padding="lg" shadow="md" background="white" className="rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">Morning Meditation</h4>
          <p className="text-gray-700 mb-3">Start your day with peace and clarity</p>
          <p className="text-sm text-teal-600">10 minutes</p>
        </Box>
        <Box padding="lg" shadow="md" background="white" className="rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">Evening Practice</h4>
          <p className="text-gray-700 mb-3">Wind down and release the day's stress</p>
          <p className="text-sm text-teal-600">15 minutes</p>
        </Box>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Info Panels</h3>
      <div className="space-y-3">
        <Box padding="md" background="teal" border="teal" className="rounded">
          <p className="text-white">
            <strong>Tip:</strong> For best results, practice meditation at the same time each day.
          </p>
        </Box>
        <Box padding="md" background="gray" border="default" className="rounded">
          <p className="text-gray-700">
            <strong>Note:</strong> This meditation is suitable for beginners and experienced practitioners.
          </p>
        </Box>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Sidebar Widget</h3>
      <Box padding="lg" border="default" className="rounded-lg max-w-xs">
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
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Feature Grid</h3>
      <div className="grid grid-cols-3 gap-4">
        <Box padding="md" border="default" className="rounded text-center">
          <div className="text-3xl mb-2">🧘</div>
          <h5 className="font-medium text-gray-900 mb-1">Guided</h5>
          <p className="text-sm text-gray-600">Step-by-step guidance</p>
        </Box>
        <Box padding="md" border="default" className="rounded text-center">
          <div className="text-3xl mb-2">⏱️</div>
          <h5 className="font-medium text-gray-900 mb-1">Flexible</h5>
          <p className="text-sm text-gray-600">5-60 minute sessions</p>
        </Box>
        <Box padding="md" border="default" className="rounded text-center">
          <div className="text-3xl mb-2">🌟</div>
          <h5 className="font-medium text-gray-900 mb-1">Free</h5>
          <p className="text-sm text-gray-600">Always 100% free</p>
        </Box>
      </div>
    </div>
  </div>
);
