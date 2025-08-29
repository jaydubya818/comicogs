'use client'

import React from 'react'
import { useController, useFormContext } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, Eye, EyeOff, Info } from 'lucide-react'

interface FieldProps {
  name: string
  label?: string
  description?: string
  placeholder?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search'
  variant?: 'input' | 'textarea' | 'select' | 'checkbox' | 'switch' | 'radio'
  options?: Array<{ value: string; label: string; disabled?: boolean }>
  disabled?: boolean
  required?: boolean
  className?: string
  inputClassName?: string
  rows?: number
  min?: number
  max?: number
  step?: number
  autoComplete?: string
  autoFocus?: boolean
  showPasswordToggle?: boolean
}

// Base field wrapper with label and error handling
function FieldWrapper({
  name,
  label,
  description,
  required,
  children,
  className,
  error,
}: {
  name: string
  label?: string
  description?: string
  required?: boolean
  children: React.ReactNode
  className?: string
  error?: string
}) {
  const fieldId = `field-${name}`
  const descriptionId = `${fieldId}-description`
  const errorId = `${fieldId}-error`

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={fieldId} className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-1" aria-label="required">*</span>}
        </Label>
      )}
      
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground flex items-start gap-2">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          {description}
        </p>
      )}
      
      {children}
      
      {error && (
        <p id={errorId} className="text-sm text-destructive flex items-start gap-2" role="alert">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}

// Input field component
function InputField({
  name,
  type = 'text',
  placeholder,
  disabled,
  className,
  min,
  max,
  step,
  autoComplete,
  autoFocus,
  showPasswordToggle,
  field,
  error,
}: Omit<FieldProps, 'variant'> & {
  field: any
  error?: string
}) {
  const [showPassword, setShowPassword] = React.useState(false)
  const fieldId = `field-${name}`
  const isPassword = type === 'password'
  const inputType = isPassword && showPassword ? 'text' : type

  return (
    <div className="relative">
      <Input
        {...field}
        id={fieldId}
        type={inputType}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          error && 'border-destructive focus:border-destructive',
          isPassword && showPasswordToggle && 'pr-10',
          className
        )}
        min={min}
        max={max}
        step={step}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : undefined}
      />
      
      {isPassword && showPasswordToggle && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      )}
    </div>
  )
}

// Textarea field component
function InternalTextareaField({
  name,
  placeholder,
  disabled,
  className,
  rows = 4,
  field,
  error,
}: Omit<FieldProps, 'variant'> & {
  field: any
  error?: string
}) {
  const fieldId = `field-${name}`

  return (
    <Textarea
      {...field}
      id={fieldId}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      className={cn(
        error && 'border-destructive focus:border-destructive',
        className
      )}
      aria-invalid={!!error}
      aria-describedby={error ? `${fieldId}-error` : undefined}
    />
  )
}

// Select field component
function InternalSelectField({
  name,
  placeholder,
  disabled,
  options = [],
  field,
  error,
}: Omit<FieldProps, 'variant'> & {
  field: any
  error?: string
}) {
  return (
    <Select
      value={field.value || ''}
      onValueChange={field.onChange}
      disabled={disabled}
    >
      <SelectTrigger
        className={cn(
          error && 'border-destructive focus:border-destructive'
        )}
        aria-invalid={!!error}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// Checkbox field component  
function InternalCheckboxField({
  name,
  label,
  disabled,
  field,
}: Omit<FieldProps, 'variant'> & {
  field: any
}) {
  const fieldId = `field-${name}`

  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={fieldId}
        checked={field.value || false}
        onCheckedChange={field.onChange}
        disabled={disabled}
      />
      {label && (
        <Label htmlFor={fieldId} className="text-sm font-normal cursor-pointer">
          {label}
        </Label>
      )}
    </div>
  )
}

// Switch field component
function InternalSwitchField({
  name,
  label,
  disabled,
  field,
}: Omit<FieldProps, 'variant'> & {
  field: any
}) {
  const fieldId = `field-${name}`

  return (
    <div className="flex items-center justify-between">
      {label && (
        <Label htmlFor={fieldId} className="text-sm font-medium">
          {label}
        </Label>
      )}
      <Switch
        id={fieldId}
        checked={field.value || false}
        onCheckedChange={field.onChange}
        disabled={disabled}
      />
    </div>
  )
}

// Main Field component
export function Field({
  name,
  label,
  description,
  variant = 'input',
  required,
  className,
  inputClassName,
  ...fieldProps
}: FieldProps) {
  const { control } = useFormContext()
  
  const {
    field,
    fieldState: { error },
  } = useController({
    name,
    control,
  })

  const errorMessage = error?.message

  // For checkbox and switch, handle the wrapper differently
  if (variant === 'checkbox') {
    return (
      <div className={cn('space-y-2', className)}>
        <InternalCheckboxField
          {...fieldProps}
          name={name}
          label={label}
          field={field}
        />
        {description && (
          <p className="text-sm text-muted-foreground ml-6">
            {description}
          </p>
        )}
        {errorMessage && (
          <p className="text-sm text-destructive flex items-start gap-2 ml-6" role="alert">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            {errorMessage}
          </p>
        )}
      </div>
    )
  }

  if (variant === 'switch') {
    return (
      <FieldWrapper
        name={name}
        description={description}
        className={className}
        error={errorMessage}
      >
        <InternalSwitchField
          {...fieldProps}
          name={name}
          label={label}
          field={field}
        />
      </FieldWrapper>
    )
  }

  // For other field types, use the standard wrapper
  return (
    <FieldWrapper
      name={name}
      label={label}
      description={description}
      required={required}
      className={className}
      error={errorMessage}
    >
      {variant === 'textarea' ? (
        <InternalTextareaField
          {...fieldProps}
          name={name}
          field={field}
          error={errorMessage}
          className={inputClassName}
        />
      ) : variant === 'select' ? (
        <InternalSelectField
          {...fieldProps}
          name={name}
          field={field}
          error={errorMessage}
        />
      ) : (
        <InputField
          {...fieldProps}
          name={name}
          field={field}
          error={errorMessage}
          className={inputClassName}
        />
      )}
    </FieldWrapper>
  )
}

// Convenience components for common field types
export function EmailField(props: Omit<FieldProps, 'type' | 'variant'>) {
  return (
    <Field
      {...props}
      type="email"
      autoComplete="email"
    />
  )
}

export function PasswordField(props: Omit<FieldProps, 'type' | 'variant'>) {
  return (
    <Field
      {...props}
      type="password"
      autoComplete="current-password"
      showPasswordToggle
    />
  )
}

export function NumberField(props: Omit<FieldProps, 'type' | 'variant'>) {
  return (
    <Field
      {...props}
      type="number"
    />
  )
}

export function SearchField(props: Omit<FieldProps, 'type' | 'variant'>) {
  return (
    <Field
      {...props}
      type="search"
      autoComplete="off"
    />
  )
}

export function TextareaField(props: Omit<FieldProps, 'variant'>) {
  return (
    <Field
      {...props}
      variant="textarea"
    />
  )
}

export function SelectField(props: Omit<FieldProps, 'variant'>) {
  return (
    <Field
      {...props}
      variant="select"
    />
  )
}

export function CheckboxField(props: Omit<FieldProps, 'variant'>) {
  return (
    <Field
      {...props}
      variant="checkbox"
    />
  )
}

export function SwitchField(props: Omit<FieldProps, 'variant'>) {
  return (
    <Field
      {...props}
      variant="switch"
    />
  )
}