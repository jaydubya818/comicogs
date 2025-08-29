import type { Meta, StoryObj } from '@storybook/react';
import Navbar from './Navbar';

const meta: Meta<typeof Navbar> = {
  title: 'Components/Navbar',
  component: Navbar,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    logoText: {
      control: 'text',
      description: 'Text displayed in the logo area',
    },
    userName: {
      control: 'text', 
      description: 'User name displayed in the profile menu',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    logoText: 'Comicogs',
    userName: 'John Doe',
  },
};

export const CustomBranding: Story = {
  args: {
    logoText: 'My Comic Store',
    userName: 'Jane Smith',
  },
};

export const LongUserName: Story = {
  args: {
    logoText: 'Comicogs',
    userName: 'Christopher Alexander Johnson',
  },
};
