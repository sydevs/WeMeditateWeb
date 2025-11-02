import type { Story, StoryDefault } from "@ladle/react";
import { FormField } from "./FormField";
import { Input } from "../../atoms/Input/Input";
import { Select } from "../../atoms/Select/Select";
import { Textarea } from "../../atoms/Textarea/Textarea";
import { Checkbox } from "../../atoms/Checkbox/Checkbox";
import { Radio } from "../../atoms/Radio/Radio";
import {
  StoryWrapper,
  StorySection,
  StoryExampleSection,
  StoryGrid,
  StoryGridHeader,
  StoryGridHeaderRow,
  StoryGridHeaderCell,
  StoryGridBody,
  StoryGridRow,
  StoryGridCell,
} from '../../ladle';

export default {
  title: "Molecules / Forms"
} satisfies StoryDefault;

/**
 * FormField molecule combining label, input, optional error message, and optional description.
 */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Basic Examples">
      <div className="flex flex-col gap-6 max-w-md">
        <FormField id="basic-name" label="Full name">
          <Input type="text" id="basic-name" placeholder="Enter your name" />
        </FormField>

        <FormField id="basic-email" label="Email address" required>
          <Input type="email" id="basic-email" placeholder="you@example.com" />
        </FormField>

        <FormField
          id="basic-message"
          label="Message"
          description="Please provide detailed information"
        >
          <Textarea id="basic-message" rows={4} placeholder="Type your message here..." />
        </FormField>
      </div>
    </StorySection>

    <StorySection title="Alignment">
      <div className="flex flex-col gap-6 max-w-md">
        <FormField id="align-left" label="Left aligned (default)" align="left">
          <Input type="text" id="align-left" placeholder="Left aligned" />
        </FormField>

        <FormField id="align-center" label="Center aligned" align="center">
          <Input type="text" id="align-center" placeholder="Center aligned" />
        </FormField>
      </div>
    </StorySection>

    <StorySection title="States">
      <StoryGrid>
        <StoryGridHeader>
          <StoryGridHeaderRow>
            <StoryGridHeaderCell />
            <StoryGridHeaderCell>Default</StoryGridHeaderCell>
            <StoryGridHeaderCell>Error</StoryGridHeaderCell>
            <StoryGridHeaderCell>Success</StoryGridHeaderCell>
            <StoryGridHeaderCell>Disabled</StoryGridHeaderCell>
          </StoryGridHeaderRow>
        </StoryGridHeader>
        <StoryGridBody>
          <StoryGridRow>
            <StoryGridCell isLabel>Input</StoryGridCell>
            <StoryGridCell>
              <FormField id="state-input-default" label="Email address" required>
                <Input type="email" id="state-input-default" placeholder="you@example.com" />
              </FormField>
            </StoryGridCell>
            <StoryGridCell>
              <FormField
                id="state-input-error"
                label="Email address"
                required
                error="Please enter a valid email address"
              >
                <Input type="email" id="state-input-error" state="error" defaultValue="invalid-email" />
              </FormField>
            </StoryGridCell>
            <StoryGridCell>
              <FormField id="state-input-success" label="Email address" required>
                <Input type="email" id="state-input-success" state="success" defaultValue="john@example.com" />
              </FormField>
            </StoryGridCell>
            <StoryGridCell>
              <FormField id="state-input-disabled" label="Email address" disabled>
                <Input type="email" id="state-input-disabled" disabled defaultValue="disabled@example.com" />
              </FormField>
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Select</StoryGridCell>
            <StoryGridCell>
              <FormField id="state-select-default" label="Country" required>
                <Select id="state-select-default" defaultValue="">
                  <option value="" disabled>Select a country</option>
                  <option value="us">United States</option>
                  <option value="uk">United Kingdom</option>
                  <option value="ca">Canada</option>
                </Select>
              </FormField>
            </StoryGridCell>
            <StoryGridCell>
              <FormField
                id="state-select-error"
                label="Country"
                required
                error="Please select a country"
              >
                <Select id="state-select-error" state="error" defaultValue="">
                  <option value="" disabled>Select a country</option>
                  <option value="us">United States</option>
                  <option value="uk">United Kingdom</option>
                  <option value="ca">Canada</option>
                </Select>
              </FormField>
            </StoryGridCell>
            <StoryGridCell>
              <FormField id="state-select-success" label="Country" required>
                <Select id="state-select-success" state="success" defaultValue="us">
                  <option value="" disabled>Select a country</option>
                  <option value="us">United States</option>
                  <option value="uk">United Kingdom</option>
                  <option value="ca">Canada</option>
                </Select>
              </FormField>
            </StoryGridCell>
            <StoryGridCell>
              <FormField id="state-select-disabled" label="Country" disabled>
                <Select id="state-select-disabled" disabled defaultValue="uk">
                  <option value="" disabled>Select a country</option>
                  <option value="us">United States</option>
                  <option value="uk">United Kingdom</option>
                  <option value="ca">Canada</option>
                </Select>
              </FormField>
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Textarea</StoryGridCell>
            <StoryGridCell>
              <FormField id="state-textarea-default" label="Message" required>
                <Textarea id="state-textarea-default" rows={3} placeholder="Your message..." />
              </FormField>
            </StoryGridCell>
            <StoryGridCell>
              <FormField
                id="state-textarea-error"
                label="Message"
                required
                error="Message must be at least 10 characters"
              >
                <Textarea id="state-textarea-error" state="error" rows={3} defaultValue="Too short" />
              </FormField>
            </StoryGridCell>
            <StoryGridCell>
              <FormField id="state-textarea-success" label="Message" required>
                <Textarea id="state-textarea-success" state="success" rows={3} defaultValue="This is a valid message with enough characters." />
              </FormField>
            </StoryGridCell>
            <StoryGridCell>
              <FormField id="state-textarea-disabled" label="Message" disabled>
                <Textarea id="state-textarea-disabled" disabled rows={3} defaultValue="Comments are disabled" />
              </FormField>
            </StoryGridCell>
          </StoryGridRow>
        </StoryGridBody>
      </StoryGrid>
    </StorySection>

    <StoryExampleSection>
      <div className="flex flex-col gap-8 max-w-2xl">
        {/* Input Example */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Text Input</h3>
          <div className="flex flex-col gap-4">
            <FormField
              id="example-name"
              label="Full name"
              required
            >
              <Input type="text" id="example-name" placeholder="John Doe" />
            </FormField>

            <FormField
              id="example-email"
              label="Email address"
              required
              description="We'll never share your email with anyone else"
            >
              <Input type="email" id="example-email" placeholder="john@example.com" />
            </FormField>

            <FormField
              id="example-phone"
              label="Phone number"
              description="Include country code"
            >
              <Input type="tel" id="example-phone" placeholder="+1 (555) 123-4567" />
            </FormField>
          </div>
        </div>

        {/* Select Example */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Select Dropdown</h3>
          <div className="flex flex-col gap-4">
            <FormField
              id="example-country"
              label="Country"
              required
            >
              <Select id="example-country" defaultValue="">
                <option value="" disabled>Select your country</option>
                <option value="us">United States</option>
                <option value="uk">United Kingdom</option>
                <option value="ca">Canada</option>
                <option value="au">Australia</option>
                <option value="de">Germany</option>
              </Select>
            </FormField>

            <FormField
              id="example-language"
              label="Preferred language"
              description="Choose your preferred language for notifications"
            >
              <Select id="example-language" defaultValue="en">
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </Select>
            </FormField>
          </div>
        </div>

        {/* Textarea Example */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Textarea</h3>
          <div className="flex flex-col gap-4">
            <FormField
              id="example-bio"
              label="Bio"
              description="Tell us a little about yourself (max 500 characters)"
            >
              <Textarea id="example-bio" rows={4} placeholder="I am a meditation practitioner..." />
            </FormField>

            <FormField
              id="example-message"
              label="Message"
              required
            >
              <Textarea id="example-message" rows={6} placeholder="Your message here..." />
            </FormField>
          </div>
        </div>

        {/* Checkbox Group Example */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Checkbox Group</h3>
          <FormField
            id="example-interests"
            label="Interests"
            description="Select all that apply"
          >
            <div className="flex flex-col gap-2">
              <Checkbox id="interest-meditation" label="Guided Meditations" defaultChecked />
              <Checkbox id="interest-music" label="Meditation Music" defaultChecked />
              <Checkbox id="interest-articles" label="Articles & Resources" />
              <Checkbox id="interest-events" label="Events & Workshops" />
              <Checkbox id="interest-newsletter" label="Newsletter Updates" />
            </div>
          </FormField>
        </div>

        {/* Radio Group Example */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Radio Group</h3>
          <FormField
            id="example-experience"
            label="Meditation experience level"
            required
          >
            <div className="flex flex-col gap-2">
              <Radio name="experience" id="exp-beginner" value="beginner" label="Beginner - Just starting out" />
              <Radio name="experience" id="exp-intermediate" value="intermediate" label="Intermediate - Regular practice" defaultChecked />
              <Radio name="experience" id="exp-advanced" value="advanced" label="Advanced - Experienced practitioner" />
              <Radio name="experience" id="exp-teacher" value="teacher" label="Teacher - Teaching meditation" />
            </div>
          </FormField>
        </div>

        {/* Single Checkbox Example */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Single Checkbox</h3>
          <FormField
            id="example-terms"
            label="Agreement"
            required
          >
            <Checkbox
              id="accept-terms"
              label="I agree to the terms and conditions"
            />
          </FormField>

          <div className="mt-4">
            <FormField
              id="example-newsletter"
              label="Newsletter subscription"
            >
              <Checkbox
                id="subscribe-newsletter"
                label="Yes, I want to receive weekly meditation tips and updates"
                defaultChecked
              />
            </FormField>
          </div>
        </div>
      </div>
    </StoryExampleSection>

    <div />
  </StoryWrapper>
);

Default.storyName = "Form Field"
