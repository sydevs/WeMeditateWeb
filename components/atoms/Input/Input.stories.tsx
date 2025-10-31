import type { Story } from "@ladle/react";
import { Input, InputProps } from "./Input";

export const Default: Story<InputProps> = () => (
  <Input placeholder="Enter text..." />
);

export const States: Story = () => (
  <div className="flex flex-col gap-4 max-w-md">
    <div>
      <label className="block text-sm font-medium mb-2">Default State</label>
      <Input placeholder="Default input" state="default" />
    </div>

    <div>
      <label className="block text-sm font-medium mb-2">Error State</label>
      <Input
        placeholder="Error input"
        state="error"
        defaultValue="invalid@email"
      />
      <p className="text-sm text-error mt-1">Please enter a valid email</p>
    </div>

    <div>
      <label className="block text-sm font-medium mb-2">Success State</label>
      <Input
        placeholder="Success input"
        state="success"
        defaultValue="valid@email.com"
      />
      <p className="text-sm text-success mt-1">Email is valid</p>
    </div>
  </div>
);

export const Types: Story = () => (
  <div className="flex flex-col gap-4 max-w-md">
    <Input type="text" placeholder="Text input" />
    <Input type="email" placeholder="Email input" />
    <Input type="password" placeholder="Password input" />
    <Input type="number" placeholder="Number input" />
    <Input type="tel" placeholder="Phone input" />
    <Input type="url" placeholder="URL input" />
    <Input type="search" placeholder="Search input" />
  </div>
);

export const FullWidth: Story<InputProps> = () => (
  <div className="max-w-2xl">
    <Input placeholder="Full width input" fullWidth />
  </div>
);

export const Disabled: Story = () => (
  <div className="flex flex-col gap-4 max-w-md">
    <Input placeholder="Disabled input" disabled />
    <Input
      placeholder="Disabled with value"
      disabled
      defaultValue="Cannot edit this"
    />
  </div>
);

export const WithLabels: Story = () => (
  <form className="flex flex-col gap-6 max-w-md">
    <div>
      <label htmlFor="name" className="block text-sm font-medium mb-2">
        Name
      </label>
      <Input id="name" type="text" placeholder="John Doe" fullWidth />
    </div>

    <div>
      <label htmlFor="email" className="block text-sm font-medium mb-2">
        Email Address
      </label>
      <Input
        id="email"
        type="email"
        placeholder="john@example.com"
        fullWidth
      />
    </div>

    <div>
      <label htmlFor="password" className="block text-sm font-medium mb-2">
        Password
      </label>
      <Input
        id="password"
        type="password"
        placeholder="Enter password"
        fullWidth
      />
      <p className="text-sm text-gray-600 mt-1">
        Must be at least 8 characters
      </p>
    </div>
  </form>
);

export const Focused: Story = () => (
  <div className="max-w-md">
    <p className="text-sm text-gray-600 mb-4">
      Click input to see focus styles
    </p>
    <Input placeholder="Click to focus" autoFocus />
  </div>
);

export const AllStatesComparison: Story = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div>
      <h3 className="text-sm font-semibold mb-3">Default</h3>
      <Input placeholder="Default" state="default" className="mb-2" />
      <Input
        placeholder="Disabled"
        state="default"
        disabled
        className="mb-2"
      />
      <Input placeholder="With value" state="default" defaultValue="Text" />
    </div>

    <div>
      <h3 className="text-sm font-semibold mb-3 text-error">Error</h3>
      <Input placeholder="Error" state="error" className="mb-2" />
      <Input placeholder="Disabled" state="error" disabled className="mb-2" />
      <Input
        placeholder="With value"
        state="error"
        defaultValue="Invalid text"
      />
    </div>

    <div>
      <h3 className="text-sm font-semibold mb-3 text-success">Success</h3>
      <Input placeholder="Success" state="success" className="mb-2" />
      <Input
        placeholder="Disabled"
        state="success"
        disabled
        className="mb-2"
      />
      <Input
        placeholder="With value"
        state="success"
        defaultValue="Valid text"
      />
    </div>
  </div>
);
