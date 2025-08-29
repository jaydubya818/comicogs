import type { Meta, StoryObj } from '@storybook/react';
import Hero from './Hero';

const meta: Meta<typeof Hero> = {
  title: 'Components/Hero',
  component: Hero,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Main hero title',
    },
    subtitle: {
      control: 'text',
      description: 'Hero subtitle',
    },
    description: {
      control: 'text',
      description: 'Hero description text',
    },
    primaryCtaText: {
      control: 'text',
      description: 'Primary call-to-action button text',
    },
    secondaryCtaText: {
      control: 'text',
      description: 'Secondary call-to-action button text',
    },
    backgroundImage: {
      control: 'text',
      description: 'Background image URL',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Your Comic Universe',
    subtitle: 'Organized.',
    description: 'Discover, collect, and trade comics with the ultimate platform for comic book enthusiasts.',
    primaryCtaText: 'Start Collecting',
    secondaryCtaText: 'Browse Comics',
    backgroundImage: 'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=1200&h=800&fit=crop',
  },
};

export const CustomContent: Story = {
  args: {
    title: 'Welcome to',
    subtitle: 'Comic Central',
    description: 'The premier destination for comic book collectors and enthusiasts worldwide.',
    primaryCtaText: 'Join Now',
    secondaryCtaText: 'Learn More',
    backgroundImage: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=800&fit=crop',
  },
};

export const MinimalContent: Story = {
  args: {
    title: 'Collect',
    subtitle: 'Trade',
    description: 'Simple comic collection management.',
    primaryCtaText: 'Get Started',
    secondaryCtaText: 'Explore',
  },
};

export const LongContent: Story = {
  args: {
    title: 'The Ultimate Comic Book Collection Platform',
    subtitle: 'For Serious Collectors',
    description: 'Discover rare issues, track your collection value, connect with other collectors, and build the ultimate comic book library with advanced search, AI-powered recommendations, and marketplace integration.',
    primaryCtaText: 'Start Your Collection Journey',
    secondaryCtaText: 'View Demo Gallery',
  },
};
