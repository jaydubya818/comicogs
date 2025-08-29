'use client'

import React from 'react'
import { useForm, FormProvider, UseFormReturn, FieldValues, UseFormProps } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface FormProps<TSchema extends z.ZodType<any, any, any>>
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  schema: TSchema
  onSubmit: (data: z.infer<TSchema>) => Promise<void> | void
  children: React.ReactNode
  defaultValues?: UseFormProps<z.infer<TSchema>>['defaultValues']
  mode?: UseFormProps<z.infer<TSchema>>['mode']
  disabled?: boolean
  submitText?: string
  showSubmitButton?: boolean
  submitButtonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  submitButtonSize?: 'default' | 'sm' | 'lg' | 'icon'
  resetOnSuccess?: boolean
  className?: string
}

export function Form<TSchema extends z.ZodType<any, any, any>>({
  schema,
  onSubmit,
  children,
  defaultValues,
  mode = 'onChange',
  disabled = false,
  submitText = 'Submit',
  showSubmitButton = true,
  submitButtonVariant = 'default',
  submitButtonSize = 'default',
  resetOnSuccess = false,
  className,
  ...formProps
}: FormProps<TSchema>) {
  const methods = useForm<z.infer<TSchema>>({
    resolver: zodResolver(schema),
    defaultValues,
    mode,
  })

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = methods

  const handleFormSubmit = async (data: z.infer<TSchema>) => {
    try {
      await onSubmit(data)
      if (resetOnSuccess) {
        reset()
      }
    } catch (error) {
      // Error handling is managed by the parent component or error boundary
      throw error
    }
  }

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className={cn('space-y-6', className)}
        noValidate
        {...formProps}
      >
        {children}

        {showSubmitButton && (
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={disabled || isSubmitting}
              variant={submitButtonVariant}
              size={submitButtonSize}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                submitText
              )}
            </Button>
          </div>
        )}
      </form>
    </FormProvider>
  )
}

// Hook to access form methods within form context
export function useFormContext<T extends FieldValues = FieldValues>(): UseFormReturn<T> {
  return React.useContext(FormProvider) as UseFormReturn<T>
}

// Form section component for grouping related fields
interface FormSectionProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {(title || description) && (
        <div className="space-y-2">
          {title && (
            <h3 className="text-lg font-medium text-foreground">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

// Form group for inline fields
interface FormGroupProps {
  children: React.ReactNode
  className?: string
}

export function FormGroup({ children, className }: FormGroupProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2', className)}>
      {children}
    </div>
  )
}

// Form actions component for buttons
interface FormActionsProps {
  children: React.ReactNode
  className?: string
  align?: 'left' | 'center' | 'right' | 'between'
}

export function FormActions({ children, className, align = 'right' }: FormActionsProps) {
  const alignmentClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between'
  }

  return (
    <div className={cn(
      'flex items-center gap-4',
      alignmentClasses[align],
      className
    )}>
      {children}
    </div>
  )
}

// Utility function to create form schemas with common validations
export const formSchemas = {
  email: () => z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
    
  password: (minLength: number = 8) => z.string()
    .min(1, 'Password is required')
    .min(minLength, `Password must be at least ${minLength} characters`),
    
  confirmPassword: (passwordField: string = 'password') => z.string()
    .min(1, 'Please confirm your password'),
    
  phone: () => z.string()
    .min(1, 'Phone number is required')
    .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number'),
    
  url: () => z.string()
    .url('Please enter a valid URL'),
    
  positiveNumber: () => z.number()
    .positive('Must be a positive number'),
    
  price: () => z.number()
    .positive('Price must be positive')
    .multipleOf(0.01, 'Price can only have up to 2 decimal places'),
    
  required: (message: string = 'This field is required') => z.string()
    .min(1, message),
    
  optional: () => z.string().optional(),
    
  array: <T,>(itemSchema: z.ZodType<T>) => z.array(itemSchema)
    .min(1, 'At least one item is required'),
}

// Common form schemas
export const authSchemas = {
  signIn: z.object({
    email: formSchemas.email(),
    password: formSchemas.password(),
    remember: z.boolean().optional(),
  }),
  
  signUp: z.object({
    name: formSchemas.required('Name is required'),
    email: formSchemas.email(),
    password: formSchemas.password(),
    confirmPassword: formSchemas.confirmPassword(),
    terms: z.boolean().refine(val => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }),
  
  forgotPassword: z.object({
    email: formSchemas.email(),
  }),
  
  resetPassword: z.object({
    password: formSchemas.password(),
    confirmPassword: formSchemas.confirmPassword(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }),
}

export const comicSchemas = {
  createListing: z.object({
    title: formSchemas.required('Title is required'),
    series: formSchemas.required('Series is required'),
    issue: formSchemas.required('Issue number is required'),
    grade: formSchemas.required('Grade is required'),
    price: formSchemas.price(),
    description: formSchemas.optional(),
    images: z.array(z.string().url()).optional(),
    condition: formSchemas.required('Condition is required'),
    format: z.enum(['raw', 'slab'], {
      required_error: 'Format is required',
    }),
  }),
  
  searchComics: z.object({
    query: formSchemas.optional(),
    series: formSchemas.optional(),
    publisher: formSchemas.optional(),
    yearStart: z.number().min(1900).max(new Date().getFullYear()).optional(),
    yearEnd: z.number().min(1900).max(new Date().getFullYear()).optional(),
    minPrice: z.number().min(0).optional(),
    maxPrice: z.number().min(0).optional(),
    grade: formSchemas.optional(),
    format: z.enum(['raw', 'slab', 'any']).optional(),
  }).refine((data) => {
    if (data.yearStart && data.yearEnd) {
      return data.yearStart <= data.yearEnd
    }
    return true
  }, {
    message: 'Start year must be before end year',
    path: ['yearEnd'],
  }).refine((data) => {
    if (data.minPrice && data.maxPrice) {
      return data.minPrice <= data.maxPrice
    }
    return true
  }, {
    message: 'Minimum price must be less than maximum price',
    path: ['maxPrice'],
  }),
}