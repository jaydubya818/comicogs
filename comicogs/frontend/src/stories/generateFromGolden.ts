#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';

interface GoldenQuery {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: Record<string, any>;
  body?: Record<string, any>;
  expectedStatus: number;
  assertions: {
    field: string;
    type: 'exists' | 'equals' | 'contains' | 'gt' | 'lt' | 'length';
    value?: any;
  }[];
}

// Map endpoints to components
const endpointToComponent = {
  '/api/comics': {
    component: 'ComicsList',
    import: 'comics/ComicsList',
    props: 'comics, pagination',
  },
  '/api/listings': {
    component: 'ListingsList', 
    import: 'listings/ListingsList',
    props: 'listings, pagination',
  },
  '/api/collection': {
    component: 'VaultTable',
    import: 'vault/VaultTable', 
    props: 'collection',
  },
  '/api/saved-searches': {
    component: 'SavedSearchesList',
    import: 'marketplace/SavedSearchesList',
    props: 'savedSearches',
  },
};

const generateStoryContent = (query: GoldenQuery, componentInfo: any): string => {
  const componentName = componentInfo.component;
  const importPath = componentInfo.import;
  const queryId = query.id;
  const storyName = query.name.replace(/[^a-zA-Z0-9]/g, '');
  
  return `import type { Meta, StoryObj } from '@storybook/react';
import { ${componentName} } from '@/components/${importPath}';
import { mockFetch, mockApiResponses } from '../mocks/handlers';

// Mock fetch for this story
const originalFetch = global.fetch;
beforeEach(() => {
  global.fetch = mockFetch as any;
});

afterEach(() => {
  global.fetch = originalFetch;
});

const meta: Meta<typeof ${componentName}> = {
  title: 'Generated/${componentName}',
  component: ${componentName},
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: '${query.description}',
      },
    },
  },
  tags: ['autodocs', 'golden-query'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ${storyName}: Story = {
  name: '${query.name}',
  parameters: {
    docs: {
      description: {
        story: \`
          **Golden Query ID:** \`${queryId}\`
          **Endpoint:** \`${query.method} ${query.endpoint}\`
          **Expected Status:** \`${query.expectedStatus}\`
          
          ${query.description}
          
          **Test Parameters:**
          ${query.params ? JSON.stringify(query.params, null, 2) : 'None'}
          
          **Assertions:**
          ${query.assertions.map(a => `- ${a.field} ${a.type} ${a.value || ''}`).join('\\n')}
        \`,
      },
    },
  },
  args: {
    // Props will be populated by mock data
    ${componentInfo.props.split(', ').map((prop: string) => `${prop.trim()}: mockApiResponses['${query.endpoint}']?.data || []`).join(',\n    ')}
  },
};

// Additional stories for different states
export const ${storyName}Loading: Story = {
  name: '${query.name} (Loading)',
  args: {
    ${componentInfo.props.split(', ').map((prop: string) => `${prop.trim()}: []`).join(',\n    ')},
    isLoading: true,
  },
};

export const ${storyName}Error: Story = {
  name: '${query.name} (Error)',
  args: {
    ${componentInfo.props.split(', ').map((prop: string) => `${prop.trim()}: []`).join(',\n    ')},
    error: 'Failed to load data',
  },
};

export const ${storyName}Empty: Story = {
  name: '${query.name} (Empty)',
  args: {
    ${componentInfo.props.split(', ').map((prop: string) => `${prop.trim()}: []`).join(',\n    ')},
  },
};
`;
};

const generateComponentStories = (queries: GoldenQuery[]): string => {
  const components = ['Navbar', 'Hero', 'ListingCard', 'ThemeMenu'];
  
  return components.map(component => `
import type { Meta, StoryObj } from '@storybook/react';
import { ${component} } from '@/components/ui/patterns/${component}';

const meta: Meta<typeof ${component}> = {
  title: 'UI/${component}',
  component: ${component},
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LightTheme: Story = {
  parameters: {
    theme: 'light',
  },
};

export const DarkTheme: Story = {
  parameters: {
    theme: 'dark',
  },
};
`).join('\n\n');
};

async function generateStoriesFromGolden() {
  try {
    // Read golden queries from backend
    const goldenPath = path.join(process.cwd(), '../backend/golden-queries.json');
    const goldenData = await fs.readFile(goldenPath, 'utf-8');
    const queries: GoldenQuery[] = JSON.parse(goldenData);
    
    console.log(`Found ${queries.length} golden queries`);
    
    const storiesDir = path.join(process.cwd(), 'src/stories/generated');
    
    // Create stories directory if it doesn't exist
    try {
      await fs.mkdir(storiesDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
    
    let generatedCount = 0;
    
    // Generate stories for each matching endpoint
    for (const query of queries) {
      const componentInfo = endpointToComponent[query.endpoint as keyof typeof endpointToComponent];
      
      if (componentInfo && query.method === 'GET') {
        const storyContent = generateStoryContent(query, componentInfo);
        const fileName = `${query.id.replace(/[^a-zA-Z0-9]/g, '_')}.stories.tsx`;
        const filePath = path.join(storiesDir, fileName);
        
        await fs.writeFile(filePath, storyContent);
        console.log(`Generated story: ${fileName}`);
        generatedCount++;
      }
    }
    
    // Generate component stories
    const componentStories = generateComponentStories(queries);
    await fs.writeFile(
      path.join(storiesDir, 'Components.stories.tsx'),
      componentStories
    );
    
    console.log(`\\n✅ Generated ${generatedCount} API stories + component stories`);
    console.log(`📁 Stories location: src/stories/generated/`);
    console.log(`🚀 Run 'npm run storybook' to view stories`);
    
  } catch (error: any) {
    console.error('❌ Failed to generate stories:', error.message);
    
    if (error.code === 'ENOENT' && error.path?.includes('golden-queries.json')) {
      console.log('💡 Run the backend golden dataset generator first:');
      console.log('   cd ../backend && npm run golden:generate');
    }
    
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  generateStoriesFromGolden();
}

export { generateStoriesFromGolden };
