import type { Story, StoryDefault } from '@ladle/react'
import { FormBuilder, FormBuilderConfig, FormBuilderSubmission } from './FormBuilder'
import { StoryWrapper, StorySection } from '../../ladle'

export default {
  title: 'Organisms',
} satisfies StoryDefault

/**
 * FormBuilder component showcasing dynamic form rendering from PayloadCMS form builder plugin.
 *
 * Demonstrates all supported field types, validation, submission handling, and confirmation messages.
 */
export const Default: Story = () => {
  // Mock submission handler that simulates API call
  const handleSubmit = async (data: FormBuilderSubmission) => {
    console.log('Form submitted:', data)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Simulate success
    return { success: true }
  }

  // Mock submission handler that simulates validation errors
  const handleSubmitWithErrors = async (data: FormBuilderSubmission) => {
    console.log('Form submitted with errors:', data)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Simulate validation errors
    return {
      success: false,
      error: {
        message: 'Please correct the errors below',
        errors: [
          { field: 'email', message: 'This email address is already registered' },
          { field: 'message', message: 'Message must be at least 20 characters long' },
        ],
      },
    }
  }

  // Contact form configuration
  const contactForm: FormBuilderConfig = {
    id: 'contact-form',
    title: 'Contact Us',
    fields: [
      {
        name: 'name',
        blockType: 'text',
        label: 'Full Name',
        required: true,
        placeholder: 'John Doe',
      },
      {
        name: 'email',
        blockType: 'email',
        label: 'Email Address',
        required: true,
        placeholder: 'your@email.com',
      },
      {
        name: 'subject',
        blockType: 'select',
        label: 'Subject',
        required: true,
        options: [
          { label: 'General Inquiry', value: 'general' },
          { label: 'Technical Support', value: 'support' },
          { label: 'Feedback', value: 'feedback' },
          { label: 'Partnership', value: 'partnership' },
        ],
      },
      {
        name: 'message',
        blockType: 'textarea',
        label: 'Message',
        required: true,
        placeholder: 'Tell us how we can help...',
      },
      {
        name: 'newsletter',
        blockType: 'checkbox',
        label: 'Subscribe to our newsletter',
      },
    ],
    submitButtonLabel: 'Send Message',
    confirmationMessage: "Thank you for contacting us! We'll get back to you soon.",
  }

  // Registration form with all field types
  const registrationForm: FormBuilderConfig = {
    id: 'registration-form',
    title: 'Create Account',
    fields: [
      {
        name: 'intro',
        blockType: 'message',
        label: '',
        message:
          'Welcome! Please fill out the form below to create your meditation account.',
      },
      {
        name: 'fullName',
        blockType: 'text',
        label: 'Full Name',
        required: true,
        placeholder: 'Enter your full name',
      },
      {
        name: 'email',
        blockType: 'email',
        label: 'Email',
        required: true,
        placeholder: 'your@email.com',
      },
      {
        name: 'age',
        blockType: 'number',
        label: 'Age',
        required: false,
        placeholder: '18',
      },
      {
        name: 'experience',
        blockType: 'select',
        label: 'Meditation Experience',
        required: true,
        placeholder: 'Select your experience level',
        options: [
          { label: 'Beginner', value: 'beginner' },
          { label: 'Intermediate', value: 'intermediate' },
          { label: 'Advanced', value: 'advanced' },
        ],
      },
      {
        name: 'bio',
        blockType: 'textarea',
        label: 'Tell us about yourself',
        required: false,
        placeholder: 'Optional: Share your meditation journey...',
      },
      {
        name: 'terms',
        blockType: 'checkbox',
        label: 'I agree to the Terms and Conditions',
        required: true,
      },
      {
        name: 'newsletter',
        blockType: 'checkbox',
        label: 'Send me weekly meditation tips',
      },
    ],
    submitButtonLabel: 'Create Account',
    confirmationMessage: 'Your account has been created successfully! Welcome to our community.',
  }

  // Simple newsletter form
  const newsletterForm: FormBuilderConfig = {
    id: 'newsletter-form',
    fields: [
      {
        name: 'email',
        blockType: 'email',
        label: 'Email Address',
        required: true,
        placeholder: 'Enter your email',
      },
    ],
    submitButtonLabel: 'Subscribe',
    confirmationMessage: 'Thank you for subscribing! Check your email to confirm.',
  }

  // Form with validation errors
  const errorForm: FormBuilderConfig = {
    id: 'error-form',
    title: 'Form with Validation Errors',
    fields: [
      {
        name: 'email',
        blockType: 'email',
        label: 'Email',
        required: true,
        placeholder: 'Try submitting to see server-side errors',
      },
      {
        name: 'message',
        blockType: 'textarea',
        label: 'Message',
        required: true,
        placeholder: 'This will also show a validation error',
      },
    ],
    submitButtonLabel: 'Submit (Will Show Errors)',
  }

  return (
    <StoryWrapper>
      <StorySection title="Contact Form">
        <div className="max-w-2xl">
          <FormBuilder form={contactForm} onSubmit={handleSubmit} />
        </div>
      </StorySection>

      <StorySection title="Registration Form (All Field Types)">
        <div className="max-w-2xl">
          <FormBuilder form={registrationForm} onSubmit={handleSubmit} />
        </div>
      </StorySection>

      <StorySection title="Simple Newsletter Form">
        <div className="max-w-md">
          <FormBuilder form={newsletterForm} onSubmit={handleSubmit} />
        </div>
      </StorySection>

      <StorySection title="Form with Server-Side Validation Errors">
        <div className="max-w-2xl">
          <p className="text-sm text-gray-600 mb-4">
            This form simulates server-side validation errors. Try submitting the form to see
            how field-level errors are displayed.
          </p>
          <FormBuilder form={errorForm} onSubmit={handleSubmitWithErrors} />
        </div>
      </StorySection>

      <StorySection
        title="Examples"
        inContext={true}
      >
        <div className="flex flex-col gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Integration Example
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              In a real application, you would fetch the form configuration from PayloadCMS
              and handle the submission to your API:
            </p>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-x-auto">
              {`// In your page component
import { FormBuilder } from '@/components/organisms'

export function ContactPage({ formConfig }) {
  const handleSubmit = async (data) => {
    const response = await fetch('/api/form-submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (response.ok) {
      return { success: true }
    } else {
      const error = await response.json()
      return { success: false, error }
    }
  }

  return <FormBuilder form={formConfig} onSubmit={handleSubmit} />
}`}
            </pre>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Accessibility Features
            </h3>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              <li>Native HTML5 validation with required fields</li>
              <li>ARIA invalid states for fields with errors</li>
              <li>ARIA live regions for form submission status</li>
              <li>Screen reader announcements for loading states</li>
              <li>Proper form semantics with labels and fieldsets</li>
              <li>Keyboard navigation support</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Supported Field Types
            </h3>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              <li><strong>text</strong> - Single-line text input</li>
              <li><strong>email</strong> - Email input with validation</li>
              <li><strong>number</strong> - Numeric input</li>
              <li><strong>textarea</strong> - Multi-line text input</li>
              <li><strong>select</strong> - Dropdown selection</li>
              <li><strong>checkbox</strong> - Boolean checkbox</li>
              <li><strong>message</strong> - Display-only informational text</li>
            </ul>
          </div>
        </div>
      </StorySection>

      <div />
    </StoryWrapper>
  )
}

Default.storyName = 'Form Builder'
