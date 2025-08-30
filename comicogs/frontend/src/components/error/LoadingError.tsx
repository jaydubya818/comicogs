'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface LoadingErrorProps {
  title?: string
  message?: string
  onRetry?: () => void
  showNetworkStatus?: boolean
  variant?: 'default' | 'minimal' | 'card'
  className?: string
}

export function LoadingError({
  title = 'Failed to Load',
  message = 'Something went wrong while loading this content.',
  onRetry,
  showNetworkStatus = true,
  variant = 'default',
  className
}: LoadingErrorProps) {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    if (!showNetworkStatus) return

    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    updateOnlineStatus()
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [showNetworkStatus])

  const getErrorMessage = () => {
    if (!isOnline && showNetworkStatus) {
      return 'No internet connection. Please check your network and try again.'
    }
    return message
  }

  const getIcon = () => {
    if (!isOnline && showNetworkStatus) {
      return <WifiOff className="h-5 w-5 text-destructive" />
    }
    return <AlertTriangle className="h-5 w-5 text-destructive" />
  }

  if (variant === 'minimal') {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        {getIcon()}
        <span>{getErrorMessage()}</span>
        {onRetry && (
          <Button 
            onClick={onRetry} 
            size="sm" 
            variant="ghost" 
            className="h-6 px-2"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div className={cn(
        "border border-destructive/20 rounded-lg bg-destructive/5 p-4",
        className
      )}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-destructive">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {getErrorMessage()}
            </p>
            {onRetry && (
              <Button 
                onClick={onRetry} 
                size="sm" 
                variant="outline" 
                className="mt-3 flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Default variant
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-8 text-center",
      className
    )}>
      <div className="flex justify-center mb-4">
        <div className="rounded-full bg-destructive/10 p-3">
          {getIcon()}
        </div>
      </div>
      
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      
      <p className="text-muted-foreground mb-4 max-w-sm">
        {getErrorMessage()}
      </p>

      {showNetworkStatus && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4 text-green-500" />
              <span>Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-red-500" />
              <span>Offline</span>
            </>
          )}
        </div>
      )}

      {onRetry && (
        <Button onClick={onRetry} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  )
}

// Specialized loading error components
export function NetworkError({ onRetry, className }: { onRetry?: () => void; className?: string }) {
  return (
    <LoadingError
      title="Connection Error"
      message="Unable to connect to the server. Please check your internet connection."
      onRetry={onRetry}
      showNetworkStatus
      className={className}
    />
  )
}

export function TimeoutError({ onRetry, className }: { onRetry?: () => void; className?: string }) {
  return (
    <LoadingError
      title="Request Timeout"
      message="The request took too long to complete. Please try again."
      onRetry={onRetry}
      showNetworkStatus={false}
      className={className}
    />
  )
}

export function ServerError({ onRetry, className }: { onRetry?: () => void; className?: string }) {
  return (
    <LoadingError
      title="Server Error"
      message="Something went wrong on our end. Please try again in a moment."
      onRetry={onRetry}
      showNetworkStatus={false}
      className={className}
    />
  )
}

export function DataError({ onRetry, className }: { onRetry?: () => void; className?: string }) {
  return (
    <LoadingError
      title="Data Error"
      message="There was a problem loading the data. Please try again."
      onRetry={onRetry}
      showNetworkStatus={false}
      className={className}
    />
  )
}