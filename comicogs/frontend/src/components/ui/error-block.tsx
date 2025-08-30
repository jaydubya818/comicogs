'use client'

import { ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface ErrorBlockProps {
  title?: string
  message?: string
  icon?: ReactNode
  retry?: {
    label?: string
    onClick: () => void
  }
  className?: string
}

export function ErrorBlock({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  icon,
  retry,
  className
}: ErrorBlockProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-6 text-center",
      "border border-destructive/20 rounded-lg bg-destructive/5",
      className
    )}>
      <div className="mb-4">
        {icon || <AlertTriangle className="h-8 w-8 text-destructive" />}
      </div>
      
      <h3 className="text-lg font-semibold text-destructive mb-2">
        {title}
      </h3>
      
      <p className="text-muted-foreground max-w-md mb-4">
        {message}
      </p>
      
      {retry && (
        <Button
          variant="outline"
          onClick={retry.onClick}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          {retry.label || 'Try Again'}
        </Button>
      )}
    </div>
  )
}