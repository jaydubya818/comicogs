'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Search, Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatFilterValue } from '@/lib/filters/formatters'
import { useLiveAnnouncer } from '@/lib/accessibility/useLiveAnnouncer'

interface Filter {
  key: string
  value: string | string[]
  label: string
  type: 'text' | 'select' | 'range' | 'multiselect'
}

interface ResultsSummaryBarProps {
  totalResults: number
  currentPage: number
  totalPages: number
  appliedFilters: Filter[]
  onRemoveFilter: (filterKey: string, value?: string) => void
  onClearAllFilters: () => void
  onSaveSearch: () => void
  searchQuery?: string
  isLoading?: boolean
}

export function ResultsSummaryBar({
  totalResults,
  currentPage,
  totalPages,
  appliedFilters,
  onRemoveFilter,
  onClearAllFilters,
  onSaveSearch,
  searchQuery,
  isLoading = false
}: ResultsSummaryBarProps) {
  const [focusedChipIndex, setFocusedChipIndex] = useState<number>(-1)
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([])
  const { announce } = useLiveAnnouncer()

  // Calculate results range for current page
  const resultsPerPage = 20 // This would typically come from props or config
  const startResult = (currentPage - 1) * resultsPerPage + 1
  const endResult = Math.min(currentPage * resultsPerPage, totalResults)

  // Handle keyboard navigation through filter chips
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (appliedFilters.length === 0) return

      switch (event.key) {
        case 'ArrowRight':
          if (focusedChipIndex < appliedFilters.length - 1) {
            const nextIndex = focusedChipIndex + 1
            setFocusedChipIndex(nextIndex)
            chipRefs.current[nextIndex]?.focus()
            event.preventDefault()
          }
          break
        case 'ArrowLeft':
          if (focusedChipIndex > 0) {
            const prevIndex = focusedChipIndex - 1
            setFocusedChipIndex(prevIndex)
            chipRefs.current[prevIndex]?.focus()
            event.preventDefault()
          }
          break
        case 'Home':
          setFocusedChipIndex(0)
          chipRefs.current[0]?.focus()
          event.preventDefault()
          break
        case 'End':
          const lastIndex = appliedFilters.length - 1
          setFocusedChipIndex(lastIndex)
          chipRefs.current[lastIndex]?.focus()
          event.preventDefault()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [focusedChipIndex, appliedFilters.length])

  const handleRemoveFilter = (filterKey: string, value?: string) => {
    const removedFilter = appliedFilters.find(f => f.key === filterKey)
    if (removedFilter) {
      announce(`Removed filter: ${removedFilter.label}`)
    }
    onRemoveFilter(filterKey, value)
  }

  const handleClearAllFilters = () => {
    if (appliedFilters.length > 0) {
      announce(`Cleared all ${appliedFilters.length} filters`)
    }
    onClearAllFilters()
  }

  const handleSaveSearch = () => {
    announce('Search saved successfully')
    onSaveSearch()
  }

  return (
    <div 
      className="bg-white border-b border-gray-200 px-4 py-3 sm:px-6"
      data-testid="results-summary-bar"
      role="region"
      aria-label="Search results summary and filters"
    >
      <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
        {/* Results count and pagination info */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                <span className="text-sm text-gray-500">Loading results...</span>
              </div>
            ) : (
              <div className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">{startResult.toLocaleString()}</span>
                {' '}-{' '}
                <span className="font-medium">{endResult.toLocaleString()}</span>
                {' '}of{' '}
                <span className="font-medium">{totalResults.toLocaleString()}</span>
                {' '}results
                {totalPages > 1 && (
                  <span className="ml-2 text-gray-500">
                    (Page {currentPage} of {totalPages})
                  </span>
                )}
              </div>
            )}

            {/* Save search button */}
            {(searchQuery || appliedFilters.length > 0) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveSearch}
                className="mt-2 sm:mt-0"
                data-testid="save-search-button"
                aria-label="Save current search and filters"
              >
                <Bookmark className="h-4 w-4 mr-1" />
                Save Search
              </Button>
            )}
          </div>
        </div>

        {/* Clear all filters button */}
        {appliedFilters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAllFilters}
            className="text-gray-500 hover:text-gray-700"
            data-testid="clear-all-filters"
            aria-label={`Clear all ${appliedFilters.length} filters`}
          >
            Clear all filters
          </Button>
        )}
      </div>

      {/* Applied filters */}
      {appliedFilters.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Active Filters:
            </span>
          </div>
          
          <div 
            className="mt-2 flex flex-wrap gap-2"
            role="group"
            aria-label="Applied search filters"
          >
            {appliedFilters.map((filter, index) => {
              const formattedValue = formatFilterValue(filter.value, filter.type)
              const chipId = `filter-chip-${filter.key}-${index}`
              
              return (
                <Badge
                  key={chipId}
                  ref={(el) => (chipRefs.current[index] = el as HTMLButtonElement)}
                  variant="secondary"
                  className="group relative pr-8 pl-3 py-1 text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 cursor-pointer transition-colors"
                  onClick={() => handleRemoveFilter(filter.key, typeof filter.value === 'string' ? filter.value : undefined)}
                  onFocus={() => setFocusedChipIndex(index)}
                  onBlur={() => setFocusedChipIndex(-1)}
                  tabIndex={0}
                  role="button"
                  aria-label={`Remove filter: ${filter.label} - ${formattedValue}`}
                  data-testid="filter-chip"
                  id={chipId}
                >
                  <span className="truncate max-w-48">
                    <span className="font-medium">{filter.label}:</span>{' '}
                    <span>{formattedValue}</span>
                  </span>
                  
                  <button
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-blue-200 focus:outline-none focus:ring-1 focus:ring-blue-400 group-hover:opacity-100 opacity-75 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveFilter(filter.key, typeof filter.value === 'string' ? filter.value : undefined)
                    }}
                    aria-label={`Remove ${filter.label} filter`}
                    data-testid="filter-chip-remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )
            })}
          </div>

          {/* Keyboard navigation hint */}
          {appliedFilters.length > 1 && (
            <div className="mt-2">
              <span className="text-xs text-gray-400">
                Use arrow keys to navigate between filters, Enter or Space to remove
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}