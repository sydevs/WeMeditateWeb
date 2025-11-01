import type { Story } from "@ladle/react";
import { Textarea } from "./Textarea";

/**
 * Textarea component showcasing sizes and auto-resize functionality.
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
  </div>
);

/**
 * Textarea states including validation and disabled.
 */
export const States: Story = () => (
  <div className="flex flex-col gap-8 max-w-md">
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Validation States</h3>
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
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Disabled State</h3>
      <Textarea placeholder="Disabled textarea" disabled />
    </div>
  </div>
);

/**
 * Textarea in form context with label and character count.
 */
export const InContext: Story = () => (
  <div className="max-w-md flex flex-col gap-8">
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Contact Form</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-1 text-gray-900">
            Message
          </label>
          <Textarea
            id="message"
            placeholder="Tell us about your meditation experience..."
            rows={4}
            fullWidth
          />
          <p className="text-sm text-gray-600 mt-1">Maximum 500 characters</p>
        </div>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">With Validation Feedback</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="feedback" className="block text-sm font-medium mb-1 text-gray-900">
            Feedback
          </label>
          <Textarea
            id="feedback"
            state="error"
            defaultValue="Too short"
            fullWidth
          />
          <p className="text-sm text-error mt-1">Please provide at least 20 characters</p>
        </div>
      </div>
    </div>
  </div>
);
