import type { Meta, StoryObj } from '@storybook/react';
import ThemeMenu from './ThemeMenu';

const meta: Meta<typeof ThemeMenu> = {
  title: 'Components/ThemeMenu',
  component: ThemeMenu,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InNavbar: Story = {
  decorators: [
    (Story) => (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1rem',
        padding: '1rem',
        backgroundColor: 'var(--background)',
        border: '1px solid var(--border)',
        borderRadius: '0.5rem'
      }}>
        <span>Navigation Items</span>
        <div style={{ marginLeft: 'auto' }}>
          <Story />
        </div>
      </div>
    ),
  ],
};

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <Story />
      </div>
    ),
  ],
};
