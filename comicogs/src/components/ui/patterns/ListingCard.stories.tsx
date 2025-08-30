import type { Meta, StoryObj } from '@storybook/react';
import ListingCard from './ListingCard';

const meta: Meta<typeof ListingCard> = {
  title: 'Components/ListingCard',
  component: ListingCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Comic book title',
    },
    issue: {
      control: 'text',
      description: 'Issue number',
    },
    series: {
      control: 'text',
      description: 'Comic series name',
    },
    publisher: {
      control: 'text',
      description: 'Publisher name',
    },
    grade: {
      control: 'text',
      description: 'Comic grade',
    },
    price: {
      control: 'number',
      description: 'Current price',
    },
    originalPrice: {
      control: 'number',
      description: 'Original/retail price',
    },
    condition: {
      control: 'text',
      description: 'Condition description',
    },
    sellerName: {
      control: 'text',
      description: 'Seller name',
    },
    viewCount: {
      control: 'number',
      description: 'Number of views',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '320px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: '1',
    title: 'Amazing Spider-Man',
    issue: '#1',
    series: 'Amazing Spider-Man',
    publisher: 'Marvel Comics',
    grade: '9.8',
    price: 2500,
    originalPrice: 3000,
    coverImage: 'https://via.placeholder.com/200x300/dc2626/ffffff?text=ASM+%231',
    condition: 'Near Mint',
    sellerName: 'ComicVault Pro',
    viewCount: 1250,
  },
};

export const HighValue: Story = {
  args: {
    id: '2',
    title: 'X-Men',
    issue: '#1',
    series: 'X-Men',
    publisher: 'Marvel Comics',
    grade: '9.6',
    price: 15000,
    originalPrice: 18000,
    coverImage: 'https://via.placeholder.com/200x300/1e40af/ffffff?text=X-Men+%231',
    condition: 'Near Mint',
    sellerName: 'Legendary Comics',
    viewCount: 3420,
  },
};

export const Affordable: Story = {
  args: {
    id: '3',
    title: 'Batman',
    issue: '#423',
    series: 'Batman',
    publisher: 'DC Comics',
    grade: '8.5',
    price: 45,
    originalPrice: 60,
    coverImage: 'https://via.placeholder.com/200x300/374151/ffffff?text=Batman+%23423',
    condition: 'Very Fine',
    sellerName: 'Daily Comics',
    viewCount: 89,
  },
};

export const Vintage: Story = {
  args: {
    id: '4',
    title: 'Action Comics',
    issue: '#252',
    series: 'Action Comics',
    publisher: 'DC Comics',
    grade: '7.0',
    price: 1200,
    originalPrice: 1500,
    coverImage: 'https://via.placeholder.com/200x300/dc2626/ffffff?text=Action+%23252',
    condition: 'Fine/Very Fine',
    sellerName: 'Golden Age Comics',
    viewCount: 567,
  },
};

export const ModernIssue: Story = {
  args: {
    id: '5',
    title: 'The Walking Dead',
    issue: '#193',
    series: 'The Walking Dead',
    publisher: 'Image Comics',
    grade: '9.8',
    price: 85,
    originalPrice: 100,
    coverImage: 'https://via.placeholder.com/200x300/059669/ffffff?text=TWD+%23193',
    condition: 'Near Mint',
    sellerName: 'Modern Comics Hub',
    viewCount: 234,
  },
};

export const LongTitle: Story = {
  args: {
    id: '6',
    title: 'Teenage Mutant Ninja Turtles',
    issue: '#1',
    series: 'Teenage Mutant Ninja Turtles',
    publisher: 'Mirage Studios',
    grade: '9.0',
    price: 8500,
    originalPrice: 10000,
    coverImage: 'https://via.placeholder.com/200x300/16a34a/ffffff?text=TMNT+%231',
    condition: 'Very Fine/Near Mint',
    sellerName: 'Retro Comics Warehouse',
    viewCount: 2100,
  },
};
