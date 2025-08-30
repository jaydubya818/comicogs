'use client'

import { useCallback } from 'react'

/**
 * Custom hook for making live announcements to screen readers
 * Uses ARIA live regions to announce dynamic content changes
 */
export function useLiveAnnouncer() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // Don't announce empty messages
    if (!message.trim()) {
      return
    }

    // Create a temporary live region element
    const liveRegion = document.createElement('div')
    liveRegion.setAttribute('aria-live', priority)
    liveRegion.setAttribute('aria-atomic', 'true')
    liveRegion.className = 'sr-only' // Screen reader only class
    
    // Position offscreen but accessible to screen readers
    liveRegion.style.position = 'absolute'
    liveRegion.style.left = '-10000px'
    liveRegion.style.width = '1px'
    liveRegion.style.height = '1px'
    liveRegion.style.overflow = 'hidden'

    // Add to DOM
    document.body.appendChild(liveRegion)

    // Set the message (this triggers the announcement)
    liveRegion.textContent = message

    // Clean up after announcement is complete
    setTimeout(() => {
      if (document.body.contains(liveRegion)) {
        document.body.removeChild(liveRegion)
      }
    }, 1000)
  }, [])

  // Convenience methods for common announcement types
  const announceFilter = useCallback((action: 'added' | 'removed' | 'cleared', filterName: string, value?: string) => {
    let message = ''
    
    switch (action) {
      case 'added':
        message = value 
          ? `Filter added: ${filterName} set to ${value}`
          : `Filter added: ${filterName}`
        break
      case 'removed':
        message = value 
          ? `Filter removed: ${filterName} with value ${value}`
          : `Filter removed: ${filterName}`
        break
      case 'cleared':
        message = 'All filters cleared'
        break
    }
    
    announce(message)
  }, [announce])

  const announceResults = useCallback((count: number, isLoading = false) => {
    if (isLoading) {
      announce('Loading search results...')
    } else {
      const message = count === 1 
        ? '1 result found' 
        : `${count.toLocaleString()} results found`
      announce(message)
    }
  }, [announce])

  const announceNavigation = useCallback((page: number, totalPages: number) => {
    announce(`Page ${page} of ${totalPages}`)
  }, [announce])

  const announceSort = useCallback((sortOption: string) => {
    announce(`Results sorted by ${sortOption}`)
  }, [announce])

  const announceError = useCallback((error: string) => {
    announce(`Error: ${error}`, 'assertive')
  }, [announce])

  const announceSuccess = useCallback((message: string) => {
    announce(`Success: ${message}`)
  }, [announce])

  return {
    announce,
    announceFilter,
    announceResults,
    announceNavigation,
    announceSort,
    announceError,
    announceSuccess
  }
}