import type { Story, StoryDefault } from "@ladle/react";
import { Textarea } from "./Textarea";

export default {
  title: "Atoms / Form"
} satisfies StoryDefault;

/**
 * Textarea component showcasing all sizes, auto-resize, validation states, and usage in context.
 */
export const Default: Story = () => (
  <div className="flex flex-col gap-8 max-w-md">
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Default Textarea</h3>
      <Textarea placeholder="Enter your message..." />
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">With Auto-resize</h3>
      <Textarea
        placeholder="Start typing to see auto-resize..."
        autoResize
      />
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Custom Rows</h3>
      <Textarea
        placeholder="Tall textarea with 8 rows"
        rows={8}
      />
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">States</h3>
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Default</p>
          <Textarea placeholder="Normal textarea" />
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Success</p>
          <Textarea
            state="success"
            defaultValue="Great feedback, thank you!"
          />
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Error</p>
          <Textarea
            state="error"
            defaultValue="Too short"
          />
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Disabled</p>
          <Textarea placeholder="Disabled textarea" disabled />
        </div>
      </div>
    </div>
  </div>
);
Default.storyName = "Textarea"
