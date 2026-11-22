import type { Story, StoryDefault } from '@ladle/react'
import { FormField } from './FormField'
import { Input } from '@/components/atoms/form/Input/Input'
import { Select } from '@/components/atoms/form/Select/Select'
import { Textarea } from '@/components/atoms/form/Textarea/Textarea'
import { Checkbox } from '@/components/atoms/form/Checkbox/Checkbox'
import { Radio } from '@/components/atoms/form/Radio/Radio'
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
} from '@/components/ladle'

export default {
  title: 'Molecules',
} satisfies StoryDefault

/** FormField molecule combining label, input, optional error message, and optional description. */
export const Default: Story = () => (
  <StoryWrapper>
    <StorySection title="Basic Examples">
      <div className="flex flex-col gap-6 max-w-md">
        <FormField id="basic-name" label="Full name">
          <Input id="basic-name" placeholder="Enter your name" type="text" />
        </FormField>

        <FormField required id="basic-email" label="Email address">
          <Input id="basic-email" placeholder="you@example.com" type="email" />
        </FormField>

        <FormField
          description="Please provide detailed information"
          id="basic-message"
          label="Message"
        >
          <Textarea id="basic-message" placeholder="Type your message here..." rows={4} />
        </FormField>
      </div>
    </StorySection>

    <StorySection title="Alignment">
      <div className="flex flex-col gap-6 max-w-md">
        <FormField align="left" id="align-left" label="Left aligned (default)">
          <Input id="align-left" placeholder="Left aligned" type="text" />
        </FormField>

        <FormField align="center" id="align-center" label="Center aligned">
          <Input id="align-center" placeholder="Center aligned" type="text" />
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
              <FormField required id="state-input-default" label="Email address">
                <Input id="state-input-default" placeholder="you@example.com" type="email" />
              </FormField>
            </StoryGridCell>
            <StoryGridCell>
              <FormField
                required
                error="Please enter a valid email address"
                id="state-input-error"
                label="Email address"
              >
                <Input
                  defaultValue="invalid-email"
                  id="state-input-error"
                  state="error"
                  type="email"
                />
              </FormField>
            </StoryGridCell>
            <StoryGridCell>
              <FormField required id="state-input-success" label="Email address">
                <Input
                  defaultValue="john@example.com"
                  id="state-input-success"
                  state="success"
                  type="email"
                />
              </FormField>
            </StoryGridCell>
            <StoryGridCell>
              <FormField disabled id="state-input-disabled" label="Email address">
                <Input
                  disabled
                  defaultValue="disabled@example.com"
                  id="state-input-disabled"
                  type="email"
                />
              </FormField>
            </StoryGridCell>
          </StoryGridRow>

          <StoryGridRow>
            <StoryGridCell isLabel>Select</StoryGridCell>
            <StoryGridCell>
              <FormField required id="state-select-default" label="Country">
                <Select defaultValue="" id="state-select-default">
                  <option disabled value="">
                    Select a country
                  </option>
                  <option value="us">United States</option>
                  <option value="uk">United Kingdom</option>
                  <option value="ca">Canada</option>
                </Select>
              </FormField>
            </StoryGridCell>
            <StoryGridCell>
              <FormField
                required
                error="Please select a country"
                id="state-select-error"
                label="Country"
              >
                <Select defaultValue="" id="state-select-error" state="error">
                  <option disabled value="">
                    Select a country
                  </option>
                  <option value="us">United States</option>
                  <option value="uk">United Kingdom</option>
                  <option value="ca">Canada</option>
                </Select>
              </FormField>
            </StoryGridCell>
            <StoryGridCell>
              <FormField required id="state-select-success" label="Country">
                <Select defaultValue="us" id="state-select-success" state="success">
                  <option disabled value="">
                    Select a country
                  </option>
                  <option value="us">United States</option>
                  <option value="uk">United Kingdom</option>
                  <option value="ca">Canada</option>
                </Select>
              </FormField>
            </StoryGridCell>
            <StoryGridCell>
              <FormField disabled id="state-select-disabled" label="Country">
                <Select disabled defaultValue="uk" id="state-select-disabled">
                  <option disabled value="">
                    Select a country
                  </option>
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
              <FormField required id="state-textarea-default" label="Message">
                <Textarea id="state-textarea-default" placeholder="Your message..." rows={3} />
              </FormField>
            </StoryGridCell>
            <StoryGridCell>
              <FormField
                required
                error="Message must be at least 10 characters"
                id="state-textarea-error"
                label="Message"
              >
                <Textarea
                  defaultValue="Too short"
                  id="state-textarea-error"
                  rows={3}
                  state="error"
                />
              </FormField>
            </StoryGridCell>
            <StoryGridCell>
              <FormField required id="state-textarea-success" label="Message">
                <Textarea
                  defaultValue="This is a valid message with enough characters."
                  id="state-textarea-success"
                  rows={3}
                  state="success"
                />
              </FormField>
            </StoryGridCell>
            <StoryGridCell>
              <FormField disabled id="state-textarea-disabled" label="Message">
                <Textarea
                  disabled
                  defaultValue="Comments are disabled"
                  id="state-textarea-disabled"
                  rows={3}
                />
              </FormField>
            </StoryGridCell>
          </StoryGridRow>
        </StoryGridBody>
      </StoryGrid>
    </StorySection>

    <StorySection inContext={true} title="Examples">
      <div className="flex flex-col gap-8 max-w-2xl">
        {/* Input Example */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Text Input</h3>
          <div className="flex flex-col gap-4">
            <FormField required id="example-name" label="Full name">
              <Input id="example-name" placeholder="John Doe" type="text" />
            </FormField>

            <FormField
              required
              description="We'll never share your email with anyone else"
              id="example-email"
              label="Email address"
            >
              <Input id="example-email" placeholder="john@example.com" type="email" />
            </FormField>

            <FormField description="Include country code" id="example-phone" label="Phone number">
              <Input id="example-phone" placeholder="+1 (555) 123-4567" type="tel" />
            </FormField>
          </div>
        </div>

        {/* Select Example */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Select Dropdown</h3>
          <div className="flex flex-col gap-4">
            <FormField required id="example-country" label="Country">
              <Select defaultValue="" id="example-country">
                <option disabled value="">
                  Select your country
                </option>
                <option value="us">United States</option>
                <option value="uk">United Kingdom</option>
                <option value="ca">Canada</option>
                <option value="au">Australia</option>
                <option value="de">Germany</option>
              </Select>
            </FormField>

            <FormField
              description="Choose your preferred language for notifications"
              id="example-language"
              label="Preferred language"
            >
              <Select defaultValue="en" id="example-language">
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
              description="Tell us a little about yourself (max 500 characters)"
              id="example-bio"
              label="Bio"
            >
              <Textarea id="example-bio" placeholder="I am a meditation practitioner..." rows={4} />
            </FormField>

            <FormField required id="example-message" label="Message">
              <Textarea id="example-message" placeholder="Your message here..." rows={6} />
            </FormField>
          </div>
        </div>

        {/* Checkbox Group Example */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Checkbox Group</h3>
          <FormField description="Select all that apply" id="example-interests" label="Interests">
            <div className="flex flex-col gap-2">
              <Checkbox defaultChecked id="interest-meditation" label="Guided Meditations" />
              <Checkbox defaultChecked id="interest-music" label="Meditation Music" />
              <Checkbox id="interest-articles" label="Articles & Resources" />
              <Checkbox id="interest-events" label="Events & Workshops" />
              <Checkbox id="interest-newsletter" label="Newsletter Updates" />
            </div>
          </FormField>
        </div>

        {/* Radio Group Example */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Radio Group</h3>
          <FormField required id="example-experience" label="Meditation experience level">
            <div className="flex flex-col gap-2">
              <Radio
                id="exp-beginner"
                label="Beginner - Just starting out"
                name="experience"
                value="beginner"
              />
              <Radio
                defaultChecked
                id="exp-intermediate"
                label="Intermediate - Regular practice"
                name="experience"
                value="intermediate"
              />
              <Radio
                id="exp-advanced"
                label="Advanced - Experienced practitioner"
                name="experience"
                value="advanced"
              />
              <Radio
                id="exp-teacher"
                label="Teacher - Teaching meditation"
                name="experience"
                value="teacher"
              />
            </div>
          </FormField>
        </div>

        {/* Single Checkbox Example */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Single Checkbox</h3>
          <FormField required id="example-terms" label="Agreement">
            <Checkbox id="accept-terms" label="I agree to the terms and conditions" />
          </FormField>

          <div className="mt-4">
            <FormField id="example-newsletter" label="Newsletter subscription">
              <Checkbox
                defaultChecked
                id="subscribe-newsletter"
                label="Yes, I want to receive weekly meditation tips and updates"
              />
            </FormField>
          </div>
        </div>
      </div>
    </StorySection>

    <div />
  </StoryWrapper>
)

Default.storyName = 'Form Field'
