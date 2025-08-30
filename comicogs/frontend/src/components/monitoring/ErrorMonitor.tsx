'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertTriangle, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ErrorLog {
  id: string
  message: string
  level: 'error' | 'warn' | 'info'
  timestamp: string
  url: string
  userAgent: string
  context?: {
    component?: string
    action?: string
    userId?: string
  }
  resolved?: boolean
}

interface ErrorMonitorProps {
  showInDevelopment?: boolean
  maxEntries?: number
  autoRefresh?: boolean
  refreshInterval?: number
}

export function ErrorMonitor({
  showInDevelopment = true,
  maxEntries = 50,
  autoRefresh = true,
  refreshInterval = 30000
}: ErrorMonitorProps) {
  const [errors, setErrors] = useState<ErrorLog[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    errors: 0,
    warnings: 0,
    resolved: 0
  })

  // Only show in development or when explicitly enabled
  const shouldShow = process.env.NODE_ENV === 'development' ? showInDevelopment : true

  useEffect(() => {
    if (!shouldShow) return

    // Listen for new errors from localStorage or custom events
    const handleStorageChange = () => {
      loadErrorsFromStorage()
    }

    const handleNewError = (event: CustomEvent) => {
      const errorData = event.detail as ErrorLog
      setErrors(prev => {
        const newErrors = [errorData, ...prev].slice(0, maxEntries)
        saveErrorsToStorage(newErrors)
        return newErrors
      })
    }

    // Load initial errors
    loadErrorsFromStorage()

    // Set up listeners
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('app-error' as any, handleNewError)

    // Auto-refresh
    let intervalId: NodeJS.Timeout | null = null
    if (autoRefresh) {
      intervalId = setInterval(loadErrorsFromStorage, refreshInterval)
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('app-error' as any, handleNewError)
      if (intervalId) clearInterval(intervalId)
    }
  }, [shouldShow, maxEntries, autoRefresh, refreshInterval])

  useEffect(() => {
    // Update stats when errors change
    const newStats = {
      total: errors.length,
      errors: errors.filter(e => e.level === 'error').length,
      warnings: errors.filter(e => e.level === 'warn').length,
      resolved: errors.filter(e => e.resolved).length
    }
    setStats(newStats)
  }, [errors])

  const loadErrorsFromStorage = () => {
    try {
      const stored = localStorage.getItem('app-errors')
      if (stored) {
        const parsedErrors = JSON.parse(stored)
        setErrors(parsedErrors.slice(0, maxEntries))
      }
    } catch (error) {
      console.error('Failed to load errors from storage:', error)
    }
  }

  const saveErrorsToStorage = (errors: ErrorLog[]) => {
    try {
      localStorage.setItem('app-errors', JSON.stringify(errors))
    } catch (error) {
      console.error('Failed to save errors to storage:', error)
    }
  }

  const clearErrors = () => {
    setErrors([])
    localStorage.removeItem('app-errors')
  }

  const markAsResolved = (errorId: string) => {
    setErrors(prev => prev.map(error => 
      error.id === errorId ? { ...error, resolved: true } : error
    ))
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'destructive'
      case 'warn':
        return 'warning'
      case 'info':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertTriangle className="h-4 w-4" />
      case 'warn':
        return <TrendingUp className="h-4 w-4" />
      case 'info':
        return <TrendingDown className="h-4 w-4" />
      default:
        return null
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  if (!shouldShow) return null

  return (
    <>
      {/* Floating error indicator */}
      {errors.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            onClick={() => setIsVisible(!isVisible)}
            variant={stats.errors > 0 ? "destructive" : "secondary"}
            size="sm"
            className="relative"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            {stats.total}
            {stats.errors > 0 && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
            )}
          </Button>
        </div>
      )}

      {/* Error monitor panel */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 w-96 max-h-[500px] z-50">
          <Card className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Error Monitor</CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={loadErrorsFromStorage}
                    size="sm"
                    variant="outline"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => setIsVisible(false)}
                    size="sm"
                    variant="outline"
                  >
                    ×
                  </Button>
                </div>
              </div>
              <CardDescription>
                Development error tracking and monitoring
              </CardDescription>

              {/* Stats */}
              <div className="flex gap-2 pt-2">
                <Badge variant="secondary">Total: {stats.total}</Badge>
                <Badge variant="destructive">Errors: {stats.errors}</Badge>
                <Badge variant="secondary">Warnings: {stats.warnings}</Badge>
                <Badge variant="outline">Resolved: {stats.resolved}</Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {errors.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No errors logged
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-muted-foreground">
                      Recent errors
                    </span>
                    <Button
                      onClick={clearErrors}
                      size="sm"
                      variant="ghost"
                      className="text-xs"
                    >
                      Clear all
                    </Button>
                  </div>

                  <ScrollArea className="h-80">
                    <div className="space-y-2">
                      {errors.map((error) => (
                        <div
                          key={error.id}
                          className={cn(
                            "border rounded-md p-3 text-sm",
                            error.resolved && "opacity-50"
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <Badge
                              variant={getLevelColor(error.level) as any}
                              className="flex items-center gap-1"
                            >
                              {getLevelIcon(error.level)}
                              {error.level}
                            </Badge>
                            
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {error.message}
                              </p>
                              
                              <div className="text-xs text-muted-foreground mt-1 space-y-1">
                                <p>{formatTimestamp(error.timestamp)}</p>
                                {error.context?.component && (
                                  <p>Component: {error.context.component}</p>
                                )}
                                {error.context?.action && (
                                  <p>Action: {error.context.action}</p>
                                )}
                                <p className="truncate">URL: {error.url}</p>
                              </div>

                              {!error.resolved && (
                                <Button
                                  onClick={() => markAsResolved(error.id)}
                                  size="sm"
                                  variant="ghost"
                                  className="mt-2 h-6 text-xs"
                                >
                                  Mark resolved
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

// Hook to add errors to the monitor
export function useErrorMonitor() {
  const addError = (error: Omit<ErrorLog, 'id' | 'timestamp'>) => {
    const errorLog: ErrorLog = {
      ...error,
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    }

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('app-error', { detail: errorLog }))

    // Also save to localStorage as fallback
    try {
      const stored = localStorage.getItem('app-errors')
      const errors = stored ? JSON.parse(stored) : []
      const updatedErrors = [errorLog, ...errors].slice(0, 50)
      localStorage.setItem('app-errors', JSON.stringify(updatedErrors))
    } catch (error) {
      console.error('Failed to save error to localStorage:', error)
    }
  }

  return { addError }
}