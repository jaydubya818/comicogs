'use client'

import { useState } from 'react'
import { Bookmark, BookmarkCheck, Heart, Share } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLiveAnnouncer } from '@/lib/accessibility/useLiveAnnouncer'

interface SaveSearchButtonProps {
  searchParams: URLSearchParams
  searchQuery?: string
  appliedFiltersCount: number
  isLoggedIn?: boolean
  onSave?: (searchData: SavedSearchData) => void
  onShare?: (searchUrl: string) => void
  onCreateAlert?: (searchData: SavedSearchData) => void
  className?: string
}

interface SavedSearchData {
  query?: string
  filters: Record<string, string | string[]>
  url: string
  timestamp: number
}

export function SaveSearchButton({
  searchParams,
  searchQuery,
  appliedFiltersCount,
  isLoggedIn = false,
  onSave,
  onShare,
  onCreateAlert,
  className
}: SaveSearchButtonProps) {
  const [isSaved, setIsSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { announce, announceSuccess, announceError } = useLiveAnnouncer()

  // Convert URLSearchParams to filters object
  const filtersFromParams = (): Record<string, string | string[]> => {
    const filters: Record<string, string | string[]> = {}
    
    for (const [key, value] of searchParams.entries()) {
      if (key === 'search') continue // Handle separately
      
      if (filters[key]) {
        // Handle multiple values for same key
        if (Array.isArray(filters[key])) {
          (filters[key] as string[]).push(value)
        } else {
          filters[key] = [filters[key] as string, value]
        }
      } else {
        filters[key] = value
      }
    }
    
    return filters
  }

  const createSavedSearchData = (): SavedSearchData => ({
    query: searchQuery,
    filters: filtersFromParams(),
    url: `${window.location.pathname}?${searchParams.toString()}`,
    timestamp: Date.now()
  })

  const handleSaveSearch = async () => {
    if (!isLoggedIn) {
      announceError('Please log in to save searches')
      return
    }

    setIsLoading(true)
    
    try {
      const searchData = createSavedSearchData()
      
      if (onSave) {
        await onSave(searchData)
      }
      
      setIsSaved(true)
      announceSuccess('Search saved successfully')
      
      // Reset saved state after a delay
      setTimeout(() => setIsSaved(false), 3000)
    } catch (error) {
      announceError('Failed to save search')
      console.error('Save search error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleShareSearch = async () => {
    const currentUrl = `${window.location.origin}${window.location.pathname}?${searchParams.toString()}`
    
    try {
      if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
        // Use native sharing on mobile devices
        await navigator.share({
          title: 'Comic Search Results',
          text: searchQuery ? `Search results for "${searchQuery}"` : 'Comic marketplace search',
          url: currentUrl
        })
        announceSuccess('Search shared successfully')
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(currentUrl)
        announceSuccess('Search URL copied to clipboard')
      }
      
      if (onShare) {
        onShare(currentUrl)
      }
    } catch (error) {
      announceError('Failed to share search')
      console.error('Share search error:', error)
    }
  }

  const handleCreateAlert = async () => {
    if (!isLoggedIn) {
      announceError('Please log in to create search alerts')
      return
    }

    try {
      const searchData = createSavedSearchData()
      
      if (onCreateAlert) {
        await onCreateAlert(searchData)
      }
      
      announceSuccess('Search alert created')
    } catch (error) {
      announceError('Failed to create search alert')
      console.error('Create alert error:', error)
    }
  }

  // Don't show if no search criteria
  if (!searchQuery && appliedFiltersCount === 0) {
    return null
  }

  const searchSummary = searchQuery
    ? `"${searchQuery}"${appliedFiltersCount > 0 ? ` with ${appliedFiltersCount} filters` : ''}`
    : `${appliedFiltersCount} active filters`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={isSaved ? "default" : "outline"}
          size="sm"
          className={className}
          disabled={isLoading}
          data-testid="save-search-button"
          aria-label={`Save search: ${searchSummary}`}
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-1" />
          ) : isSaved ? (
            <BookmarkCheck className="h-4 w-4 mr-1" />
          ) : (
            <Bookmark className="h-4 w-4 mr-1" />
          )}
          {isSaved ? 'Saved!' : 'Save Search'}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={handleSaveSearch}
          disabled={!isLoggedIn || isLoading}
          className="flex items-center"
        >
          <Bookmark className="h-4 w-4 mr-2" />
          <div className="flex flex-col">
            <span>Save Search</span>
            {!isLoggedIn && (
              <span className="text-xs text-muted-foreground">Login required</span>
            )}
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={handleCreateAlert}
          disabled={!isLoggedIn}
          className="flex items-center"
        >
          <Heart className="h-4 w-4 mr-2" />
          <div className="flex flex-col">
            <span>Create Alert</span>
            <span className="text-xs text-muted-foreground">
              Get notified of new matches
            </span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={handleShareSearch}
          className="flex items-center"
        >
          <Share className="h-4 w-4 mr-2" />
          <div className="flex flex-col">
            <span>Share Search</span>
            <span className="text-xs text-muted-foreground">
              Copy link to clipboard
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Export as default for backward compatibility
export default SaveSearchButton
