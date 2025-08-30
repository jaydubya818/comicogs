import type { Meta, StoryObj } from '@storybook/react'
import { 
  Empty, 
  SearchEmpty, 
  CollectionEmpty, 
  MarketplaceEmpty, 
  WantlistEmpty, 
  OrdersEmpty, 
  ReviewsEmpty,
  ErrorEmpty 
} from './Empty'
import { Search, Plus, Heart } from 'lucide-react'

const meta: Meta<typeof Empty> = {
  title: 'State/Empty',
  component: Empty,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Empty state components for when there is no content to display. Includes specialized variants for different sections and actions to guide users.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'search', 'collection', 'marketplace', 'wantlist', 'orders', 'reviews', 'users'],
      description: 'Visual variant that determines the icon and styling',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the empty state component',
    },
    title: {
      control: 'text',
      description: 'Main title text',
    },
    description: {
      control: 'text', 
      description: 'Descriptive text below the title',
    },
  },
} satisfies Meta<typeof Empty>

export default meta
type Story = StoryObj<typeof meta>

// Basic empty state
export const Default: Story = {
  args: {
    title: 'No items found',
    description: 'There are no items to display at the moment.',
  },
}

// Different sizes
export const SmallSize: Story = {
  args: {
    title: 'No items',
    description: 'Nothing to show here.',
    size: 'sm',
  },
}

export const LargeSize: Story = {
  args: {
    title: 'No items found',
    description: 'There are no items to display at the moment. Try adjusting your search or filters.',
    size: 'lg',
  },
}

// With actions
export const WithActions: Story = {
  args: {
    title: 'No comics in your collection',
    description: 'Start building your collection by adding your first comic book.',
    variant: 'collection',
    action: {
      label: 'Add Comic',
      onClick: () => console.log('Add comic clicked'),
    },
    secondaryAction: {
      label: 'Browse Marketplace',
      onClick: () => console.log('Browse clicked'),
      variant: 'outline',
    },
  },
}

// Custom icon
export const CustomIcon: Story = {
  args: {
    title: 'No favorites yet',
    description: 'Comics you like will appear here.',
    icon: Heart,
    action: {
      label: 'Explore Comics',
      onClick: () => console.log('Explore clicked'),
    },
  },
}

// With custom content
export const WithCustomContent: Story = {
  args: {
    title: 'Welcome to Comicogs!',
    description: 'Get started by exploring these popular features.',
    children: (
      <div className="flex flex-col sm:flex-row gap-4 mt-6">
        <div className="flex-1 p-4 bg-card border border-border rounded-lg">
          <Search className="h-8 w-8 text-primary mb-2" />
          <h4 className="font-medium mb-1">Discover Comics</h4>
          <p className="text-sm text-muted-foreground">
            Browse thousands of comics from collectors worldwide.
          </p>
        </div>
        <div className="flex-1 p-4 bg-card border border-border rounded-lg">
          <Plus className="h-8 w-8 text-primary mb-2" />
          <h4 className="font-medium mb-1">Build Collection</h4>
          <p className="text-sm text-muted-foreground">
            Add comics to your personal collection and track their value.
          </p>
        </div>
      </div>
    ),
  },
}

// Different variants
export const SearchVariant: Story = {
  render: () => (
    <SearchEmpty query="spider-man rare" />
  ),
}

export const CollectionVariant: Story = {
  render: () => <CollectionEmpty />,
}

export const MarketplaceVariant: Story = {
  render: () => <MarketplaceEmpty />,
}

export const WantlistVariant: Story = {
  render: () => <WantlistEmpty />,
}

export const OrdersVariant: Story = {
  render: () => <OrdersEmpty />,
}

export const ReviewsVariant: Story = {
  render: () => <ReviewsEmpty />,
}

// Error variant
export const ErrorVariant: Story = {
  render: () => (
    <ErrorEmpty 
      error="Failed to load data"
      onRetry={() => console.log('Retry clicked')}
    />
  ),
}

// In different container sizes
export const InSmallContainer: Story = {
  args: {
    title: 'No results',
    description: 'Try a different search term.',
    variant: 'search',
    size: 'sm',
  },
  decorators: [
    (Story) => (
      <div className="max-w-sm mx-auto border border-border rounded-lg p-4">
        <Story />
      </div>
    ),
  ],
}

export const InLargeContainer: Story = {
  args: {
    title: 'Your collection is empty',
    description: 'Start building your comic collection by adding your first comic book. You can browse our marketplace or add comics manually.',
    variant: 'collection',
    size: 'lg',
    action: {
      label: 'Add First Comic',
      onClick: () => console.log('Add comic clicked'),
    },
    secondaryAction: {
      label: 'Browse Marketplace', 
      onClick: () => console.log('Browse clicked'),
      variant: 'outline',
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-4xl mx-auto min-h-[500px] flex items-center">
        <Story />
      </div>
    ),
  ],
}

// Dark mode
export const DarkMode: Story = {
  args: {
    title: 'No comics found',
    description: 'Your search didn\'t return any results. Try adjusting your filters or search terms.',
    variant: 'search',
    action: {
      label: 'Clear Filters',
      onClick: () => console.log('Clear filters'),
      variant: 'outline',
    },
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <div className="bg-background text-foreground p-8">
          <Story />
        </div>
      </div>
    ),
  ],
}

// Multiple empty states side by side
export const MultipleStates: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div className="border border-border rounded-lg p-4">
        <Empty
          title="No search results"
          description="Try different keywords."
          variant="search"
          size="sm"
        />
      </div>
      <div className="border border-border rounded-lg p-4">
        <Empty
          title="Collection empty"
          description="Add your first comic."
          variant="collection"
          size="sm"
        />
      </div>
      <div className="border border-border rounded-lg p-4">
        <Empty
          title="No orders yet"
          description="Start shopping!"
          variant="orders"
          size="sm"
        />
      </div>
    </div>
  ),
}