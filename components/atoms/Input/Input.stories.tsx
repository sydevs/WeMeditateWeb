import type { Story } from "@ladle/react";
import { Input } from "./Input";

/**
 * Input component showcasing all types and width options.
 */
export const Default: Story = () => (
  <div className="flex flex-col gap-8 max-w-md">
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Input Types</h3>
      <div className="flex flex-col gap-3">
        <Input type="text" placeholder="Text input" />
        <Input type="email" placeholder="Email input" />
        <Input type="password" placeholder="Password input" />
        <Input type="number" placeholder="Number input" />
        <Input type="tel" placeholder="Phone number" />
        <Input type="url" placeholder="Website URL" />
        <Input type="search" placeholder="Search..." />
        <Input type="date" />
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Width Options</h3>
      <div className="flex flex-col gap-3">
        <Input type="text" placeholder="Default width" />
        <Input type="text" placeholder="Full width" fullWidth />
      </div>
    </div>
  </div>
);

/**
 * Input states including validation and disabled.
 */
export const States: Story = () => (
  <div className="flex flex-col gap-8 max-w-md">
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Validation States</h3>
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm text-gray-600 mb-1">Default</p>
          <Input type="text" placeholder="Normal input" />
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Success</p>
          <Input
            type="email"
            state="success"
            defaultValue="valid@email.com"
          />
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Error</p>
          <Input
            type="email"
            state="error"
            defaultValue="invalid@email"
          />
        </div>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Disabled State</h3>
      <div className="flex flex-col gap-3">
        <Input type="text" placeholder="Disabled input" disabled />
        <Input type="email" placeholder="Disabled email" disabled />
        <Input type="password" placeholder="Disabled password" disabled />
      </div>
    </div>
  </div>
);

/**
 * Input component in form context with labels and validation.
 */
export const InContext: Story = () => (
  <div className="max-w-md flex flex-col gap-8">
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Login Form</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium mb-1 text-gray-900">
            Email
          </label>
          <Input
            id="login-email"
            type="email"
            placeholder="you@example.com"
            fullWidth
          />
        </div>
        <div>
          <label htmlFor="login-password" className="block text-sm font-medium mb-1 text-gray-900">
            Password
          </label>
          <Input
            id="login-password"
            type="password"
            placeholder="••••••••"
            fullWidth
          />
        </div>
      </div>
    </div>

    <hr className="border-gray-200" />

    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">With Validation</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="valid-email" className="block text-sm font-medium mb-1 text-gray-900">
            Valid Email
          </label>
          <Input
            id="valid-email"
            type="email"
            state="success"
            defaultValue="user@example.com"
            fullWidth
          />
          <p className="text-sm text-success mt-1">Email is valid</p>
        </div>
        <div>
          <label htmlFor="invalid-email" className="block text-sm font-medium mb-1 text-gray-900">
            Invalid Email
          </label>
          <Input
            id="invalid-email"
            type="email"
            state="error"
            defaultValue="invalid.email"
            fullWidth
          />
          <p className="text-sm text-error mt-1">Please enter a valid email address</p>
        </div>
      </div>
    </div>
  </div>
);
