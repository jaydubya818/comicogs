'use client'

import { useCallback } from 'react'
import { toast } from 'sonner'

export interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  metadata?: Record<string, any>
}

export interface ErrorHandlerOptions {
  showToast?: boolean
  toastMessage?: string
  logToConsole?: boolean
  reportToService?: boolean
  level?: 'error' | 'warn' | 'info'
}

export function useErrorHandler() {
  const reportError = useCallback(async (
    error: Error | string,
    context?: ErrorContext,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      toastMessage,
      logToConsole = true,
      reportToService = true,
      level = 'error'
    } = options

    const errorMessage = typeof error === 'string' ? error : error.message
    const errorStack = typeof error === 'string' ? undefined : error.stack

    // Log to console in development
    if (logToConsole && process.env.NODE_ENV === 'development') {
      console[level]('Error handled:', {
        message: errorMessage,
        stack: errorStack,
        context,
        timestamp: new Date().toISOString()
      })
    }

    // Show user-friendly toast notification
    if (showToast) {
      const displayMessage = toastMessage || getErrorMessage(errorMessage)
      
      switch (level) {
        case 'error':
          toast.error(displayMessage)
          break
        case 'warn':
          toast.warning(displayMessage)
          break
        case 'info':
          toast.info(displayMessage)
          break
      }
    }

    // Report to error monitoring service
    if (reportToService && typeof window !== 'undefined') {
      try {
        const errorData = {
          message: errorMessage,
          stack: errorStack,
          context,
          level,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          sessionId: getSessionId(),
          userId: context?.userId
        }

        // Send to error reporting endpoint
        fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorData)
        }).catch(console.error)

      } catch (reportingError) {
        console.error('Failed to report error:', reportingError)
      }
    }
  }, [])

  // Specialized error handlers for common scenarios
  const handleApiError = useCallback((error: any, action?: string) => {
    let message = 'An unexpected error occurred'
    let level: 'error' | 'warn' = 'error'

    if (error?.response?.status) {
      switch (error.response.status) {
        case 401:
          message = 'You need to log in to perform this action'
          break
        case 403:
          message = 'You don\'t have permission to perform this action'
          break
        case 404:
          message = 'The requested resource was not found'
          break
        case 429:
          message = 'Too many requests. Please try again later'
          level = 'warn'
          break
        case 500:
          message = 'Server error. Please try again later'
          break
        default:
          message = error.response.data?.message || message
      }
    } else if (error?.message) {
      message = error.message
    }

    return reportError(error, { action, component: 'API' }, {
      toastMessage: message,
      level
    })
  }, [reportError])

  const handleFormError = useCallback((error: any, formName?: string) => {
    const message = error?.message || 'Please check your input and try again'
    return reportError(error, { component: 'Form', action: formName }, {
      toastMessage: message,
      level: 'warn'
    })
  }, [reportError])

  const handleAsyncError = useCallback(async (
    asyncOperation: () => Promise<any>,
    errorContext?: ErrorContext,
    options?: ErrorHandlerOptions
  ) => {
    try {
      return await asyncOperation()
    } catch (error) {
      await reportError(error as Error, errorContext, options)
      throw error // Re-throw so caller can handle if needed
    }
  }, [reportError])

  return {
    reportError,
    handleApiError,
    handleFormError,
    handleAsyncError
  }
}

// Utility functions
function getErrorMessage(errorMessage: string): string {
  // Map technical error messages to user-friendly ones
  const errorMappings: Record<string, string> = {
    'Network Error': 'Connection problem. Please check your internet and try again.',
    'Failed to fetch': 'Unable to connect to the server. Please try again.',
    'Unauthorized': 'Please log in to continue.',
    'Forbidden': 'You don\'t have permission to do that.',
    'Not Found': 'The page or resource you\'re looking for doesn\'t exist.',
    'Internal Server Error': 'Something went wrong on our end. Please try again later.',
    'Bad Gateway': 'Service temporarily unavailable. Please try again later.',
    'Service Unavailable': 'Service temporarily unavailable. Please try again later.',
    'Timeout': 'The request timed out. Please try again.'
  }

  return errorMappings[errorMessage] || 'Something went wrong. Please try again.'
}

function getSessionId(): string {
  // Get or create session ID for error tracking
  if (typeof window === 'undefined') return 'server'
  
  let sessionId = sessionStorage.getItem('error-session-id')
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('error-session-id', sessionId)
  }
  return sessionId
}

// Global error handler for unhandled promise rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
    
    // Report unhandled rejections
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        level: 'error',
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        context: { component: 'Global', action: 'unhandledrejection' }
      })
    }).catch(console.error)
  })

  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error)
    
    // Report global errors
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: event.error?.message || event.message || 'Global error',
        stack: event.error?.stack,
        level: 'error',
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        context: { 
          component: 'Global', 
          action: 'error',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      })
    }).catch(console.error)
  })
}