'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  AlertTriangle, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  Bug,
  Wifi,
  Server,
  Shield,
  Clock,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink
} from 'lucide-react'

interface ErrorBlockProps {
  title?: string
  message?: string
  error?: Error | string
  variant?: 'error' | 'warning' | 'critical' | 'network' | 'timeout' | 'security'
  size?: 'sm' | 'md' | 'lg'
  showDetails?: boolean
  showRetry?: boolean
  showReport?: boolean
  onRetry?: () => void
  onReport?: (error: Error | string) => void
  className?: string
  children?: React.ReactNode
}

const VARIANT_CONFIGS = {
  error: {
    icon: XCircle,
    iconColor: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    borderColor: 'border-red-200 dark:border-red-800',
    defaultTitle: 'An error occurred',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    defaultTitle: 'Warning',
  },
  critical: {
    icon: AlertCircle,
    iconColor: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    borderColor: 'border-red-300 dark:border-red-700',
    defaultTitle: 'Critical Error',
  },
  network: {
    icon: Wifi,
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    defaultTitle: 'Connection Error',
  },
  timeout: {
    icon: Clock,
    iconColor: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    defaultTitle: 'Request Timeout',
  },
  security: {
    icon: Shield,
    iconColor: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    defaultTitle: 'Security Error',
  },
} as const

const SIZE_CONFIGS = {
  sm: {
    container: 'p-4',
    iconSize: 'h-5 w-5',
    titleSize: 'text-sm font-medium',
    messageSize: 'text-sm',
    buttonSize: 'sm' as const,
  },
  md: {
    container: 'p-6',
    iconSize: 'h-6 w-6',
    titleSize: 'text-base font-semibold',
    messageSize: 'text-sm',
    buttonSize: 'default' as const,
  },
  lg: {
    container: 'p-8',
    iconSize: 'h-8 w-8',
    titleSize: 'text-lg font-semibold',
    messageSize: 'text-base',
    buttonSize: 'default' as const,
  },
} as const

function getErrorMessage(error: Error | string): string {
  if (typeof error === 'string') return error
  return error.message || 'An unexpected error occurred'
}

function getErrorStack(error: Error | string): string | undefined {
  if (typeof error === 'string') return undefined
  return error.stack
}

function getErrorDetails(error: Error | string): Record<string, any> | undefined {
  if (typeof error === 'string') return undefined
  
  const details: Record<string, any> = {}
  
  if (error.name) details.name = error.name
  if ((error as any).code) details.code = (error as any).code
  if ((error as any).status) details.status = (error as any).status
  if ((error as any).statusText) details.statusText = (error as any).statusText
  
  return Object.keys(details).length > 0 ? details : undefined
}

export function ErrorBlock({
  title,
  message,
  error,
  variant = 'error',
  size = 'md',
  showDetails = false,
  showRetry = true,
  showReport = false,
  onRetry,
  onReport,
  className,
  children,
}: ErrorBlockProps) {
  const [isDetailsExpanded, setIsDetailsExpanded] = React.useState(false)
  const [isCopied, setIsCopied] = React.useState(false)
  
  const config = VARIANT_CONFIGS[variant]
  const sizeConfig = SIZE_CONFIGS[size]
  const Icon = config.icon
  
  const errorMessage = message || (error ? getErrorMessage(error) : '')
  const errorStack = error ? getErrorStack(error) : undefined
  const errorDetails = error ? getErrorDetails(error) : undefined
  const displayTitle = title || config.defaultTitle

  const handleCopyError = async () => {
    const errorInfo = [
      `Title: ${displayTitle}`,
      `Message: ${errorMessage}`,
      errorDetails && `Details: ${JSON.stringify(errorDetails, null, 2)}`,
      errorStack && `Stack Trace:\n${errorStack}`,
    ].filter(Boolean).join('\n\n')
    
    try {
      await navigator.clipboard.writeText(errorInfo)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy error details:', err)
    }
  }

  const handleRetry = () => {
    onRetry?.()
  }

  const handleReport = () => {
    if (error) {
      onReport?.(error)
    }
  }

  return (
    <div
      className={cn(
        'rounded-lg border',
        config.bgColor,
        config.borderColor,
        sizeConfig.container,
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <Icon 
            className={cn(sizeConfig.iconSize, config.iconColor)}
            aria-hidden="true"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title and message */}
          <div className="space-y-1">
            <h3 className={cn('text-foreground', sizeConfig.titleSize)}>
              {displayTitle}
            </h3>
            {errorMessage && (
              <p className={cn('text-muted-foreground', sizeConfig.messageSize)}>
                {errorMessage}
              </p>
            )}
          </div>

          {/* Custom children */}
          {children && (
            <div className="mt-3">
              {children}
            </div>
          )}

          {/* Error details */}
          {showDetails && (errorDetails || errorStack) && (
            <div className="mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                className="h-auto p-0 text-muted-foreground hover:text-foreground"
              >
                {isDetailsExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Show Details
                  </>
                )}
              </Button>

              {isDetailsExpanded && (
                <div className="mt-3 p-3 bg-muted rounded-md text-sm font-mono">
                  {errorDetails && (
                    <div className="mb-3">
                      <strong>Details:</strong>
                      <pre className="mt-1 whitespace-pre-wrap">
                        {JSON.stringify(errorDetails, null, 2)}
                      </pre>
                    </div>
                  )}
                  {errorStack && (
                    <div>
                      <strong>Stack Trace:</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-xs">
                        {errorStack}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {(showRetry || showReport || showDetails) && (
            <div className="flex items-center space-x-3 mt-4">
              {showRetry && onRetry && (
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  size={sizeConfig.buttonSize}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}

              {showReport && (
                <Button
                  onClick={handleReport}
                  variant="ghost"
                  size={sizeConfig.buttonSize}
                >
                  <Bug className="h-4 w-4 mr-2" />
                  Report Issue
                </Button>
              )}

              {showDetails && (errorDetails || errorStack) && (
                <Button
                  onClick={handleCopyError}
                  variant="ghost"
                  size={sizeConfig.buttonSize}
                  disabled={isCopied}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {isCopied ? 'Copied!' : 'Copy Error'}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Specialized error components
export function NetworkError({
  onRetry,
  ...props
}: Omit<ErrorBlockProps, 'variant' | 'title' | 'message'>) {
  return (
    <ErrorBlock
      variant="network"
      title="Connection Failed"
      message="Unable to connect to the server. Please check your internet connection and try again."
      onRetry={onRetry}
      {...props}
    />
  )
}

export function TimeoutError({
  onRetry,
  ...props
}: Omit<ErrorBlockProps, 'variant' | 'title' | 'message'>) {
  return (
    <ErrorBlock
      variant="timeout"
      title="Request Timeout"
      message="The request took too long to complete. Please try again."
      onRetry={onRetry}
      {...props}
    />
  )
}

export function ServerError({
  onRetry,
  ...props
}: Omit<ErrorBlockProps, 'variant' | 'title' | 'message'>) {
  return (
    <ErrorBlock
      variant="critical"
      title="Server Error"
      message="The server encountered an error. Our team has been notified and is working on a fix."
      onRetry={onRetry}
      showReport
      {...props}
    />
  )
}

export function AuthenticationError({
  onRetry,
  ...props
}: Omit<ErrorBlockProps, 'variant' | 'title' | 'message'>) {
  return (
    <ErrorBlock
      variant="security"
      title="Authentication Required"
      message="You need to sign in to access this content."
      showRetry={false}
      {...props}
    >
      <div className="mt-3">
        <Button size="sm">
          <ExternalLink className="h-4 w-4 mr-2" />
          Sign In
        </Button>
      </div>
    </ErrorBlock>
  )
}

export function PermissionError(props: Omit<ErrorBlockProps, 'variant' | 'title' | 'message'>) {
  return (
    <ErrorBlock
      variant="security"
      title="Access Denied"
      message="You don't have permission to access this resource."
      showRetry={false}
      {...props}
    />
  )
}

export function ValidationError({
  errors,
  ...props
}: Omit<ErrorBlockProps, 'variant' | 'title' | 'message'> & {
  errors?: string[]
}) {
  return (
    <ErrorBlock
      variant="warning"
      title="Validation Error"
      message="Please fix the following issues:"
      showRetry={false}
      {...props}
    >
      {errors && errors.length > 0 && (
        <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-muted-foreground">
          {errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      )}
    </ErrorBlock>
  )
}