import type { Meta, StoryObj } from '@storybook/react'
import { AppShell, MarketplaceShell, CollectionShell, AdminShell } from './AppShell'

const meta: Meta<typeof AppShell> = {
  title: 'Layout/AppShell',
  component: AppShell,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The AppShell component provides consistent page layout with header, breadcrumbs, main content area, and footer. It includes specialized variants for different sections of the application.',
      },
    },
  },
  argTypes: {
    showHeader: {
      control: 'boolean',
      description: 'Whether to show the navigation header',
    },
    showBreadcrumbs: {
      control: 'boolean', 
      description: 'Whether to show breadcrumb navigation',
    },
    showFooter: {
      control: 'boolean',
      description: 'Whether to show the footer',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Whether content should be full width or use container',
    },
    pageTitle: {
      control: 'text',
      description: 'Optional page title to display',
    },
    pageDescription: {
      control: 'text', 
      description: 'Optional page description to display',
    },
  },
} satisfies Meta<typeof AppShell>

export default meta
type Story = StoryObj<typeof meta>

const SampleContent = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="p-6 bg-card rounded-lg border border-border">
          <div className="h-32 bg-muted rounded mb-4" />
          <h3 className="font-semibold mb-2">Sample Card {i + 1}</h3>
          <p className="text-sm text-muted-foreground">
            This is sample content to demonstrate the AppShell layout and how content flows within it.
          </p>
        </div>
      ))}
    </div>
  </div>
)

// Default AppShell
export const Default: Story = {
  args: {
    children: <SampleContent />,
  },
}

// With page title and description
export const WithPageHeader: Story = {
  args: {
    pageTitle: 'Sample Page',
    pageDescription: 'This is a sample page to demonstrate the AppShell component with a page header.',
    children: <SampleContent />,
  },
}

// Without header
export const NoHeader: Story = {
  args: {
    showHeader: false,
    pageTitle: 'Content Only',
    pageDescription: 'This layout shows content without the main navigation header.',
    children: <SampleContent />,
  },
}

// Without breadcrumbs
export const NoBreadcrumbs: Story = {
  args: {
    showBreadcrumbs: false,
    pageTitle: 'No Breadcrumbs',
    pageDescription: 'This layout hides the breadcrumb navigation.',
    children: <SampleContent />,
  },
}

// Without footer
export const NoFooter: Story = {
  args: {
    showFooter: false,
    pageTitle: 'No Footer',
    pageDescription: 'This layout hides the footer for focused content experiences.',
    children: <SampleContent />,
  },
}

// Full width layout
export const FullWidth: Story = {
  args: {
    fullWidth: true,
    pageTitle: 'Full Width Layout',
    pageDescription: 'This layout uses the full width of the viewport instead of a container.',
    children: <SampleContent />,
  },
}

// Minimal layout
export const Minimal: Story = {
  args: {
    showHeader: false,
    showBreadcrumbs: false,
    showFooter: false,
    fullWidth: true,
    children: (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Minimal Layout</h1>
          <p className="text-muted-foreground">
            Perfect for authentication pages or focused experiences.
          </p>
        </div>
      </div>
    ),
  },
}

// Marketplace variant
export const MarketplaceVariant: Story = {
  render: (args) => (
    <MarketplaceShell {...args}>
      <SampleContent />
    </MarketplaceShell>
  ),
}

// Collection variant
export const CollectionVariant: Story = {
  render: (args) => (
    <CollectionShell {...args}>
      <SampleContent />
    </CollectionShell>
  ),
}

// Admin variant
export const AdminVariant: Story = {
  render: (args) => (
    <AdminShell 
      pageTitle="Admin Dashboard"
      pageDescription="Manage your application settings and data."
      {...args}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="p-4 bg-background rounded border border-border">
            <h4 className="font-medium mb-2">Admin Panel {i + 1}</h4>
            <p className="text-sm text-muted-foreground">
              Administrative content goes here.
            </p>
          </div>
        ))}
      </div>
    </AdminShell>
  ),
}

// Mobile viewport
export const Mobile: Story = {
  args: {
    pageTitle: 'Mobile Layout',
    pageDescription: 'How the AppShell appears on mobile devices.',
    children: <SampleContent />,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
}

// Tablet viewport  
export const Tablet: Story = {
  args: {
    pageTitle: 'Tablet Layout', 
    pageDescription: 'How the AppShell appears on tablet devices.',
    children: <SampleContent />,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
}