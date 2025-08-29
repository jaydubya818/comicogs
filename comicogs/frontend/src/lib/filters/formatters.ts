/**
 * Utility functions for formatting filter values for display
 */

export type FilterType = 'text' | 'select' | 'range' | 'multiselect'

/**
 * Formats a filter value for display in filter chips and summaries
 */
export function formatFilterValue(
  value: string | string[] | number | number[],
  type: FilterType
): string {
  if (value === null || value === undefined) {
    return ''
  }

  switch (type) {
    case 'text':
      return typeof value === 'string' ? `"${value}"` : String(value)

    case 'select':
      return typeof value === 'string' ? formatSelectValue(value) : String(value)

    case 'multiselect':
      if (Array.isArray(value)) {
        if (value.length === 1) {
          return formatSelectValue(String(value[0]))
        }
        return `${formatSelectValue(String(value[0]))} +${value.length - 1} more`
      }
      return typeof value === 'string' ? formatSelectValue(value) : String(value)

    case 'range':
      if (Array.isArray(value) && value.length === 2) {
        const [min, max] = value
        if (min === max) {
          return String(min)
        }
        return `${min} - ${max}`
      }
      return String(value)

    default:
      return String(value)
  }
}

/**
 * Formats select option values to be more human-readable
 */
function formatSelectValue(value: string): string {
  // Handle special formatting cases
  const formatMap: Record<string, string> = {
    // Condition values
    'mint': 'Mint',
    'near-mint': 'Near Mint',
    'very-fine': 'Very Fine',
    'fine': 'Fine',
    'very-good': 'Very Good',
    'good': 'Good',
    'fair': 'Fair',
    'poor': 'Poor',
    
    // Publisher values
    'marvel': 'Marvel Comics',
    'dc': 'DC Comics',
    'image': 'Image Comics',
    'dark-horse': 'Dark Horse Comics',
    'idw': 'IDW Publishing',
    'boom': 'BOOM! Studios',
    'valiant': 'Valiant Entertainment',
    'dynamite': 'Dynamite Entertainment',
    
    // Category values
    'superhero': 'Superhero',
    'horror': 'Horror',
    'sci-fi': 'Science Fiction',
    'fantasy': 'Fantasy',
    'western': 'Western',
    'romance': 'Romance',
    'comedy': 'Comedy',
    'crime': 'Crime',
    'war': 'War',
    'historical': 'Historical',
    
    // Sort values
    'newest': 'Newest First',
    'oldest': 'Oldest First',
    'price-low': 'Price: Low to High',
    'price-high': 'Price: High to Low',
    'title-az': 'Title: A to Z',
    'title-za': 'Title: Z to A',
    'relevance': 'Most Relevant',
    'popularity': 'Most Popular',
    
    // Grade values
    '10.0': 'CGC 10.0 (Gem Mint)',
    '9.9': 'CGC 9.9 (Mint)',
    '9.8': 'CGC 9.8 (Near Mint/Mint)',
    '9.6': 'CGC 9.6 (Near Mint+)',
    '9.4': 'CGC 9.4 (Near Mint)',
    '9.2': 'CGC 9.2 (Near Mint-)',
    '9.0': 'CGC 9.0 (Very Fine/Near Mint)',
    '8.5': 'CGC 8.5 (Very Fine+)',
    '8.0': 'CGC 8.0 (Very Fine)',
    '7.5': 'CGC 7.5 (Very Fine-)',
    '7.0': 'CGC 7.0 (Fine/Very Fine)',
    
    // Boolean values
    'true': 'Yes',
    'false': 'No',
    'on': 'Yes',
    'off': 'No'
  }

  // Check if we have a direct mapping
  if (formatMap[value.toLowerCase()]) {
    return formatMap[value.toLowerCase()]
  }

  // Handle price ranges
  if (value.startsWith('$') || /^\d+$/.test(value)) {
    const numValue = parseFloat(value.replace('$', ''))
    if (!isNaN(numValue)) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(numValue)
    }
  }

  // Handle year ranges
  if (/^\d{4}$/.test(value)) {
    return value
  }

  // Handle kebab-case and snake_case
  if (value.includes('-') || value.includes('_')) {
    return value
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  // Default: capitalize first letter
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

/**
 * Formats a filter label for display
 */
export function formatFilterLabel(key: string): string {
  const labelMap: Record<string, string> = {
    'search': 'Search',
    'category': 'Category',
    'publisher': 'Publisher',
    'condition': 'Condition',
    'grade': 'Grade',
    'price_min': 'Min Price',
    'price_max': 'Max Price',
    'year_start': 'From Year',
    'year_end': 'To Year',
    'sort': 'Sort By',
    'view': 'View',
    'per_page': 'Per Page',
    'in_stock': 'In Stock',
    'featured': 'Featured',
    'on_sale': 'On Sale',
    'new_arrival': 'New Arrivals',
    'creator': 'Creator',
    'character': 'Character',
    'series': 'Series',
    'issue_number': 'Issue Number',
    'variant': 'Variant Cover',
    'signed': 'Signed',
    'sketch': 'Has Sketch',
    'cgc': 'CGC Graded',
    'cbcs': 'CBCS Graded'
  }

  if (labelMap[key]) {
    return labelMap[key]
  }

  // Default formatting: convert snake_case to Title Case
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Creates a readable summary of all applied filters
 */
export function createFilterSummary(
  filters: Array<{
    key: string
    value: string | string[]
    type: FilterType
  }>
): string {
  if (filters.length === 0) {
    return 'No filters applied'
  }

  const parts = filters.map(filter => {
    const label = formatFilterLabel(filter.key)
    const value = formatFilterValue(filter.value, filter.type)
    return `${label}: ${value}`
  })

  if (parts.length === 1) {
    return parts[0]
  }

  if (parts.length === 2) {
    return `${parts[0]} and ${parts[1]}`
  }

  const last = parts.pop()
  return `${parts.join(', ')}, and ${last}`
}

/**
 * Formats a count with proper pluralization
 */
export function formatResultsCount(count: number, singular = 'result', plural = 'results'): string {
  const formattedCount = count.toLocaleString()
  return count === 1 ? `${formattedCount} ${singular}` : `${formattedCount} ${plural}`
}

/**
 * Formats pagination info
 */
export function formatPaginationInfo(
  currentPage: number,
  totalPages: number,
  totalResults: number,
  resultsPerPage: number
): {
  startResult: number
  endResult: number
  formattedRange: string
  formattedTotal: string
} {
  const startResult = (currentPage - 1) * resultsPerPage + 1
  const endResult = Math.min(currentPage * resultsPerPage, totalResults)
  
  return {
    startResult,
    endResult,
    formattedRange: `${startResult.toLocaleString()}-${endResult.toLocaleString()}`,
    formattedTotal: totalResults.toLocaleString()
  }
}