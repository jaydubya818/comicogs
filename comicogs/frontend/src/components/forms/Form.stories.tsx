import type { Meta, StoryObj } from '@storybook/react'
import { Form, FormSection, FormGroup, FormActions, authSchemas, comicSchemas } from './Form'
import { Field, EmailField, PasswordField, NumberField, TextareaField, SelectField, CheckboxField, SwitchField } from './Field'
import { Button } from '@/components/ui/button'
import { z } from 'zod'

const meta: Meta<typeof Form> = {
  title: 'Forms/Form',
  component: Form,
  parameters: {
    docs: {
      description: {
        component: 'A comprehensive form system built with React Hook Form and Zod validation. Supports various field types, validation, and submission handling.',
      },
    },
  },
} satisfies Meta<typeof Form>

export default meta
type Story = StoryObj<typeof meta>

// Simple contact form
const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  newsletter: z.boolean().optional(),
})

export const ContactForm: Story = {
  render: () => (
    <div className="max-w-md mx-auto p-6">
      <Form
        schema={contactSchema}
        onSubmit={async (data) => {
          console.log('Contact form submitted:', data)
          await new Promise(resolve => setTimeout(resolve, 1000))
        }}
        submitText="Send Message"
      >
        <Field name="name" label="Your Name" placeholder="John Doe" required />
        <EmailField name="email" label="Email Address" placeholder="john@example.com" required />
        <Field name="subject" label="Subject" placeholder="What's this about?" required />
        <TextareaField name="message" label="Message" placeholder="Tell us more..." rows={4} required />
        <CheckboxField name="newsletter" label="Subscribe to newsletter" />
      </Form>
    </div>
  ),
}

// Authentication forms
export const SignInForm: Story = {
  render: () => (
    <div className="max-w-sm mx-auto p-6">
      <Form
        schema={authSchemas.signIn}
        onSubmit={async (data) => {
          console.log('Sign in:', data)
          await new Promise(resolve => setTimeout(resolve, 1000))
        }}
        submitText="Sign In"
      >
        <EmailField name="email" label="Email" autoFocus required />
        <PasswordField name="password" label="Password" required />
        <CheckboxField name="remember" label="Remember me" />
      </Form>
    </div>
  ),
}

export const SignUpForm: Story = {
  render: () => (
    <div className="max-w-sm mx-auto p-6">
      <Form
        schema={authSchemas.signUp}
        onSubmit={async (data) => {
          console.log('Sign up:', data)
          await new Promise(resolve => setTimeout(resolve, 1000))
        }}
        submitText="Create Account"
      >
        <Field name="name" label="Full Name" required />
        <EmailField name="email" label="Email" required />
        <PasswordField name="password" label="Password" required />
        <PasswordField name="confirmPassword" label="Confirm Password" required />
        <CheckboxField 
          name="terms" 
          label={
            <span>
              I agree to the{' '}
              <a href="/terms" className="text-primary hover:underline">
                Terms of Service
              </a>
            </span>
          }
        />
      </Form>
    </div>
  ),
}

// Comic listing form
export const ComicListingForm: Story = {
  render: () => (
    <div className="max-w-2xl mx-auto p-6">
      <Form
        schema={comicSchemas.createListing}
        onSubmit={async (data) => {
          console.log('Comic listing:', data)
          await new Promise(resolve => setTimeout(resolve, 1000))
        }}
        submitText="Create Listing"
      >
        <FormSection title="Comic Details" description="Basic information about the comic">
          <FormGroup>
            <Field name="title" label="Comic Title" placeholder="Amazing Spider-Man" required />
            <Field name="series" label="Series" placeholder="Amazing Spider-Man" required />
          </FormGroup>
          <FormGroup>
            <Field name="issue" label="Issue Number" placeholder="#1" required />
            <SelectField 
              name="grade" 
              label="Grade" 
              placeholder="Select grade"
              options={[
                { value: 'PR', label: 'Poor (PR)' },
                { value: 'FR', label: 'Fair (FR)' },
                { value: 'GD', label: 'Good (GD)' },
                { value: 'VG', label: 'Very Good (VG)' },
                { value: 'FN', label: 'Fine (FN)' },
                { value: 'VF', label: 'Very Fine (VF)' },
                { value: 'NM', label: 'Near Mint (NM)' },
                { value: 'M', label: 'Mint (M)' },
              ]}
              required 
            />
          </FormGroup>
        </FormSection>

        <FormSection title="Listing Details" description="Pricing and additional information">
          <FormGroup>
            <NumberField name="price" label="Price ($)" placeholder="0.00" min={0} step={0.01} required />
            <SelectField 
              name="format" 
              label="Format" 
              placeholder="Select format"
              options={[
                { value: 'raw', label: 'Raw Comic' },
                { value: 'slab', label: 'Graded Slab' },
              ]}
              required 
            />
          </FormGroup>
          <Field name="condition" label="Condition Notes" placeholder="Describe the condition..." required />
          <TextareaField 
            name="description" 
            label="Description" 
            placeholder="Additional details about this comic..."
            rows={4}
          />
        </FormSection>
      </Form>
    </div>
  ),
}

// Form with sections and groups
export const ComplexForm: Story = {
  render: () => {
    const complexSchema = z.object({
      // Personal info
      firstName: z.string().min(1, 'First name is required'),
      lastName: z.string().min(1, 'Last name is required'),
      email: z.string().email('Please enter a valid email'),
      phone: z.string().optional(),
      
      // Address
      address1: z.string().min(1, 'Address is required'),
      address2: z.string().optional(),
      city: z.string().min(1, 'City is required'),
      state: z.string().min(1, 'State is required'),
      zipCode: z.string().min(5, 'ZIP code is required'),
      
      // Preferences
      notifications: z.boolean(),
      newsletter: z.boolean(),
      theme: z.enum(['light', 'dark', 'auto']),
    })

    return (
      <div className="max-w-2xl mx-auto p-6">
        <Form
          schema={complexSchema}
          onSubmit={async (data) => {
            console.log('Complex form:', data)
            await new Promise(resolve => setTimeout(resolve, 1000))
          }}
          submitText="Save Profile"
        >
          <FormSection title="Personal Information" description="Your basic contact details">
            <FormGroup>
              <Field name="firstName" label="First Name" required />
              <Field name="lastName" label="Last Name" required />
            </FormGroup>
            <FormGroup>
              <EmailField name="email" label="Email Address" required />
              <Field name="phone" label="Phone Number" type="tel" />
            </FormGroup>
          </FormSection>

          <FormSection title="Address" description="Your billing and shipping address">
            <Field name="address1" label="Address Line 1" required />
            <Field name="address2" label="Address Line 2" />
            <FormGroup>
              <Field name="city" label="City" required />
              <Field name="state" label="State" required />
            </FormGroup>
            <Field name="zipCode" label="ZIP Code" required />
          </FormSection>

          <FormSection title="Preferences" description="Customize your experience">
            <SwitchField name="notifications" label="Email Notifications" />
            <SwitchField name="newsletter" label="Newsletter Subscription" />
            <SelectField 
              name="theme" 
              label="Theme Preference"
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'auto', label: 'System Default' },
              ]}
            />
          </FormSection>

          <FormActions align="between">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </FormActions>
        </Form>
      </div>
    )
  },
}

// Form without submit button (custom actions)
export const CustomActionsForm: Story = {
  render: () => {
    const simpleSchema = z.object({
      title: z.string().min(1, 'Title is required'),
      description: z.string().optional(),
    })

    return (
      <div className="max-w-md mx-auto p-6">
        <Form
          schema={simpleSchema}
          onSubmit={async (data) => {
            console.log('Custom actions form:', data)
            await new Promise(resolve => setTimeout(resolve, 500))
          }}
          showSubmitButton={false}
        >
          <Field name="title" label="Title" required />
          <TextareaField name="description" label="Description" />
          
          <FormActions align="between">
            <Button type="button" variant="outline">
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="secondary">
                Save Draft
              </Button>
              <Button type="submit">
                Publish
              </Button>
            </div>
          </FormActions>
        </Form>
      </div>
    )
  },
}

// Form with validation errors
export const FormWithErrors: Story = {
  render: () => (
    <div className="max-w-md mx-auto p-6">
      <Form
        schema={authSchemas.signUp}
        onSubmit={async (data) => {
          // Simulate server validation error
          throw new Error('Email already exists')
        }}
        defaultValues={{
          name: '',
          email: 'invalid-email',
          password: '123',
          confirmPassword: '456',
          terms: false,
        }}
        submitText="Create Account"
      >
        <Field name="name" label="Full Name" required />
        <EmailField name="email" label="Email" required />
        <PasswordField name="password" label="Password" required />
        <PasswordField name="confirmPassword" label="Confirm Password" required />
        <CheckboxField name="terms" label="I agree to the terms" />
      </Form>
    </div>
  ),
}

// Disabled form
export const DisabledForm: Story = {
  render: () => (
    <div className="max-w-md mx-auto p-6">
      <Form
        schema={contactSchema}
        onSubmit={async () => {}}
        disabled={true}
        submitText="Processing..."
        defaultValues={{
          name: 'John Doe',
          email: 'john@example.com',
          subject: 'Demo Subject',
          message: 'This form is disabled for demonstration purposes.',
          newsletter: true,
        }}
      >
        <Field name="name" label="Your Name" required />
        <EmailField name="email" label="Email Address" required />
        <Field name="subject" label="Subject" required />
        <TextareaField name="message" label="Message" rows={4} required />
        <CheckboxField name="newsletter" label="Subscribe to newsletter" />
      </Form>
    </div>
  ),
}